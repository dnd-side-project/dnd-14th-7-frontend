-- Admin-only experiment dashboard data

alter table public.profiles
add column if not exists role text not null default 'user';

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('user', 'admin'));

create or replace function public.prevent_client_role_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role then
    raise exception 'profiles.role cannot be changed by client requests';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_client_role_update_trigger on public.profiles;
create trigger prevent_client_role_update_trigger
before update on public.profiles
for each row
execute function public.prevent_client_role_update();

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
  daily_events as (
    select
      date_trunc('day', created_at)::date as day,
      count(*) filter (where event_name = 'credit_insufficient_viewed')::integer as shortage_views,
      count(*) filter (where event_name = 'pro_waitlist_clicked')::integer as pro_clicks
    from public.experiment_events
    where experiment_key = 'credit_shortage_pro'
      and created_at >= date_trunc('day', now()) - interval '13 days'
    group by 1
  ),
  daily_credits as (
    select
      date_trunc('day', created_at)::date as day,
      count(*)::integer as insufficient_events
    from public.credit_transactions
    where type = 'INSUFFICIENT_CREDITS'
      and created_at >= date_trunc('day', now()) - interval '13 days'
    group by 1
  ),
  daily_usage as (
    select
      date_trunc('day', created_at)::date as day,
      count(*)::integer as ai_calls
    from public.ai_usage_logs
    where created_at >= date_trunc('day', now()) - interval '13 days'
    group by 1
  ),
  daily as (
    select
      series.day::date as day,
      coalesce(de.shortage_views, 0) as shortage_views,
      coalesce(de.pro_clicks, 0) as pro_clicks,
      coalesce(dc.insufficient_events, 0) as insufficient_events,
      coalesce(du.ai_calls, 0) as ai_calls
    from generate_series(
      date_trunc('day', now()) - interval '13 days',
      date_trunc('day', now()),
      interval '1 day'
    ) as series(day)
    left join daily_events de on de.day = series.day::date
    left join daily_credits dc on dc.day = series.day::date
    left join daily_usage du on du.day = series.day::date
    order by series.day
  ),
  feature_shortage as (
    select
      metadata->>'feature' as feature,
      count(*)::integer as shortage_views
    from public.experiment_events
    where experiment_key = 'credit_shortage_pro'
      and event_name = 'credit_insufficient_viewed'
      and metadata ? 'feature'
    group by 1
  ),
  feature_clicks as (
    select
      metadata->>'feature' as feature,
      count(*)::integer as pro_clicks
    from public.experiment_events
    where experiment_key = 'credit_shortage_pro'
      and event_name = 'pro_waitlist_clicked'
      and metadata ? 'feature'
    group by 1
  ),
  feature_credits as (
    select
      feature,
      count(*) filter (where type = 'INSUFFICIENT_CREDITS')::integer as insufficient_events,
      coalesce(sum(abs(amount)) filter (where amount < 0), 0)::integer as spent_credits
    from public.credit_transactions
    where feature is not null
    group by 1
  ),
  feature_usage as (
    select
      feature,
      count(*)::integer as ai_calls,
      coalesce(sum(estimated_cost), 0)::numeric as estimated_cost
    from public.ai_usage_logs
    group by 1
  ),
  features as (
    select feature from feature_usage
    union
    select feature from feature_credits
    union
    select feature from feature_shortage
    union
    select feature from feature_clicks
  ),
  feature_stats as (
    select
      f.feature,
      coalesce(fs.shortage_views, 0) as shortage_views,
      coalesce(fc.pro_clicks, 0) as pro_clicks,
      coalesce(fcr.insufficient_events, 0) as insufficient_events,
      coalesce(fu.ai_calls, 0) as ai_calls,
      coalesce(fu.estimated_cost, 0) as estimated_cost,
      coalesce(fcr.spent_credits, 0) as spent_credits
    from features f
    left join feature_shortage fs on fs.feature = f.feature
    left join feature_clicks fc on fc.feature = f.feature
    left join feature_credits fcr on fcr.feature = f.feature
    left join feature_usage fu on fu.feature = f.feature
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
