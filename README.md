# TRIYAN

The literary home of **Triyan** — poet, writer, artist — and of **ABYSS**.

> An immersive digital universe where literature, philosophy, art and creative expression
> converge — an archive of everything that words cannot contain.

## Documentation

| Document | Contents |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Product, technical, visual, information, data, API, Instagram, classification, admin, deployment architecture |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phase-by-phase implementation plan with exit criteria |

## Stack

- **client** — Next.js 15 (App Router), TypeScript, Tailwind v4, React Three Fiber, GSAP → Vercel
- **server** — Express, TypeScript, Mongoose, node-cron worker → Railway
- **data** — MongoDB Atlas · **media** — Cloudinary (behind a provider interface)
- **Instagram** — official Instagram API with Instagram Login only. No scraping.

## Quick start

Not yet scaffolded — see Phase 1 in the roadmap.
