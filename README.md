# Garrett Gunther — Astro Site

This repository is organized for Astro builds on GitHub and Cloudflare Pages.

## Media Workflow (Astro-first)

The website does **not** read from legacy Webflow HTML exports at runtime.

- Source of truth for project media list: `src/data/media-manifest.json`
- Raw media source folder (commit this): `media-source/`
- Generated runtime folder (do not commit): `public/media/`, `public/video/`, `public/icons/`, `public/favicon.png`
- Sync script: `scripts/sync-media.mjs`

Required media layout:

```text
media-source/
├── media/
│   └── <project-slug>/
│       └── <files listed in src/data/media-manifest.json>
├── video/
│   └── *.mp4 (or *.webm)
├── icons/
│   └── *.png
└── favicon.png
```

## Commands

- `npm install` — install dependencies
- `npm run dev` — sync media, then run local dev server
- `npm run bootstrap-media` — one-time copy from local `ORIGINAL/` archive into `media-source/`
- `npm run sync-media` — validate + copy media-source assets into `public/`
- `npm run build` — sync media, then build Astro output in `dist/`
- `npm run build:cloudflare` — Cloudflare Pages build command
- `npm run preview` — preview built output

## Cloudflare Pages Setup

- Framework preset: `Astro`
- Build command: `npm run build:cloudflare`
- Build output directory: `dist`
- Node version: `22.12.0` or newer

`public/_headers` and `public/_redirects` are included in builds for Cloudflare Pages behavior.

## Hosted Images (cloud hosting, not part of the site)

Anything in `public/` is published verbatim at the matching URL, which makes it a
convenient place to park images that need a stable public link (email signatures,
one-off shares) even though no page on the site renders them.

Convention for new uploads:

```text
public/hosted/<topic-or-person>/<file>   →  https://garrettgunther.com/hosted/<topic-or-person>/<file>
```

- `public/carlee/` predates this convention. **Leave its paths alone** — the URLs
  may already be linked from outside the repo, and moving a file changes its URL.
- Keep files web-sized; everything here ships on every deploy.
- These folders are intentionally unreferenced by any page. Don't "clean them up"
  just because nothing imports them.

## References Archive (`references/`)

`references/` is committed for reference but **never built or served** — Astro only
creates routes from `src/pages/`, and only `public/` is published.

- `references/experiments/` — WebGL/gradient studies, including the former
  `/fluid/`, `/fluid-background/`, and `/mesh/` routes plus `FluidMarbleFull.astro`.
  To bring one back, move the page into `src/pages/` (and its component into
  `src/components/`).
- `references/fonts/erode/` — the unused Erode family. To use it, copy the folder
  into `public/fonts/` and re-add the `@font-face` blocks to `src/styles/fonts.css`.

Two files in `public/` are live dependencies despite looking standalone:
`flow-gradient-full.html` (the dark-mode background, iframed by `BaseLayout`) and
`cities.html` (iframed by `/cities/`). Don't remove them.
