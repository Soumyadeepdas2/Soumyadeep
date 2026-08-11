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

## Making the contact form deliver to your inbox

The form works right now with **no setup**: submitting opens the visitor's
email app with the message pre-filled and addressed to you. That's reliable,
but it needs them to have a mail client, and you can't see who bounced.

For messages to arrive in your inbox directly:

1. Sign up free at [formspree.io](https://formspree.io) (50 submissions/month).
2. Create a form; it gives you an endpoint like `https://formspree.io/f/abcdwxyz`.
3. In `index.html`, find the `<form id="contactForm">` tag and paste it in:

```html
<form class="form reveal" data-delay="2" id="contactForm" novalidate
      data-endpoint="https://formspree.io/f/abcdwxyz"
      data-fallback-email="soumyadeepdas044@gmail.com">
```

4. Redeploy. That's the only change — the JavaScript already handles both modes.

Confirm the first submission via the email Formspree sends you, or messages
stay pending. If the endpoint ever fails, the form automatically tells the
visitor to email you directly instead of silently losing the message.

Getform, Web3Forms and Basin all work the same way — any service that accepts
a JSON POST.

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
