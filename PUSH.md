# Getting these files into VS Code → GitHub → Vercel

Your site is already live, so this is an **update to an existing repo**.
Pick whichever section matches you.

---

## A. You already have the repo cloned locally

This is the normal case. You have a folder on your computer that you
previously pushed to GitHub.

1. **Unzip** `portfolio-soumyadeepdas.zip`. You get a `portfolio` folder.

2. **Copy the contents into your existing project folder, replacing files
   when asked.** Copy the *contents* of `portfolio/`, not the folder itself.

   These are the files that changed or are new:

   | File | Status | Why |
   |---|---|---|
   | `js/main.js` | **changed** | the contact-form fix |
   | `index.html` | **changed** | form attributes + SEO/social tags |
   | `css/styles.css` | **changed** | error-state styles |
   | `404.html` | new | custom not-found page |
   | `robots.txt` | new | search engine indexing |
   | `sitemap.xml` | new | for Google |
   | `vercel.json` | new | caching + security headers |
   | `.gitignore` | new | keeps junk out of the repo |
   | `assets/og-image.png` | new | link preview card |
   | `DEPLOY.md`, `README.md`, `PUSH.md` | notes | not part of the site |

3. **Open the folder in VS Code** (File → Open Folder).

4. **Check the diff.** Click the Source Control icon in the left sidebar
   (or `Ctrl+Shift+G`). You'll see the changed files listed. Click any one
   to see exactly what changed — worth a look before you commit.

5. **Commit and push:**
   - Type a message in the box, e.g. `Fix contact form, add SEO + 404`
   - Click **✓ Commit**
   - Click **Sync Changes** (or the ⋯ menu → Push)

   Prefer the terminal? `` Ctrl+` `` then:

   ```bash
   git add .
   git commit -m "Fix contact form, add SEO + 404"
   git push
   ```

6. **Done.** Vercel is watching the repo and redeploys automatically —
   usually 20–40 seconds. Watch it at [vercel.com/dashboard](https://vercel.com/dashboard).

---

## B. You don't have the repo locally (or want to start fresh)

1. Unzip the file and open the `portfolio` folder in VS Code.

2. Terminal (`` Ctrl+` ``):

   ```bash
   git init
   git add .
   git commit -m "Portfolio site"
   git branch -M main
   git remote add origin https://github.com/Soumyadeepdas2/YOUR-REPO-NAME.git
   git push -u origin main
   ```

   If the repo already has commits and git refuses the push, either
   `git pull --rebase origin main` first, or force it with
   `git push -u origin main --force` (only safe if this zip is the version
   you want to keep).

3. If the repo isn't connected to Vercel yet, go to
   [vercel.com/new](https://vercel.com/new), import it, set framework
   preset to **Other**, leave build command and output directory **empty**,
   and deploy.

---

## After it deploys — verify

1. Open `https://soumyadeep.space` and hard-refresh (`Ctrl+Shift+R`) to
   beat the browser cache.
2. Fill in the contact form and submit. Your email app should open with the
   message pre-filled. That confirms the fix shipped.
3. View source (`Ctrl+U`) and search for `canonical` — if it's there, the
   new build is live.

Still seeing the old site? It's almost always browser cache. Try an
incognito window before assuming the deploy failed.

---

## One setting worth fixing

`soumyadeep.space` currently redirects to `www.soumyadeep.space`, but the
site's canonical tag points at the non-www version. Search engines prefer
these to agree.

In Vercel → your project → **Settings → Domains**, set `soumyadeep.space`
as the primary and make `www` redirect to it. That matches the meta tags
already in `index.html`.
