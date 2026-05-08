Reference-only HTML experiments that are not loaded by the production Astro app.

- `cities.html`: archived source copy (runtime file is served from `public/cities.html`).
- `flow-gradient-full.html`: archived root experiment variant.
- `flow-gradient-fluid-v2-tuned.html`: archived tuned experiment variant.

Notes:
- Keep runtime/static assets in `public/` when they are loaded directly by URL.
- Keep route-backed source files at repo root only when code explicitly reads them
  (for example, `mesh-gradient.html` is read by `src/pages/mesh-gradient.html.ts`).
