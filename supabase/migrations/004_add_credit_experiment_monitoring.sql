-- Credit experiment monitoring

create table if not exists public.experiment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  experiment_key text,
  variant text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_experiment_events_user_created_at
on public.experiment_events(user_id, created_at desc);

create index if not exists idx_experiment_events_name_created_at
on public.experiment_events(event_name, created_at desc);

create index if not exists idx_experiment_events_key_name_created_at
on public.experiment_events(experiment_key, event_name, created_at desc);

alter table public.experiment_events enable row level security;

drop policy if exists experiment_events_select_own on public.experiment_events;
create policy experiment_events_select_own on public.experiment_events
for select using (auth.uid() = user_id);

create or replace function public.record_experiment_event(
  p_event_name text,
  p_experiment_key text default null,
  p_variant text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Unauthenticated';
  end if;

  insert into public.experiment_events (
    user_id,
    event_name,
    experiment_key,
    variant,
    metadata
  ) values (
    v_user_id,
    p_event_name,
    p_experiment_key,
    p_variant,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

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
  v_insufficient_key text := p_idempotency_key || ':insufficient';
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
    select credit into v_balance
    from public.profiles
    where id = v_user_id;

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
      0,
      v_balance,
      'INSUFFICIENT_CREDITS',
      p_feature,
      p_related_entity_type,
      p_related_entity_id,
      'required:' || p_amount::text,
      v_insufficient_key
    ) on conflict (idempotency_key) do nothing;

    return query select false, v_balance;
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
