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

An npm-workspaces monorepo:

- **client** — Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, a WebGL shader
  for the black hole → **Vercel**
- **server** — Express 5, TypeScript, Mongoose 9, an Instagram sync worker → **Railway**
- **shared** — zod schemas, taxonomy and types used by both
- **data** — MongoDB Atlas
- **Instagram** — official Instagram API with Instagram Login only. No scraping.

## Quick start

```bash
nvm use            # Node 22
npm install
npm run verify     # lint, typecheck, tests, build
```

Then follow [`docs/SETUP.md`](docs/SETUP.md) to run the API and website locally.
