-- ─────────────────────────────────────────────────────────────
-- Live viewer tracker — Neon schema for soumyadeep.space
-- Run once in: Neon Console → your project → SQL Editor → Run
-- (Plain Postgres — also works on any other Postgres.)
-- ─────────────────────────────────────────────────────────────

-- Every pageview (one row per arrival; heartbeats do NOT land here)
create table if not exists public.pageviews (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  day        date        not null,              -- IST calendar day
  path       text        not null,
  sid        text        not null,              -- persistent viewer id
  referrer   text,
  ua         text
);

create index if not exists pageviews_day_idx on public.pageviews (day);
create index if not exists pageviews_sid_idx on public.pageviews (sid);

-- One row per viewer; refreshed by heartbeats (25s) for "live now"
create table if not exists public.live_sessions (
  sid        text primary key,
  path       text not null,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);

-- Aggregation for the admin dashboard. Only the serverless function
-- (which holds the DATABASE_URL secret in Vercel) can reach these
-- tables at all, so no row-level security is needed here.
create or replace function public.site_stats(p_days int default 30)
returns json
language sql
as $$
  select json_build_object(
    'liveNow',
      (select count(*) from public.live_sessions
        where last_seen > now() - interval '75 seconds'),
    'totalViewers',
      (select count(distinct sid) from public.pageviews),
    'totalPageviews',
      (select count(*) from public.pageviews),
    'daily',
      (select coalesce(json_agg(t), '[]'::json) from (
         select to_char(day, 'YYYY-MM-DD') as day,
                count(distinct sid)        as viewers,
                count(*)                   as pageviews
         from public.pageviews
         where day >= (now() at time zone 'Asia/Kolkata')::date - (p_days - 1)
         group by day
         order by day
       ) t),
    'topPages',
      (select coalesce(json_agg(t), '[]'::json) from (
         select path, count(distinct sid) as viewers, count(*) as views
         from public.pageviews
         group by path
         order by views desc
         limit 8
       ) t)
  );
$$;
