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
