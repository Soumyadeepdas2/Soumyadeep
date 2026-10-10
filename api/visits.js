// /api/visits — PUBLIC daily visit counts for the footer graph.
// -----------------------------------------------------------------
// GET /api/visits  →  { days: [{ day: 'YYYY-MM-DD', visits: N }] }
//
// Aggregate counts ONLY: no paths, browsers, referrers or totals
// ever leave the server — a public endpoint that cannot leak
// anything personal. Cached 5 minutes per warm instance.

import { neon } from "@neondatabase/serverless";

const CACHE_MS = 5 * 60 * 1000;
let cache = { t: 0, rows: null };

function dbUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
  );
}

/* exported for testing — any Postgres with the same schema works */
export async function dailyVisits(sql, n) {
  const rows = await sql`
    select to_char(day, 'YYYY-MM-DD') as day, count(*) as visits
    from pageviews
    where day >= (now() at time zone 'Asia/Kolkata')::date - (${n} - 1)
    group by day
    order by day`;
  return rows.map((r) => ({ day: r.day, visits: Number(r.visits) }));
}

/* ── Vercel handler ─────────────────────────────────────────── */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Cache-Control", "no-store");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    let rows;
    if (cache.rows && Date.now() - cache.t < CACHE_MS) {
      rows = cache.rows;
    } else {
      const url = dbUrl();
      if (!url) {
        rows = [];
      } else {
        const sql = neon(url);
        rows = await dailyVisits(sql, 30);
        cache = { t: Date.now(), rows };
      }
    }
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.status(200).json({ days: rows });
  } catch (e) {
    // the graph simply stays empty — it must never break a page
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ days: [] });
  }
}
