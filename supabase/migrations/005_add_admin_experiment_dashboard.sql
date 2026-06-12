-- Admin-only experiment dashboard data

alter table public.profiles
add column if not exists role text not null default 'user';

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('user', 'admin'));

create or replace function public.get_credit_experiment_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_admin boolean;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'Unauthenticated';
  end if;

  select exists (
    select 1
    from public.profiles
    where id = v_user_id
      and role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Forbidden';
  end if;

  with
  event_summary as (
    select
      count(*) filter (where event_name = 'credit_insufficient_viewed')::integer as shortage_views,
      count(*) filter (where event_name = 'pro_waitlist_clicked')::integer as pro_clicks
    from public.experiment_events
    where experiment_key = 'credit_shortage_pro'
  ),
  credit_summary as (
    select
      count(*) filter (where type = 'INSUFFICIENT_CREDITS')::integer as insufficient_events,
      coalesce(sum(abs(amount)) filter (where amount < 0), 0)::integer as spent_credits
    from public.credit_transactions
  ),
  usage_summary as (
    select
      count(*)::integer as ai_calls,
      coalesce(sum(estimated_cost), 0)::numeric as estimated_cost
    from public.ai_usage_logs
  ),
  daily as (
    select
      day::date,
      coalesce(count(e.id) filter (where e.event_name = 'credit_insufficient_viewed'), 0)::integer as shortage_views,
      coalesce(count(e.id) filter (where e.event_name = 'pro_waitlist_clicked'), 0)::integer as pro_clicks,
      coalesce((
        select count(*)::integer
        from public.credit_transactions ct
        where ct.type = 'INSUFFICIENT_CREDITS'
          and ct.created_at >= day
          and ct.created_at < day + interval '1 day'
      ), 0) as insufficient_events,
      coalesce((
        select count(*)::integer
        from public.ai_usage_logs aul
        where aul.created_at >= day
          and aul.created_at < day + interval '1 day'
      ), 0) as ai_calls
    from generate_series(
      date_trunc('day', now()) - interval '13 days',
      date_trunc('day', now()),
      interval '1 day'
    ) day
    left join public.experiment_events e
      on e.experiment_key = 'credit_shortage_pro'
      and e.created_at >= day
      and e.created_at < day + interval '1 day'
    group by day
    order by day
  ),
  features as (
    select feature
    from public.ai_usage_logs
    union
    select feature
    from public.credit_transactions
    where feature is not null
    union
    select metadata->>'feature' as feature
    from public.experiment_events
    where experiment_key = 'credit_shortage_pro'
      and metadata ? 'feature'
  ),
  feature_stats as (
    select
      f.feature,
      coalesce((
        select count(*)::integer
        from public.experiment_events e
        where e.experiment_key = 'credit_shortage_pro'
          and e.event_name = 'credit_insufficient_viewed'
          and e.metadata->>'feature' = f.feature
      ), 0) as shortage_views,
      coalesce((
        select count(*)::integer
        from public.experiment_events e
        where e.experiment_key = 'credit_shortage_pro'
          and e.event_name = 'pro_waitlist_clicked'
          and e.metadata->>'feature' = f.feature
      ), 0) as pro_clicks,
      coalesce((
        select count(*)::integer
        from public.credit_transactions ct
        where ct.type = 'INSUFFICIENT_CREDITS'
          and ct.feature = f.feature
      ), 0) as insufficient_events,
      coalesce((
        select count(*)::integer
        from public.ai_usage_logs aul
        where aul.feature = f.feature
      ), 0) as ai_calls,
      coalesce((
        select sum(aul.estimated_cost)::numeric
        from public.ai_usage_logs aul
        where aul.feature = f.feature
      ), 0) as estimated_cost,
      coalesce((
        select sum(abs(ct.amount))::integer
        from public.credit_transactions ct
        where ct.amount < 0
          and ct.feature = f.feature
      ), 0) as spent_credits
    from features f
    where f.feature is not null
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'shortageViews', es.shortage_views,
      'proClicks', es.pro_clicks,
      'ctaCtr', case when es.shortage_views = 0 then 0 else round(es.pro_clicks::numeric / es.shortage_views * 100, 2) end,
      'insufficientEvents', cs.insufficient_events,
      'aiCalls', us.ai_calls,
      'estimatedCost', us.estimated_cost,
      'spentCredits', cs.spent_credits
    ),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', to_char(day, 'YYYY-MM-DD'),
        'shortageViews', shortage_views,
        'proClicks', pro_clicks,
        'insufficientEvents', insufficient_events,
        'aiCalls', ai_calls
      ) order by day)
      from daily
    ), '[]'::jsonb),
    'features', coalesce((
      select jsonb_agg(jsonb_build_object(
        'feature', feature,
        'shortageViews', shortage_views,
        'proClicks', pro_clicks,
        'ctaCtr', case when shortage_views = 0 then 0 else round(pro_clicks::numeric / shortage_views * 100, 2) end,
        'insufficientEvents', insufficient_events,
        'aiCalls', ai_calls,
        'estimatedCost', estimated_cost,
        'spentCredits', spent_credits
      ) order by shortage_views desc, ai_calls desc, feature)
      from feature_stats
    ), '[]'::jsonb)
  ) into v_result
  from event_summary es, credit_summary cs, usage_summary us;

  return v_result;
end;
$$;
