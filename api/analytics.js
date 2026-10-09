// /api/analytics — live viewer tracker + password-protected stats
// -----------------------------------------------------------------
// POST /api/analytics   { sid, path, ref, beat }    → record a pageview
//                       (beat:true = heartbeat, session refresh only)
// GET  /api/analytics   header: x-admin-password    → { liveNow,
//                       totalViewers, totalPageviews, daily[], topPages[] }
//
// Database: Neon serverless Postgres. Set in Vercel:
//   DATABASE_URL    the Neon connection string (Settings → Connect)
//   ADMIN_PASSWORD  the admin gate password
// Nothing here touches the browser-facing site files; the tables are
// reachable only through this function, which holds the secret.

import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

/* best-effort brute-force guard (per warm instance) */
const fails = new Map(); // ip -> [timestamps]
const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILS = 5;

function ipOf(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "local";
}
function tooManyFails(ip) {
  const now = Date.now();
  const arr = (fails.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  fails.set(ip, arr);
  return arr.length >= MAX_FAILS;
}
function noteFail(ip) {
  const arr = fails.get(ip) || [];
  arr.push(Date.now());
  fails.set(ip, arr);
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

/* ── SQL layer (exported for testing) ─────────────────────────
   `sql` is the neon() tagged-template executor: sql`…${value}…`
   parameterises safely. Any Postgres with the same schema works. */

export async function recordVisit(sql, body, headers) {
  const sid = String(body.sid || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
  const path = ("/" + String(body.path || "/").replace(/^\/+/, "")).slice(0, 200);
  const ref = String(body.ref || "").slice(0, 300) || null;
  const beat = body.beat === true;
  if (!sid) return false;

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

export async function fetchStats(sql, days) {
  const rows = await sql`select site_stats(${days}) as stats`;
  return rows[0].stats;
}

/* ── Vercel handler ─────────────────────────────────────────── */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    /* record */
    if (req.method === "POST") {
      const url = dbUrl();
      if (!url) return res.status(503).json({ ok: false });
      const sql = neon(url);
      const ok = await recordVisit(sql, (typeof req.body === "object" && req.body) || {}, req.headers);
      return res.status(ok ? 200 : 400).json({ ok });
    }

    /* stats (admin only) */
    if (req.method === "GET") {
      const ip = ipOf(req);
      if (tooManyFails(ip)) {
        return res.status(429).json({ error: "Too many attempts. Try again in a few minutes." });
      }
      const given = req.headers["x-admin-password"] || "";
      if (!process.env.ADMIN_PASSWORD || !samePassword(given, process.env.ADMIN_PASSWORD)) {
        noteFail(ip);
        return res.status(401).json({ error: "Wrong password." });
      }

      let days = parseInt(req.query && req.query.days, 10);
      if (!(days >= 1 && days <= 90)) days = 30;

      const url = dbUrl();
      if (!url) return res.status(503).json({ error: "Database not configured." });
      const sql = neon(url);
      const stats = await fetchStats(sql, days);
      return res.status(200).json(stats);
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (e) {
    return res.status(500).json({ error: "Server error." });
  }
}
