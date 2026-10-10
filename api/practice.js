// /api/practice — PUBLIC practice stats for the homepage heatmap.
// -----------------------------------------------------------------
// GET /api/practice  →  the same JSON data/practice.json used to hold:
//                       { solved, activeDays, currentStreak, maxStreak,
//                         updated, platforms, calendar, profile }
//
// WHY: practice data used to live in the repository as
// data/practice.json, written by a GitHub Action. Those bot commits
// were the sole source of push conflicts, and every site zip carried
// a copy of the data that could go stale. The data now lives in the
// Neon database (table practice_stats) and is NEVER touched by git:
//   - the table creates itself on first request (no SQL to run);
//   - when the cached snapshot is older than 3 hours, this function
//     refreshes it from Codolio's public API (full history every
//     time, so nothing is ever lost in the move or a refresh);
//   - a refresh can only replace data with an equal-or-newer
//     "updated" day — it can never roll stats back;
//   - if Codolio is unreachable, the last stored snapshot is served.
//
// Public read-only data: same values the static file exposed. No
// admin gate needed. Cached 60s in the browser, 60s per warm instance.

import { neon } from "@neondatabase/serverless";

const USER = "soumyadeepdas";
const CODOLIO_URL = "https://api.codolio.com/profile?userKey=" + USER;
const FETCH_TIMEOUT_MS = 8000;
const STALE_AFTER = "3 hours";
const CACHE_MS = 60 * 1000;

let cache = { t: 0, data: null };

/* Emergency snapshot (Oct 2026). Served ONLY when the database is
   unreachable AND Codolio is unreachable at the same time. It is
   never written to the database and never blocks a refresh. */
const FALLBACK = {"updated":"2026-10-11","profile":"https://codolio.com/profile/soumyadeepdas","solved":574,"activeDays":239,"maxStreak":126,"currentStreak":126,"platforms":["leetcode","geeksforgeeks","interviewbit","codeforces","codechef","atcoder","hackerrank"],"calendar":{"2025-09-15":3,"2026-02-10":7,"2026-02-11":2,"2026-02-12":7,"2026-02-13":2,"2026-02-14":1,"2026-02-15":2,"2026-02-16":1,"2026-02-17":2,"2026-02-18":2,"2026-02-19":5,"2026-02-20":1,"2026-02-21":1,"2026-02-22":1,"2026-02-23":3,"2026-02-24":1,"2026-02-25":1,"2026-02-26":1,"2026-02-27":8,"2026-02-28":1,"2026-03-01":1,"2026-03-02":4,"2026-03-04":2,"2026-03-05":1,"2026-03-06":1,"2026-03-07":1,"2026-03-08":2,"2026-03-09":2,"2026-03-10":2,"2026-03-11":1,"2026-03-12":1,"2026-03-13":2,"2026-03-14":1,"2026-03-16":1,"2026-03-17":1,"2026-03-18":1,"2026-03-19":1,"2026-03-20":1,"2026-03-21":2,"2026-03-22":2,"2026-03-23":1,"2026-03-24":1,"2026-03-25":1,"2026-03-27":2,"2026-03-29":1,"2026-03-30":1,"2026-03-31":1,"2026-04-01":1,"2026-04-02":2,"2026-04-03":7,"2026-04-04":1,"2026-04-05":1,"2026-04-06":1,"2026-04-07":1,"2026-04-08":1,"2026-04-09":9,"2026-04-10":2,"2026-04-11":3,"2026-04-12":2,"2026-04-13":1,"2026-04-14":1,"2026-04-15":2,"2026-04-16":3,"2026-04-17":7,"2026-04-18":1,"2026-04-19":1,"2026-04-20":2,"2026-04-21":2,"2026-04-22":2,"2026-04-23":1,"2026-04-24":1,"2026-04-25":3,"2026-04-26":1,"2026-04-27":1,"2026-04-28":1,"2026-04-29":1,"2026-04-30":2,"2026-05-01":1,"2026-05-02":1,"2026-05-03":1,"2026-05-04":1,"2026-05-05":1,"2026-05-06":2,"2026-05-07":2,"2026-05-08":3,"2026-05-09":2,"2026-05-10":1,"2026-05-11":1,"2026-05-12":1,"2026-05-13":1,"2026-05-14":1,"2026-05-15":10,"2026-05-16":1,"2026-05-17":1,"2026-05-18":1,"2026-05-19":1,"2026-05-20":1,"2026-05-21":2,"2026-05-22":1,"2026-05-23":1,"2026-05-24":1,"2026-05-25":9,"2026-05-26":9,"2026-05-27":1,"2026-05-28":1,"2026-05-29":1,"2026-05-30":1,"2026-05-31":1,"2026-06-01":1,"2026-06-02":3,"2026-06-03":7,"2026-06-04":4,"2026-06-05":3,"2026-06-07":1,"2026-06-08":2,"2026-06-09":1,"2026-06-10":4,"2026-06-11":1,"2026-06-12":1,"2026-06-13":1,"2026-06-14":2,"2026-06-15":1,"2026-06-16":1,"2026-06-17":8,"2026-06-18":2,"2026-06-19":5,"2026-06-20":2,"2026-06-21":5,"2026-06-22":1,"2026-06-23":4,"2026-06-24":6,"2026-06-25":1,"2026-06-26":4,"2026-06-27":3,"2026-06-28":1,"2026-06-29":6,"2026-06-30":1,"2026-07-01":1,"2026-07-02":4,"2026-07-03":4,"2026-07-04":1,"2026-07-05":1,"2026-07-06":1,"2026-07-07":6,"2026-07-08":2,"2026-07-09":5,"2026-07-10":1,"2026-07-11":3,"2026-07-12":1,"2026-07-13":1,"2026-07-14":1,"2026-07-15":1,"2026-07-16":8,"2026-07-17":1,"2026-07-18":1,"2026-07-19":1,"2026-07-20":1,"2026-07-21":1,"2026-07-22":1,"2026-07-23":1,"2026-07-24":1,"2026-07-25":2,"2026-07-26":1,"2026-07-27":8,"2026-07-28":4,"2026-07-29":6,"2026-07-30":5,"2026-07-31":3,"2026-08-01":2,"2026-08-02":1,"2026-08-03":2,"2026-08-04":12,"2026-08-05":14,"2026-08-06":5,"2026-08-07":9,"2026-08-08":5,"2026-08-09":5,"2026-08-10":6,"2026-08-11":4,"2026-08-12":4,"2026-08-13":1,"2026-08-14":3,"2026-08-15":4,"2026-08-16":4,"2026-08-17":4,"2026-08-18":11,"2026-08-19":29,"2026-08-20":7,"2026-08-21":3,"2026-08-22":7,"2026-08-23":4,"2026-08-24":8,"2026-08-25":3,"2026-08-26":4,"2026-08-27":4,"2026-08-28":3,"2026-08-29":7,"2026-08-30":7,"2026-08-31":6,"2026-09-01":3,"2026-09-02":4,"2026-09-03":10,"2026-09-04":7,"2026-09-05":10,"2026-09-06":3,"2026-09-07":6,"2026-09-08":14,"2026-09-09":6,"2026-09-10":5,"2026-09-11":3,"2026-09-12":4,"2026-09-13":7,"2026-09-14":3,"2026-09-15":3,"2026-09-16":3,"2026-09-17":3,"2026-09-18":2,"2026-09-19":36,"2026-09-20":29,"2026-09-21":17,"2026-09-22":2,"2026-09-23":3,"2026-09-24":8,"2026-09-25":8,"2026-09-26":14,"2026-09-27":12,"2026-09-28":12,"2026-09-29":11,"2026-09-30":5,"2026-10-01":5,"2026-10-02":6,"2026-10-03":3,"2026-10-04":6,"2026-10-05":6,"2026-10-06":5,"2026-10-07":9,"2026-10-08":5,"2026-10-09":4,"2026-10-10":4}};

function dbUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
  );
}

/* ── Codolio fetch + stats build (port of scripts/fetch_codolio.py) ── */

function istToday() {
  // 'en-CA' formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" })
    .format(new Date());
}

function prevIsoDay(iso) {
  return new Date(Date.parse(iso + "T00:00:00Z") - 86400000)
    .toISOString()
    .slice(0, 10);
}

function maxStreakOf(daysSorted) {
  if (!daysSorted.length) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < daysSorted.length; i++) {
    cur = prevIsoDay(daysSorted[i]) === daysSorted[i - 1] ? cur + 1 : 1;
    if (cur > best) best = cur;
  }
  return best;
}

function streakEnding(daySet, end) {
  let n = 0, d = end;
  while (daySet.has(d)) { n++; d = prevIsoDay(d); }
  return n;
}

/* exported for testing */
export function buildStats(data) {
  const profiles =
    (data && data.platformProfiles && data.platformProfiles.platformProfiles) ||
    [];
  const merged = {};
  const daySet = new Set();
  let solved = 0;
  const platforms = [];

  for (const p of profiles) {
    const name = (p && p.platform) || "unknown";
    const count =
      (p && p.totalQuestionStats && p.totalQuestionStats.totalQuestionCounts) ||
      0;
    solved += count;
    platforms.push(name);
    // Codolio keys are UTC midnight of the activity day
    const cal =
      (p &&
        p.dailyActivityStatsResponse &&
        p.dailyActivityStatsResponse.submissionCalendar) ||
      {};
    for (const ts of Object.keys(cal)) {
      const day = new Date(Number(ts) * 1000).toISOString().slice(0, 10);
      merged[day] = (merged[day] || 0) + Number(cal[ts]);
      daySet.add(day);
    }
  }

  const ordered = [...daySet].sort();
  const today = istToday();
  const end = daySet.has(today) ? today : prevIsoDay(today);
  const calendar = {};
  for (const k of Object.keys(merged).sort()) calendar[k] = merged[k];

  return {
    updated: today,
    profile: "https://codolio.com/profile/" + USER,
    solved: solved,
    activeDays: daySet.size,
    maxStreak: maxStreakOf(ordered),
    currentStreak: streakEnding(daySet, end),
    platforms: platforms,
    calendar: calendar
  };
}

/* exported for testing — hits the real Codolio API */
export async function fetchCodolio() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(CODOLIO_URL, {
      headers: {
        "User-Agent": "soumyadeep.space-practice/2.0",
        Accept: "application/json",
        Referer: "https://codolio.com/"
      },
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error("Codolio HTTP " + res.status);
    const payload = await res.json();
    if (!payload || !payload.status || !payload.status.success) {
      throw new Error("Codolio error response");
    }
    return buildStats(payload.data);
  } finally {
    clearTimeout(timer);
  }
}

/* ── database (sql is the neon() tagged-template executor) ─────────── */

/* exported for testing */
export async function ensureTable(sql) {
  await sql`
    create table if not exists practice_stats (
      id         integer primary key check (id = 1),
      data       jsonb not null,
      fetched_at timestamptz not null default now()
    )`;
}

/* exported for testing — one row; stale flag computed in SQL so it
   works with every driver (no client-side timestamp parsing). */
export async function readStats(sql) {
  const rows = await sql`
    select data,
           (fetched_at < now() - (${STALE_AFTER})::interval) as stale
    from practice_stats
    where id = 1`;
  return rows[0] || null;
}

/* exported for testing. Guard: only an equal-or-newer "updated" day
   may replace the stored snapshot — stats can never roll back. */
export async function saveStats(sql, stats) {
  await sql`
    insert into practice_stats (id, data, fetched_at)
    values (1, ${JSON.stringify(stats)}::jsonb, now())
    on conflict (id) do update
      set data = excluded.data, fetched_at = now()
      where practice_stats.data->>'updated' <= excluded.data->>'updated'`;
}

/* exported for testing — the whole read/refresh flow. fetcher is
   injectable so tests can simulate Codolio being unreachable. */
export async function getPractice(sql, fetcher = fetchCodolio) {
  let row = null;
  try {
    row = await readStats(sql);
  } catch (e) {
    // most likely: table does not exist yet (first request ever)
    try {
      await ensureTable(sql);
      row = await readStats(sql);
    } catch (e2) {
      return null; // database unreachable
    }
  }
  if (!row || row.stale) {
    try {
      const fresh = await fetcher();
      await saveStats(sql, fresh);
      row = await readStats(sql);
    } catch (e) {
      /* Codolio unreachable — serve the stored snapshot */
    }
  }
  return row ? row.data : null;
}

/* ── Vercel handler ─────────────────────────────────────────── */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Cache-Control", "no-store");
    return res.status(405).json({ error: "Method not allowed." });
  }
  let payload = null;
  try {
    const url = dbUrl();
    if (url) {
      if (cache.data && Date.now() - cache.t < CACHE_MS) {
        payload = cache.data;
      } else {
        const sql = neon(url);
        payload = await getPractice(sql);
        if (payload) cache = { t: Date.now(), data: payload };
      }
    }
  } catch (e) {
    payload = null;
  }
  if (!payload) payload = FALLBACK;
  res.setHeader("Cache-Control", "public, max-age=60");
  return res.status(200).json(payload);
}
