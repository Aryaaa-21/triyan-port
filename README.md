# TRIYAN

The literary home of **Triyan** — poet, writer, artist — and of **ABYSS**.

> An immersive digital universe where literature, philosophy, art and creative expression
> converge — an archive of everything that words cannot contain.

## Documentation

| Document | Contents |
|---|---|
| [`docs/SETUP.md`](docs/SETUP.md) | Running it locally |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Vercel (website), Railway (API), MongoDB Atlas |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Product, technical, visual, data, API and deployment architecture |
| [`docs/INSTAGRAM.md`](docs/INSTAGRAM.md) | Connecting the official Instagram API |
| [`FINAL_AUDIT.md`](FINAL_AUDIT.md) · [`UI_UX_AUDIT.md`](UI_UX_AUDIT.md) | What is done, what is blocked, and the evidence |

## Stack

A **MERN** app in an npm-workspaces monorepo:

- **MongoDB** — the archive (Mongoose 9); Atlas in production
- **Express** — the API (`/api/v1`), `/sitemap.xml`, `/robots.txt`, and in production the
  site itself, from one origin (`server/`)
- **React** — the site: React 19 + React Router 7, built with Vite, Tailwind v4, and a
  WebGL shader for the black hole (`client/`)
- **Node** — 22
- **shared** — zod schemas, taxonomy and types used by both
- **Instagram** — official Instagram API with Instagram Login only. No scraping.

## Quick start

From an Ubuntu (WSL) terminal — see [`docs/SETUP.md`](docs/SETUP.md):

```bash
npm install
npm run dev:db      # a local MongoDB (in memory) on :27017 — in its own terminal
npm run dev         # API on :4000 and the site on http://localhost:3000
```

Production-style, one process serving the site and the API:

```bash
npm run build && npm start    # http://localhost:4000
```

`npm run verify` runs lint, typecheck, tests and the production build.
