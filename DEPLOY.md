# Deploying to soumyadeep.space

Your site is static, so hosting is free. Vercel is recommended since you
already use it for BookyUniverse and Tellsgroup.

---

## Step 1 — Put the code on GitHub

```bash
cd portfolio
git init
git add .
git commit -m "Portfolio site"
git branch -M main
git remote add origin https://github.com/Soumyadeepdas2/portfolio.git
git push -u origin main
```

## Step 2 — Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
2. Framework preset: **Other**. Leave build command and output directory
   empty — there's nothing to build.
3. Click **Deploy**. You'll get a `*.vercel.app` URL in about 20 seconds.

## Step 3 — Connect your domain

In the Vercel project: **Settings → Domains → Add** → type `soumyadeep.space`.

Vercel will show you the DNS records to create. Go to wherever you bought
the domain (Namecheap, GoDaddy, Hostinger…), open its DNS settings, and add:

| Type  | Name  | Value                  |
|-------|-------|------------------------|
| A     | `@`   | `76.76.21.21`          |
| CNAME | `www` | `cname.vercel-dns.com` |

Use whatever values Vercel displays — they occasionally change.

**Delete any existing parked/placeholder A records** for `@` first, or the
domain will keep pointing at your registrar's landing page.

DNS usually propagates in 10–30 minutes (can take up to 48 hours). Vercel
issues the HTTPS certificate automatically once it resolves.

## Step 4 — Verify

- Visit `https://soumyadeep.space` — the padlock should appear.
- Paste the URL into WhatsApp or LinkedIn to check the preview card renders.
- Submit `https://soumyadeep.space/sitemap.xml` in
  [Google Search Console](https://search.google.com/search-console) so you
  start showing up in search.

---

## ⚠️ Activation is PER DOMAIN — read this

FormSubmit activates **one domain at a time**. Activating `soumyadeep.space`
does **not** activate `www.soumyadeep.space`, and neither activates `localhost`.

Right now your apex **308-redirects to `www`**, so every real visitor is on
`www.soumyadeep.space` — the domain that is *not* activated. Two options:

**A. Make the apex canonical (recommended).** Vercel → Settings → Domains →
set `soumyadeep.space` as primary so `www` redirects to it. That matches the
`<link rel="canonical">` already in `index.html`, and the apex is already
activated, so the form starts working immediately.

**B. Activate `www` too.** Visit `https://www.soumyadeep.space`, submit the
form once, then click the new "Activate Form" link FormSubmit emails you.

Doing both is safest.

---

## ⚠️ The contact form needs ONE click before it works

If you submit the form and see *"That didn't send. Email me directly at…"*,
nothing is broken — **the form has not been activated yet.**

1. Open **soumyadeepdas044@gmail.com**
2. Find the email from **FormSubmit** ("Activate your form" / "Confirm your
   email"). **Look in Spam and Promotions** — it usually lands there.
3. Click **Activate Form**.
4. Submit the form once more. It will now say *"Thanks — that reached me."*

Until you do this, every message is refused by FormSubmit and the visitor is
shown your email address instead. The activation email is triggered by the
first submission, so it has already been sent.

---

## The contact form

It already works — it posts to [FormSubmit](https://formsubmit.co), which
needs no account, no API key and no backend.

**Do this once:** submit a test message from the live site. FormSubmit will
email you an *"Activate Form"* link. Click it. From then on every message
arrives in your inbox, and hitting reply answers the sender directly.

Until you activate, the form politely shows your email address instead of
pretending to send — so no one is left thinking they reached you when they
didn't.

To change the destination, edit the address at the end of `data-endpoint`
on the `<form>` in `index.html`:

```html
data-endpoint="https://formsubmit.co/ajax/YOUR@EMAIL.com"
```

Prefer a different service? Formspree, Getform and Web3Forms all accept the
same JSON POST — just swap the URL.

---

## Alternatives

**Netlify** — drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop),
then Domain settings → Add custom domain. Same DNS idea, different values.

**GitHub Pages** — push the repo, Settings → Pages → deploy from `main` root,
then add `soumyadeep.space` as the custom domain. You'll also need a
`CNAME` file containing your domain, and these four A records:
`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.

---

## Files that matter for the live domain

| File              | Purpose                                          |
|-------------------|--------------------------------------------------|
| `index.html`      | the site                                          |
| `404.html`        | shown on broken links (Vercel/Netlify auto-detect)|
| `robots.txt`      | tells search engines to index you                 |
| `sitemap.xml`     | lists your pages for Google                       |
| `assets/og-image.png` | preview card when the link is shared          |

If you ever change the domain, update it in **five places**: `<link rel="canonical">`,
`og:url`, `og:image`, `twitter:image`, and the `url` field in the JSON-LD
block — all in the `<head>` of `index.html` — plus `robots.txt` and `sitemap.xml`.
