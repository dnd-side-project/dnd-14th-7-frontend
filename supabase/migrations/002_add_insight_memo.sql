alter table public.insights
add column if not exists memo text not null default '';
