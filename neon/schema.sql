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
         limit 15
       ) t),
    'browsers',
      (select coalesce(json_agg(t), '[]'::json) from (
         select case
                  when ua like '%Edg/%'            then 'Edge'
                  when ua like '%OPR/%'            then 'Opera'
                  when ua like '%SamsungBrowser/%' then 'Samsung Internet'
                  when ua like '%Firefox%'         then 'Firefox'
                  when ua like '%Chrome/%'         then 'Chrome'
                  when ua like '%Safari%'          then 'Safari'
                  when ua is null or ua = ''       then 'Unknown'
                  else 'Other / bots'
                end as browser,
                count(distinct sid) as visitors,
                count(*)            as views
         from public.pageviews
         group by 1
         order by views desc
         limit 8
       ) t),
    'referrers',
      (select coalesce(json_agg(t), '[]'::json) from (
         select coalesce(substring(referrer from '^[a-z]+://([^/]+)'), 'Direct') as source,
                count(distinct sid) as visitors,
                count(*)            as views
         from public.pageviews
         group by 1
         order by views desc
         limit 10
       ) t),
    'recent',
      (select coalesce(json_agg(t), '[]'::json) from (
         select to_char(created_at at time zone 'Asia/Kolkata', 'DD Mon HH24:MI') as at,
                path,
                case
                  when ua like '%Edg/%'            then 'Edge'
                  when ua like '%OPR/%'            then 'Opera'
                  when ua like '%SamsungBrowser/%' then 'Samsung Internet'
                  when ua like '%Firefox%'         then 'Firefox'
                  when ua like '%Chrome/%'         then 'Chrome'
                  when ua like '%Safari%'          then 'Safari'
                  else 'Other'
                end as browser,
                coalesce(substring(referrer from '^[a-z]+://([^/]+)'), 'direct') as source
         from public.pageviews
         order by id desc
         limit 12
       ) t)
  );
$$;

-- NOTE: api/analytics.js carries an identical copy of this function and
-- applies it automatically (create or replace) — a deployed database
-- upgrades itself on the first request after a new deploy. If you edit
-- it here, edit it there too.

-- ─────────────────────────────────────────────────────────────
-- Abuse guards (also auto-created by the API on first request,
-- so an existing database needs no manual migration)
-- ─────────────────────────────────────────────────────────────

-- Wrong-password lockout for the admin gate. Stored in Postgres so
-- every serverless instance sees the same counter.
create table if not exists public.admin_lockouts (
  ip    text primary key,
  fails int not null default 0,
  until timestamptz                       -- set after 5 fails: +10 minutes
);

-- Per-IP write rate limit for POST /api/analytics (60 writes/min).
create table if not exists public.rate_limits (
  ip           text primary key,
  hits         int not null default 0,
  window_start timestamptz not null default now()
);
