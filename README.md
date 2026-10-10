# Soumyadeep Das — Portfolio

Personal developer portfolio showcasing my projects, experiments, technical work, and practice.

**Live:** [soumyadeep.space](https://www.soumyadeep.space)

Built as a lightweight static site using **HTML, CSS, and vanilla JavaScript**, with no frontend framework.

---

## Projects

| # | Project | Description | Live |
|---|---|---|---|
| 01 | **Meow Reminder** | Telegram-based reminder application for creating and managing personal reminders. | [meowreminder.de.deplexo.com](https://meowreminder.de.deplexo.com/) |
| 02 | **OpenRail** | Train-focused web application for exploring railway information and related functionality. | [openrailway.vercel.app](https://openrailway.vercel.app/) |
| 03 | **hushhconnect** | Private real-time chat application built around Chat IDs instead of email-based accounts. | [hushh.buzz](https://hushh.buzz/) |
| 04 | **BookyUniverse** | Online e-library platform for discovering and accessing books. | [bookyuniverse.vercel.app](https://bookyuniverse.vercel.app/) |
| 05 | **Tellsgroup** | A digital media ecosystem built around multiple topic-focused publishing brands. | [tellsgroup.vercel.app](https://tellsgroup.vercel.app/) |

---

## Tech Stack

### Core

- HTML5
- CSS3
- JavaScript
- Python
- Java
- C
- C++

### Web & Backend

- Vanilla JavaScript
- Node.js
- REST APIs
- Supabase
- Firebase
- MongoDB

### AI / Data

- Python
- Deep Learning
- Machine Learning
- Data Engineering
- Ollama
- Local LLMs

### Infrastructure

- Git & GitHub
- GitHub Actions
- Vercel
- Deplexo
- Supabase
- ImageKit

---

## Portfolio Architecture

The portfolio is intentionally kept lightweight and dependency-free on the frontend.

```text
portfolio/
│
├── index.html
├── 404.html
│
├── *.html
│   └── Project case studies
│
├── css/
│   └── styles.css
│
├── js/
│   └── main.js
│
├── assets/
│   ├── fonts/
│   ├── favicons/
│   ├── screenshots/
│   └── resume/
│
├── vercel.json
├── robots.txt
└── sitemap.xml
```

---

## Practice Heatmap

The portfolio includes an automatically updated coding-practice heatmap.

The stats live in the **Neon Postgres database** (table `practice_stats`), not in
this repository. Nothing in git ever writes practice data, so pushes can never
conflict over it and zips can never make it stale.

```text
Codolio API  →  /api/practice (Vercel function)  →  Neon table  →  browser heatmap
```

- The browser calls `GET /api/practice` — same JSON shape the old
  `data/practice.json` had (`solved`, `activeDays`, `currentStreak`,
  `maxStreak`, `updated`, `calendar`, `platforms`).
- The function refreshes its cached snapshot from Codolio whenever it is older
  than 3 hours — no scheduler, no GitHub Actions, no bot commits.
- A refresh can only replace the snapshot with an equal-or-newer `updated`
  day, so stats can never roll back.
- If Codolio is unreachable, the last stored snapshot is served; if the
  database is unreachable too, an embedded emergency copy is served.
- The table creates itself on first request — no SQL needs to be run.

Public read-only data, exactly what the static file exposed before. If the
fetch fails, the page keeps its built-in defaults — the heatmap never breaks
a page.

---

## Project Case Studies

Each major project has a dedicated case-study page containing:

- Project overview
- Problem statement
- Solution
- Technology stack
- Project screenshot
- Live project
- Source code
- Portfolio navigation

Project pages use clean URLs such as:

```text
/myproject
```

instead of:

```text
/myproject.html
```

---

## Deployment

The portfolio is deployed on **Vercel** with the primary domain:

```text
https://www.soumyadeep.space
```

The project is completely static on the frontend, with external services used where required by individual features.

---

## Publishing changes

The repo has no bots and no generated files, so a plain push is all it takes:

```powershell
git add -A
git commit -m "What you changed"
git push
```

If the push is ever rejected, someone else pushed first — just integrate and retry:

```powershell
git pull --rebase
git push
```

Vercel deploys automatically after the push (usually a minute or two).
Practice stats are NOT part of the repo (see *Practice Heatmap* above), so
they can never cause a conflict.

## Contact

The portfolio includes a contact form powered by **Web3Forms**.

---

## Author

**Soumyadeep Das**

Computer Science & AI/ML undergraduate focused on software development, AI/ML, and building practical products.

- Portfolio: [soumyadeep.space](https://www.soumyadeep.space)
- GitHub: [github.com/Soumyadeepdas2](https://github.com/Soumyadeepdas2)

---

## License

This repository contains the source code for my personal portfolio.