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
├── data/
│   └── practice.json
│
├── scripts/
│   └── fetch_codolio.py
│
├── .github/
│   └── workflows/
│       └── update-practice.yml
│
├── vercel.json
├── robots.txt
└── sitemap.xml
```

---

## Practice Heatmap

The portfolio includes an automatically updated coding-practice heatmap.

Codolio data is fetched server-side through a GitHub Actions workflow and stored as:

```text
data/practice.json
```

The browser only reads the generated JSON file; it does not directly request data from Codolio.

### Workflow

```text
Codolio
   ↓
fetch_codolio.py
   ↓
data/practice.json
   ↓
GitHub Actions
   ↓
Git commit
   ↓
Vercel deployment
   ↓
Portfolio heatmap
```

The workflow runs twice daily to keep the practice statistics updated.

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