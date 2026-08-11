# soumyadeep.space

Personal site. Static HTML, CSS and JavaScript — no build step, no framework.
Open `index.html` in a browser and it runs.

```
├── index.html
├── 404.html
├── css/styles.css
├── js/main.js
├── assets/          logos, résumé, social preview
├── robots.txt  sitemap.xml  vercel.json
└── DEPLOY.md   PUSH.md
```

## Design notes

Deliberately not a card-grid template.

- **Type** — three faces, each with a job. Cormorant Garamond Light (300) for
  display, Newsreader Light for article prose (about, hero bio), Inter for UI
  text and JetBrains Mono for labels. The display serif is high-contrast with
  fine hairlines; Newsreader is a text serif built for reading at body size.
- **Colour** — warm near-black `#0e0d0c` and paper `#f2efe9`, with a single
  terracotta accent `#c8553d`. No blue, no gradients, no glow.
- **Structure** — hairline rules and a ledger layout instead of floating cards
  with shadows. Work is an index of rows, not a grid of tiles.
- **Motion** — a line under the name that types what he does and cycles
  (edit the `DOES` array in `main.js`), quiet fades, a slide-in on work rows,
  and one set piece: the
  `Soumyadeep.java` class in About types itself out when it scrolls into view,
  then the caret stops. It runs once and respects `prefers-reduced-motion`.
- **Masthead** — transparent, using `mix-blend-mode: difference` so it inverts
  against whatever it sits over, and fades in a backdrop once you scroll.

Dark is the default; the toggle in the masthead switches to light and remembers.

**The signature** in the footer is a real one: photographed, isolated by ink
colour (red pen on neutral paper), vectorised with potrace, then animated. Its
centreline was extracted by skeletonising the ink and ordering the pixels into
stroke paths; those paths are drawn inside an SVG `<mask>` and revealed with
`stroke-dashoffset`, so it writes itself along the route the pen actually took.
Two strokes: "Soumyadeep", a pen lift, then "Das". Runs once when the footer
scrolls in. `assets/signature.svg` is the static version.

**The cat** in the bottom-right fades in once you've scrolled past ~55% of the
first screen, and sits above the colophon so it never covers the footer. It's
scripted, not AI — a fixed list of
questions and answers in the `ASKS` array in `main.js`. Every answer restates
a fact that's already on the page, so it can't invent anything, needs no API
key, and can't break. Edit or extend `ASKS` to change what it says.

## Editing

**Content** lives in `index.html` and reads top to bottom — opening, skills,
projects, education, achievements, contact. Adding a project means copying one `<li class="row">` and renumbering it.

**Colour** is six variables at the top of `css/styles.css`. Changing `--accent`
rebrands the whole site.

**The contact form** posts to [FormSubmit](https://formsubmit.co) and lands in
your inbox. No backend, no API key, no account.

> **One-time step:** the first time someone submits, FormSubmit emails you an
> "Activate Form" link. Click it once. Until you do, submissions are rejected
> and the visitor is shown your email address instead — nothing is lost, but
> nothing arrives either. Send yourself a test message and activate it.

To change where mail goes, edit the address at the end of `data-endpoint` on
the `<form>` in `index.html`. Replies go straight to the sender because their
address is set as `_replyto`.

## Deploying

See **DEPLOY.md** for Vercel plus DNS, and **PUSH.md** for the VS Code → GitHub
steps.
