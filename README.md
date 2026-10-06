# Soumyadeep Das — Portfolio

A static, responsive personal portfolio built with **HTML, CSS, and vanilla JavaScript**.

**Live:** [www.soumyadeep.space](https://www.soumyadeep.space)

---

## Deploy

This is a static website and can be deployed easily with **Vercel**.

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Set the project root to the folder containing `index.html`.
4. Connect your custom domain.

The primary domain is:

**https://www.soumyadeep.space**

---

## Projects

The portfolio currently features four projects:

| # | Project | Case Study | Live Site |
|---|---|---|---|
| 01 | hushhconnect | [`hushhconnect.html`](hushhconnect.html) | [hushh.buzz](https://hushh.buzz/) |
| 02 | BookyUniverse | [`bookyuniverse.html`](bookyuniverse.html) | [bookyuniverse.vercel.app](https://bookyuniverse.vercel.app/) |
| 03 | Tellsgroup | [`tellsgroup.html`](tellsgroup.html) | [tellsgroup.vercel.app](https://tellsgroup.vercel.app/) |

> Add new projects to the top of the list so the newest project always appears first.

---

## Project Structure

```text
.
├── index.html
├── 404.html
├── hushhconnect.html
├── bookyuniverse.html
├── tellsgroup.html
│
├── css/
│   └── styles.css
│
├── js/
│   └── main.js
│
├── assets/
│   ├── résumé
│   ├── favicons
│   ├── fonts
│   ├── plaster
│   └── project screenshots
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

**Do not upload the `uploads/` folder** if it is still present in your local project.

---

# Adding a New Project

Adding another project is straightforward. The existing CSS can be reused.

## 1. Create the Case Study

Copy an existing case-study page:

```bash
cp tellsgroup.html myproject.html
```

Then update the following in `myproject.html`:

- Page title
- Meta description
- Canonical URL
- Project number and year
- Project title
- One-line project description
- Project screenshot
- Problem
- Solution
- Technologies used

Save the homepage screenshot as:

```text
assets/myproject.jpg
```

Then use:

```html
<figure class="case__shot">
  <img
    src="assets/myproject.jpg"
    width="1600"
    height="900"
    alt="My project homepage"
  >
</figure>
```

The case-study page should have three buttons:

- **Portfolio** → `index.html#projects`
- **Live project** → the project's real URL
- **Source code** → the project's GitHub repository

If the project does not have its own repository yet, use:

```text
https://github.com/Soumyadeepdas2
```

---

## 2. Add It to the Home Page

Open `index.html` and find:

```html
<section id="projects">
```

Duplicate an existing:

```html
<article class="project">
```

Add the new project **at the top** of the list.

For example:

```text
01  New Project
02  hushhconnect
03  BookyUniverse
04  Tellsgroup
```

Make sure:

- The project title links to `/myproject`
- **Case study** links to `/myproject`
- **Live project** links to the actual project
- There is **no Source Code button** on the home-page project card

---

## 3. Update the Sitemap

Add the new project to `sitemap.xml`:

```xml
<url>
  <loc>https://www.soumyadeep.space/myproject</loc>
  <lastmod>2026-09-21</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

Update the `lastmod` date when appropriate.

---

## 4. Update Project Counts and Text

Whenever a new project is added, search the site for references to the old project count.

For example:

```text
3 live products
```

should become:

```text
4 live products
```

Also check:

- Hero section
- Skills/about text
- SEO description
- `og:description`
- `twitter:description`
- `js/main.js`
- The cat assistant's **"What has he built?"** response

---

## 5. Optional Updates

You can also update:

- Résumé PDF in `assets/`
- Project screenshots
- Project favicon
- `serve.py` if you use the local server

For clean local URLs, add the new route to the `CLEAN` map:

```python
"/myproject": "/myproject.html",
```

---

## 6. Commit and Deploy

After adding the project:

```bash
git add myproject.html index.html sitemap.xml js/main.js assets/myproject.jpg
git commit -m "Add myproject"
git push
```

Vercel will automatically deploy the updated site.

The project should be accessible as:

```text
https://www.soumyadeep.space/myproject
```

rather than:

```text
https://www.soumyadeep.space/myproject.html
```

---

# Practice Heatmap

The portfolio does not request Codolio data directly from the browser.

Instead:

1. A GitHub Action runs periodically.
2. `scripts/fetch_codolio.py` fetches the practice data.
3. The result is saved to `data/practice.json`.
4. Vercel deploys the updated file.
5. The portfolio reads the local JSON file.

The heatmap, solved count, active days, and streak are all generated from `data/practice.json`.

### GitHub Actions

Make sure:

- GitHub Actions are enabled.
- Workflow permissions are set to **Read and write**.
- The **Update practice heatmap** workflow has been run successfully at least once.

The workflow is currently scheduled to run at:

- **06:00 IST**
- **09:00 IST**

The second run helps catch practice activity that was added overnight.

### Refresh Locally

```bash
python3 scripts/fetch_codolio.py
```

---

# Contact Form

The contact form uses **Web3Forms**.

Before publishing:

1. Create a free Web3Forms access key at [web3forms.com](https://web3forms.com).
2. Use `soumyadeepdas044@gmail.com` when setting up the form.
3. Add the access key to the `data-access-key` attribute in `index.html`.
4. Send a real test message from the live portfolio.
5. Confirm that the message arrives in Gmail.
6. Verify that the WhatsApp number shown on the website is correct.

---

# Before Publishing

Use this checklist before deploying changes:

- [ ] Test the homepage
- [ ] Test every project page
- [ ] Test all live-project links
- [ ] Test Source Code links
- [ ] Test the contact form
- [ ] Confirm WhatsApp number
- [ ] Check the 404 page
- [ ] Check mobile responsiveness
- [ ] Check the sitemap
- [ ] Check SEO/Open Graph metadata
- [ ] Make sure no `uploads/` folder is accidentally committed
- [ ] Push to GitHub
- [ ] Confirm the Vercel deployment
- [ ] Test the live domain

---

## Tech Stack

- **HTML5**
- **CSS3**
- **Vanilla JavaScript**
- **Python** — Codolio data updater
- **GitHub Actions** — automated practice-data updates
- **Vercel** — deployment
- **Web3Forms** — contact form
- **Codolio** — practice statistics