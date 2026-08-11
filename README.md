# Portfolio — HTML / CSS / JS

A light, minimal developer portfolio. No frameworks, no build step. Open
`index.html` in a browser and it works.

```
portfolio/
├── index.html        all markup + content
├── css/styles.css    design tokens, layout, components, responsive
├── js/main.js        theme, nav, reveals, filters, carousel, form
└── assets/resume.txt placeholder résumé (swap for your PDF)
```

## What's in it
Hero with typewriter + counters · About · Skills with animated bars ·
Projects (BookyUniverse, Tellsgroup, DSA practice) · Education timeline +
résumé download · Achievements & verifiable certificates · Contact · Footer.

Extras: dark mode (saved to localStorage), sticky nav with scrollspy,
scroll progress bar, back-to-top, mobile menu, reduced-motion and print styles.

## Making it yours

**1. Name & details** — search `index.html` for `Soumyadeep Das`, `soumyadeep.das`,
`hello@soumyadeepdas.dev`, and the phone number; replace throughout. Also update
`<title>` and the `<meta name="description">`.

**2. Colors** — everything comes from the tokens at the top of `styles.css`:

```css
:root{
  --accent: #2f6df6;   /* change this one line to rebrand */
  --ink:    #101418;
  --bg:     #ffffff;
}
```

**Dark mode** uses an *elevation scale* rather than simply inverting the
light palette — surfaces get lighter as they rise off the page:

| Token         | Value     | Role                  |
|---------------|-----------|-----------------------|
| `--bg`        | `#090c12` | page floor            |
| `--bg-2`      | `#10151e` | tinted section bands  |
| `--surface`   | `#161d28` | raised cards          |
| `--surface-2` | `#1f2835` | card hover / popovers |
| `--bg-3`      | `#1c2430` | inset wells, chips    |

Each step is a *visible* jump (≥1.07:1) — an earlier pass had
`bg → bg-2` at 1.04:1, which the eye simply couldn't see.

Project thumbnails get their own per-card gradients at ~24% lightness and
~44% saturation, so each keeps a colour identity instead of going grey.

Cards also get `inset 0 1px 0 rgba(255,255,255,.055)` — a hairline top
highlight that makes them feel lit from above instead of pasted on. Inputs
go *darker* than their card (inset), the inverse of light mode. Every
text/background pair was checked and passes WCAG AA; most hit AAA.

The theme is set by a tiny inline script in `<head>` **before first paint**,
so dark-mode visitors never see a white flash. It follows the OS setting
until the visitor clicks the toggle, after which their choice is remembered.

**3. Your photo** — replace the `<svg>` inside `.portrait` with
`<img src="assets/me.jpg" alt="Soumyadeep Das">`.

**4. Projects** — copy any `<article class="project">` block. Add
`project--wide` to make a card span two columns (used for BookyUniverse).
The `project--ghost` card is the dashed "next project" placeholder — delete
it once you have a third real project. Swap the placeholder `<svg>`
thumbnails for `<img>` screenshots when you have them.

Two cards already use real logos: `.thumb--booky` renders the 128px
BookyUniverse PNG as a rounded app badge (capped at 112px so it never
upscales into blur), and `.thumb--tells` floats the transparent Tellsgroup
mark. Both are stored locally, so nothing breaks if the source site is down.

**5. Hero typewriter** — edit the `WORDS` array in `js/main.js`.

**6. Contact form** — it validates but doesn't send. Easiest fix, no backend:

```html
<form action="https://formspree.io/f/YOUR_ID" method="POST" id="contactForm">
```
then delete the `e.preventDefault()` line in section 11 of `main.js`.

## Deploying
Any static host works. Drag the folder onto Netlify, or:

```bash
npx vercel        # or: gh-pages -d .
```
GitHub Pages: push the folder and enable Pages on the branch root.

## Notes
- Accessible: skip link, focus rings, ARIA on menu/filters/carousel, semantic landmarks.
- Respects `prefers-reduced-motion` and `prefers-color-scheme`.
- Prints cleanly (nav, form and decoration hidden).
