// /api/analytics — live viewer tracker + password-protected stats
// -----------------------------------------------------------------
// POST /api/analytics   { sid, path, ref, beat }    → record a pageview
//                       (beat:true = heartbeat, session refresh only)
//                       Origin must be the site itself; per-IP rate limit.
// GET  /api/analytics   header: x-admin-password    → { liveNow,
//                       totalViewers, totalPageviews, daily[], topPages[] }
//                       Wrong-password lockout is stored in Postgres, so
//                       it survives cold starts and hits every instance.
//
// Database: Neon serverless Postgres. Set in Vercel:
//   DATABASE_URL    the Neon connection string (Settings → Connect)
//   ADMIN_PASSWORD  the admin gate password — use 30+ random characters;
//                   the lockout slows guessing down, the length stops it.
// Nothing here touches the browser-facing site files; the tables are
// reachable only through this function, which holds the secret.

import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

/* ── request helpers ────────────────────────────────────────── */

const ALLOWED_ORIGINS = new Set([
  "https://soumyadeep.space",
  "https://www.soumyadeep.space",
]);

/* The client IP the edge vouches for. Proxies APPEND the real IP to the
   end of the forwarded list; anything before that can be forged by the
   client, so the last entry is the trustworthy one. Vercel also keeps
   its own copy in x-vercel-forwarded-for that middleboxes cannot
   overwrite — prefer it when present. */
export function ipOf(req) {
  const list = String(
    req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || ""
  );
  const parts = list.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    parts[parts.length - 1] ||
    String(req.headers["x-real-ip"] || "").trim() ||
    "local"
  );
}

function samePassword(a, b) {
  if (!a || !b) return false;
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function dbUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
  );
}

/* ── shared guard tables (Postgres-backed so every instance agrees) ── */

const RL_MAX = 60;        // writes per IP per minute (heartbeat ≈ 2.4/min)
const LOCK_FAILS = 5;     // wrong passwords before lockout
const LOCK_MINUTES = 10;  // lockout duration

let tablesReady = null;

/* site_stats is kept in sync with neon/schema.sql; the API re-applies it
   (create or replace) on cold start so a deployed database upgrades
   itself — no manual SQL step. No ${} interpolation: it is a literal. */
const SITE_STATS_SQL = `create or replace function public.site_stats(p_days int default 30)
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
$$;`;

export async function ensureSchema(sql) {
  if (!tablesReady) {
    tablesReady = (async () => {
      await sql`create table if not exists admin_lockouts (
                  ip    text primary key,
                  fails int not null default 0,
                  until timestamptz)`;
      await sql`create table if not exists rate_limits (
                  ip           text primary key,
                  hits         int not null default 0,
                  window_start timestamptz not null default now())`;
      await sql([SITE_STATS_SQL]);
    })().catch((e) => {
      tablesReady = null; // retry on the next request
      throw e;
    });
  }
  return tablesReady;
}

/* true when this IP has sent more than RL_MAX writes in the last minute */
export async function rateLimited(sql, ip) {
  const rows = await sql`
    insert into rate_limits (ip, hits, window_start) values (${ip}, 1, now())
    on conflict (ip) do update set
      hits         = case when rate_limits.window_start < now() - interval '60 seconds'
                          then 1 else rate_limits.hits + 1 end,
      window_start = case when rate_limits.window_start < now() - interval '60 seconds'
                          then now() else rate_limits.window_start end
    returning hits`;
  return rows[0].hits > RL_MAX;
}

/* lockout state — stored in Postgres, shared by all serverless instances */
export async function isLocked(sql, ip) {
  const rows = await sql`select until from admin_lockouts where ip = ${ip}`;
  const r = rows[0];
  if (!r || !r.until) return false;
  if (new Date(r.until) > new Date()) return true;
  await sql`delete from admin_lockouts where ip = ${ip}`; // expired → fresh slate
  return false;
}

export async function noteFail(sql, ip) {
  const rows = await sql`
    insert into admin_lockouts (ip, fails) values (${ip}, 1)
    on conflict (ip) do update set fails = admin_lockouts.fails + 1
    returning fails`;
  if (rows[0].fails >= LOCK_FAILS) {
    await sql`update admin_lockouts
              set until = now() + (${LOCK_MINUTES} || ' minutes')::interval
              where ip = ${ip}`;
  }
}

export async function clearFails(sql, ip) {
  await sql`delete from admin_lockouts where ip = ${ip}`;
}

/* ── SQL layer (exported for testing) ─────────────────────────
   `sql` is the neon() tagged-template executor: sql`…${value}…`
   parameterises safely. Any Postgres with the same schema works. */

export async function recordVisit(sql, body, headers) {
  const sid = String(body.sid || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
  const path = ("/" + String(body.path || "/").replace(/^\/+/, "")).slice(0, 200);
  let ref = String(body.ref || "").slice(0, 300) || null;
  const beat = body.beat === true;
  if (!sid) return false;

  /* privacy: keep only scheme + host + path of the referrer — drop query
     strings and fragments, which can carry search terms or tokens */
  if (ref) {
    try {
      const u = new URL(ref);
      ref = (u.origin + u.pathname).slice(0, 300);
    } catch {
      ref = ref.split("?")[0].split("#")[0].slice(0, 300);
    }
  }

  // IST calendar day (Asia/Kolkata) — matches the visitor's own day.
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const now = new Date().toISOString();
  const ua = String((headers && headers["user-agent"]) || "").slice(0, 250) || null;

  if (!beat) {
    await sql`insert into pageviews (day, path, sid, referrer, ua)
              values (${day}, ${path}, ${sid}, ${ref}, ${ua})`;
  }
  await sql`insert into live_sessions (sid, path, last_seen)
            values (${sid}, ${path}, ${now})
            on conflict (sid) do update
            set path = excluded.path, last_seen = excluded.last_seen`;
  return true;
}

/* stats are aggregates over history — cache 30s per instance so the
   admin's 30-second auto-poll stops rescanning the whole table */
const statsCache = new Map(); // days -> { t, data }
export async function fetchStats(sql, days) {
  const hit = statsCache.get(days);
  if (hit && Date.now() - hit.t < 30_000) return hit.data;
  const rows = await sql`select site_stats(${days}) as stats`;
  const stats = rows[0].stats;
  statsCache.set(days, { t: Date.now(), data: stats });
  return stats;
}

/* ── Vercel handler ─────────────────────────────────────────── */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    /* record — browsers only, and not too fast */
    if (req.method === "POST") {
      const origin = String(req.headers.origin || "");
      if (!ALLOWED_ORIGINS.has(origin)) {
        return res.status(403).json({ ok: false, error: "Forbidden origin." });
      }

      const url = dbUrl();
      if (!url) return res.status(503).json({ ok: false });
      const sql = neon(url);
      await ensureSchema(sql);

      const ip = ipOf(req);
      if (await rateLimited(sql, ip)) {
        return res.status(429).json({ ok: false, error: "Slow down." });
      }

      const ok = await recordVisit(
        sql,
        (typeof req.body === "object" && req.body) || {},
        req.headers
      );
      return res.status(ok ? 200 : 400).json({ ok });
    }

    /* stats (admin only) */
    if (req.method === "GET") {
      const url = dbUrl();
      const sql = url ? neon(url) : null;
      const ip = ipOf(req);
      if (sql) {
        await ensureSchema(sql);
        if (await isLocked(sql, ip)) {
          return res
            .status(429)
            .json({ error: "Too many attempts. Try again in a few minutes." });
        }
      }

      const given = req.headers["x-admin-password"] || "";
      if (!process.env.ADMIN_PASSWORD || !samePassword(given, process.env.ADMIN_PASSWORD)) {
        if (sql) await noteFail(sql, ip);
        return res.status(401).json({ error: "Wrong password." });
      }
      if (sql) await clearFails(sql, ip);

      if (!sql) return res.status(503).json({ error: "Database not configured." });

      let days = parseInt(req.query && req.query.days, 10);
      if (!(days >= 1 && days <= 90)) days = 30;

      const stats = await fetchStats(sql, days);
      return res.status(200).json(stats);
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (e) {
    return res.status(500).json({ error: "Server error." });
  }
}
