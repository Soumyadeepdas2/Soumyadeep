# Soumyadeep Das — Portfolio

A static, responsive portfolio built with HTML, CSS and vanilla JavaScript.

## Deploy

Deploy the project root to Vercel. The site expects `www.soumyadeep.space` to remain the primary domain, with the apex domain redirecting to it.

## Structure

- `index.html` — portfolio content and metadata
- `404.html` — custom not-found page
- `css/styles.css` — layout, themes, responsive styles and local font declarations
- `js/main.js` — progressive interactions and contact form handling
- `assets/` — résumé, social preview, favicon and self-hosted fonts
- `vercel.json` — caching and security headers

## Adding another project

### Required file

Edit **`index.html`**. Inside `<section id="projects">`, duplicate one complete
`<article class="project">...</article>` block. Put the newest project first,
renumber the `project__no` values, and update its:

- title and live URL
- year
- “What it solves” description
- “Built with” stack
- live/source links

The existing CSS and JavaScript automatically handle the layout, mobile view and
scroll reveal, so **`css/styles.css` does not need to change** for a normal project.

Also in `index.html`, update the `live products` chip, hero/skills copy and SEO
`description` tags when the overall project count or featured names change.

### Optional synchronization

- **`js/main.js`** — update the cat helper’s `What has he built?` answer.
- **`assets/og-image.png`** — update it when the social preview should feature the new project.
- **Résumé PDF** — update separately if the project should appear in the résumé.

## Before publishing

1. Deploy and submit one real contact-form test from `www.soumyadeep.space`.
2. If FormSubmit sends an activation email, approve it for that exact domain.
3. Confirm that the WhatsApp number in `index.html` is the intended public number.
4. Add source-code links when repositories are ready to share publicly.

Font license texts are consolidated in `assets/fonts/FONT-LICENSES.txt`.
