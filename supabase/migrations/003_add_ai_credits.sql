-- Credit-based AI usage policy

alter table public.profiles
add column if not exists plan_type text not null default 'free';

alter table public.profiles
alter column credit set default 200;

update public.profiles
set credit = 200
where credit = 100;

create or replace function public.prevent_client_credit_update()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null
    and current_setting('app.credit_mutation', true) is distinct from 'on' then
    if new.credit is distinct from old.credit then
      raise exception 'profiles.credit cannot be changed by client requests';
    end if;

    if new.plan_type is distinct from old.plan_type then
      raise exception 'profiles.plan_type cannot be changed by client requests';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_client_credit_update_trigger on public.profiles;
create trigger prevent_client_credit_update_trigger
before update on public.profiles
for each row
execute function public.prevent_client_credit_update();

alter table public.profiles
drop constraint if exists profiles_plan_type_check;

alter table public.profiles
add constraint profiles_plan_type_check
check (plan_type in ('free', 'pro', 'unlimited'));

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert with check (id = auth.uid() and credit = 200 and plan_type = 'free');

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  balance_after integer not null,
  type text not null,
  feature text,
  related_entity_type text,
  related_entity_id text,
  reason text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature text not null,
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost numeric(12, 8) not null default 0,
  related_entity_type text,
  related_entity_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_transactions_user_created_at
on public.credit_transactions(user_id, created_at desc);

create index if not exists idx_ai_usage_logs_user_created_at
on public.ai_usage_logs(user_id, created_at desc);

alter table public.credit_transactions enable row level security;
alter table public.ai_usage_logs enable row level security;

drop policy if exists credit_transactions_select_own on public.credit_transactions;
create policy credit_transactions_select_own on public.credit_transactions
for select using (auth.uid() = user_id);

drop policy if exists ai_usage_logs_select_own on public.ai_usage_logs;
create policy ai_usage_logs_select_own on public.ai_usage_logs
for select using (auth.uid() = user_id);

create or replace function public.consume_credits(
  p_amount integer,
  p_feature text,
  p_idempotency_key text,
  p_related_entity_type text default null,
  p_related_entity_id text default null
)
returns table(success boolean, balance_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance integer;
  v_plan_type text;
  v_existing_balance integer;
begin
  if v_user_id is null then
    raise exception 'Unauthenticated';
  end if;

  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  select ct.balance_after into v_existing_balance
  from public.credit_transactions ct
  where ct.idempotency_key = p_idempotency_key;

  if v_existing_balance is not null then
    return query select true, v_existing_balance;
    return;
  end if;

  select credit, plan_type into v_balance, v_plan_type
  from public.profiles
  where id = v_user_id
  for update;

  if v_plan_type = 'unlimited' then
    insert into public.credit_transactions (
      user_id,
      amount,
      balance_after,
      type,
      feature,
      related_entity_type,
      related_entity_id,
      idempotency_key
    ) values (
      v_user_id,
      0,
      v_balance,
      'AI_USAGE_UNLIMITED',
      p_feature,
      p_related_entity_type,
      p_related_entity_id,
      p_idempotency_key
    );

    return query select true, v_balance;
    return;
  end if;

  perform set_config('app.credit_mutation', 'on', true);

  update public.profiles
  set credit = credit - p_amount
  where id = v_user_id
    and credit >= p_amount
  returning credit into v_balance;

  if v_balance is null then
    return query select false, null::integer;
    return;
  end if;

  insert into public.credit_transactions (
    user_id,
    amount,
    balance_after,
    type,
    feature,
    related_entity_type,
    related_entity_id,
    idempotency_key
  ) values (
    v_user_id,
    -p_amount,
    v_balance,
    'AI_USAGE',
    p_feature,
    p_related_entity_type,
    p_related_entity_id,
    p_idempotency_key
  );

  return query select true, v_balance;
end;
$$;

create or replace function public.refund_credits(
  p_idempotency_key text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_transaction public.credit_transactions%rowtype;
  v_balance integer;
  v_refund_key text := p_idempotency_key || ':refund';
begin
  if v_user_id is null then
    raise exception 'Unauthenticated';
  end if;

  select * into v_transaction
  from public.credit_transactions
  where idempotency_key = p_idempotency_key
    and user_id = v_user_id
  for update;

  if not found or v_transaction.amount >= 0 then
    return;
  end if;

  if exists (select 1 from public.credit_transactions where idempotency_key = v_refund_key) then
    return;
  end if;

  perform set_config('app.credit_mutation', 'on', true);

  update public.profiles
  set credit = credit + abs(v_transaction.amount)
  where id = v_user_id
  returning credit into v_balance;

  insert into public.credit_transactions (
    user_id,
    amount,
    balance_after,
    type,
    feature,
    related_entity_type,
    related_entity_id,
    reason,
    idempotency_key
  ) values (
    v_user_id,
    abs(v_transaction.amount),
    v_balance,
    'REFUND',
    v_transaction.feature,
    v_transaction.related_entity_type,
    v_transaction.related_entity_id,
    p_reason,
    v_refund_key
  );
end;
$$;

create or replace function public.record_ai_usage(
  p_user_id uuid,
  p_feature text,
  p_model text,
  p_prompt_tokens integer,
  p_completion_tokens integer,
  p_total_tokens integer,
  p_estimated_cost numeric,
  p_related_entity_type text default null,
  p_related_entity_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthenticated';
  end if;

  insert into public.ai_usage_logs (
    user_id,
    feature,
    model,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    estimated_cost,
    related_entity_type,
    related_entity_id
  ) values (
    p_user_id,
    p_feature,
    p_model,
    greatest(p_prompt_tokens, 0),
    greatest(p_completion_tokens, 0),
    greatest(p_total_tokens, 0),
    greatest(p_estimated_cost, 0),
    p_related_entity_type,
    p_related_entity_id
  );
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, email, credit, position, plan_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'User'),
    coalesce(new.email, ''),
    200,
    'NONE',
    'free'
  )
  on conflict (id) do update set
    nickname = excluded.nickname,
    email = excluded.email;

  insert into public.credit_transactions (
    user_id,
    amount,
    balance_after,
    type,
    reason,
    idempotency_key
  ) values (
    new.id,
    200,
    200,
    'SIGNUP_BONUS',
    '가입 축하 크레딧',
    'signup:' || new.id::text
  )
  on conflict (idempotency_key) do nothing;

  return new;
end;
$$;
