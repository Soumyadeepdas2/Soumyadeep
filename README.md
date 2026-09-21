# Soumyadeep Das — Portfolio

A static, responsive portfolio built with HTML, CSS and vanilla JavaScript.

## Deploy

Unzip this folder, `git push` it to GitHub, and connect that repo to Vercel. Root = the folder that contains `index.html`. Primary domain: `www.soumyadeep.space`.

## What’s in here

You already have **three** projects:

| Name | Case page | Live site |
|---|---|---|
| hushhconnect | `hushhconnect.html` | https://hushh.buzz/ |
| BookyUniverse | `bookyuniverse.html` | https://bookyuniverse.vercel.app/ |
| Tellsgroup | `tellsgroup.html` | https://tellsgroup.vercel.app/ |

Other files:

- `index.html` — home
- `404.html` — not-found
- `css/styles.css`, `js/main.js`
- `assets/` — résumé, favicons, fonts, plaster, project screenshots
- `data/practice.json` — Codolio heatmap (refreshed daily)
- `scripts/fetch_codolio.py` + `.github/workflows/update-practice.yml`
- `vercel.json`, `robots.txt`, `sitemap.xml`

Do **not** upload `uploads/` if you still have that folder.

---

## Adding a new project (4th, 5th, …)

CSS does not change. Do these six steps.

### 1. Case study page

Copy an existing page:

```bash
cp tellsgroup.html myproject.html
```

Open `myproject.html` and change:

- `<title>`, meta description, canonical URL (`/myproject`)
- The kicker (`Project 04 · 2026`), the big title, the one-line lead
- The screenshot: save a homepage capture as `assets/myproject.jpg`, then

```html
<figure class="case__shot">
  <img src="assets/myproject.jpg" width="1600" height="900" alt="My project homepage">
</figure>
```

- The three short blocks: **The problem**, **How it solves it**, **Built with**
- The three buttons only:
  - **Portfolio** → `index.html#projects`
  - **Live project** → the real URL
  - **Source code** → the GitHub repo, or `https://github.com/Soumyadeepdas2` if there is no repo yet

### 2. Home list

In `index.html`, inside `<section id="projects">`, duplicate one whole `<article class="project">`. Put the **newest first**.

Renumber:

- `01` the new one
- `02` hushhconnect
- `03` BookyUniverse
- `04` Tellsgroup

On that article:

- Title links to `/myproject` (no `.html` in the URL)
- **Case study** links to `/myproject`
- **Live project** links to the live site
- Do **not** put a Source button on the home list

### 3. Sitemap

In `sitemap.xml` add:

```xml
<url>
  <loc>https://www.soumyadeep.space/myproject</loc>
  <lastmod>2026-09-21</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

### 4. Places that still say “three”

- `index.html` chip: `3 live products` → `4 live products`
- Hero / skills sentences that name the three products
- SEO `description` / `og:description` / `twitter:description`
- `js/main.js` — the cat’s **What has he built?** answer

### 5. Optional

- Résumé PDF in `assets/`
- `serve.py` CLEAN map if you preview locally without `.html` in the URL:

```python
"/myproject": "/myproject.html",
```

### 6. Ship it

```bash
git add myproject.html index.html sitemap.xml js/main.js assets/myproject.jpg
git commit -m "Add myproject"
git push
```

Vercel redeploys. The address bar shows `/myproject`, not `/myproject.html`.

---

## Practice heatmap

The browser never calls Codolio. A GitHub Action runs once a day, writes `data/practice.json`, and Vercel redeploys. Solved count, active days, streak and the grid all come from that file.

1. Enable Actions. Workflow permissions = **Read and write**.
2. Run **Update practice heatmap** once by hand.
3. After that it runs daily at 06:00 IST.

Local refresh:

```bash
python3 scripts/fetch_codolio.py
```

## Before publishing

1. Send a real contact-form test from `www.soumyadeep.space`.
2. If FormSubmit emails an activation link, approve it for that exact domain.
3. Confirm the WhatsApp number in `index.html`.
4. Point Source buttons at real repos when they are public.
