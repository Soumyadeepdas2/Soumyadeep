# Live Viewer Tracker — Setup Guide (Neon)

A souradeep.me-style live tracker for soumyadeep.space: every page
records pageviews + heartbeats, and `/admin` shows a password-protected
dashboard with **live viewers, a viewers-each-day graph, totals, and
most-viewed pages**. **Neon** (serverless Postgres) is the database;
the password is a Vercel environment variable. No secret ever appears
in the HTML.

## How it works

```
visitor's browser ──POST /api/analytics──▶ Vercel function ──SQL──▶ Neon Postgres
                   (pageview + 25s heartbeats)      │ (@neondatabase/serverless,
                                                 │  connection string from env)
you, at /admin ──GET /api/analytics + x-admin-password──▶ Vercel function
                   verifies against ADMIN_PASSWORD env var, then runs
                   site_stats() in Neon and returns the JSON the
                   dashboard charts.
```

- `js/tracker.js` — on every page. One POST on arrival, a heartbeat every
  25s (so "live now" = sessions seen in the last 75s). Silent if the API
  is missing, so local previews still work.
- `api/analytics.js` — Vercel serverless function. Records visits into
  Neon; serves stats only with the right password (timing-safe compare,
  5 wrong attempts per IP → 10-minute lockout).
- `admin.html` + `js/admin.js` — the dashboard at `/admin` (noindex).
  Password is kept only in the tab's sessionStorage and re-verified on
  every request.
- `neon/schema.sql` — the tables + the `site_stats()` function.
- `package.json` — the one dependency (`@neondatabase/serverless`) for
  the function.

## Setup (5 minutes, one time)

**1. Neon — create the project**
   [neon.tech](https://neon.tech) → sign in with GitHub → **Create
   project**. Pick the region closest to your visitors (Singapore or
   Mumbai for India). Free tier: no card needed.

**2. Neon — create the tables**
   In the Neon console: **SQL Editor** → New query → paste all of
   `neon/schema.sql` → **Run**. You should see `CREATE TABLE` ×2,
   `CREATE INDEX` ×2, `CREATE FUNCTION`.

**3. Neon — copy the connection string**
   Dashboard → **Connect** button → copy the connection string
   (`postgresql://user:pass@ep-…neon.tech/neondb?sslmode=require`).
   The pooled one (`-pooler` host) works fine — the serverless driver
   speaks HTTP either way.

**4. Vercel — set two environment variables**
   Your project → Settings → Environment Variables:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string |
   | `ADMIN_PASSWORD` | the password you'll type at `/admin` |

   (If you had set `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` earlier,
   delete them — they're no longer used.)

   Tip: Vercel → Storage → Neon (marketplace) can connect a Neon project
   and set `DATABASE_URL` automatically instead of step 4's first row.

   Then **Deployments → latest → ⋯ → Redeploy** so the function picks
   them up.

**5. Push this code and open `https://www.soumyadeep.space/admin`**

**6. Watch it work** — open your site in another tab or your phone:
   "Live now" ticks up within seconds, and today's bar appears on the
   graph.

## Notes

- **Why no RLS:** only the Vercel function can reach the database at
  all — it holds `DATABASE_URL`, which lives only in Vercel's env.
  Nothing in the browser has a database credential.
- **Free-tier maths:** Neon's free plan gives ~100 CU-hours/month with
  scale-to-zero — the compute sleeps ~5 minutes after the last query.
  A portfolio's traffic (visits in bursts, tiny queries) sits far
  inside that. A year of pageviews is tens of MB against 0.5 GB.
- **Privacy:** sids are random per browser (`localStorage`), no names,
  no accounts. Referrer + user-agent are stored trimmed. It's your data
  in your own Neon project — export or delete anytime with SQL.
- **The lockout is best-effort** (per serverless instance). The real
  protection is the password + HTTPS; choose a long one.
- The existing **Vercel Web Analytics** keeps running independently;
  this is your own, private, live view of the same traffic.
