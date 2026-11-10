# TRIYAN — Implementation Roadmap

> **Superseded ordering (2026-11-10).** The owner's audit brief reorders delivery so the
> visual layer — cinematic intro, 3D, cursor, transitions — comes *after* core
> functionality is stable, rather than at Phase 4. That is the better order: it stops the
> homepage and archive being built against imagined API shapes and retrofitted later.
> **`PROJECT_AUDIT.md` → Recommended Execution Order is now authoritative.** The phase
> table below is retained for its per-phase exit criteria, which still apply.

Each phase ships working, tested, buildable code. A phase closes only when **all six gates** pass:
`typecheck · lint · tests · production build · a11y (axe) · perf budget`.

Legend: **🔒 blocked on you** = needs something only Triyan can provide.

| Phase | Deliverable | Exit criteria |
|---|---|---|
| **0 — Architecture** ✅ | `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` | Decisions D1–D7 agreed |
| **1 — Setup** | npm workspaces, `shared/` taxonomy + zod, Next.js 15 + TS strict, Express + TS, eslint/prettier, vitest, CI script, `.env.example`, zod-validated env, Mongo connection, `/healthz` | `npm run verify` green on an empty app |
| **2 — Design system** | `tokens.css` (VOID + MANUSCRIPT), fonts via `next/font`, Tailwind v4 `@theme`, primitives (Button, Field, Chip, Tag, Prose, Rule, Reveal), contrast test | Token contrast test green; zero hardcoded colors |
| **3 — Shell** | Root layout, 5-item nav, footer, theme toggle (system-aware + persisted), custom cursor (desktop-only, pointer-aware), page transitions, 404/500 literary error states | Keyboard-navigable, cursor absent on touch, reduced-motion honoured |
| **4 — 3D intro** | R3F void scene: stars → cosmic object → gravitational drift → approach → `ABYSS` → `~ TRIYAN` → dissolve. Skip control, `sessionStorage` + `localStorage` "seen" state, capability detection, mobile particle reduction, WebGL-less CSS fallback | Lazy chunk ≤ 220 KB gz, never blocks LCP, static frame under reduced-motion |
| **5 — Homepage** | Editorial asymmetric sections: identity, literary statement, featured writings, archive invitation, book, Instagram, ABYSS, about, contact. No card grid. | LCP < 2.0 s mobile; all copy from API/CMS, none hardcoded |
| **6 — Archive** | `/writings` with debounced search (350 ms), category/language/theme/emotion/date/featured filters, URL-synced state, server pagination, empty + no-result states | Filters shareable via URL, SSR-rendered first page |
| **7 — Reading page** | `/writings/[slug]`: large display title, quiet metadata, optimal measure, Devanagari switching, share (native/copy/WhatsApp), related writings, no floating overlays | ≤ 120 KB JS; nothing animates in the poem body |
| **8 — Data layer** | All 16 Mongoose models, indexes, taxonomy seed, public API with zod validation + caching, ISR revalidation webhook | Model + API integration tests green |
| **9 — Admin auth** | argon2id, access/refresh rotation, Next.js first-party proxy, CSRF, rate limits, `seed-admin` CLI, `/admin` guard | Every admin route 401s unauthenticated (asserted in tests) |
| **10 — Admin CMS** | Dashboard, writing editor with live classify-preview + autosave + reader preview, taxonomy/book/about/abyss/settings/media/SEO screens, waitlist + CSV export | 60-second publish path demonstrated end-to-end |
| **11 — Instagram integration** 🔒 | `InstagramProvider` + Graph implementation + full mock provider, token refresh job, mapper, limitation surface in admin | Mock suite covers pagination, duplicates, updates, 429, 5xx, token expiry, deleted media |
| **12 — Sync** | Resumable paginated full import, incremental mode, cursor checkpoints, single-flight lock, media mirroring, removal reconciliation, job history, health states | Interrupted sync resumes with zero duplicates (test) |
| **13 — Classification** | Normalizer, language detector, lexicons (EN/HI/Hinglish), scorer, confidence, `RulesClassifier`, review queue, corrections + suggestions, dedup/simhash + writing auto-link, reclassify with confirmation | Determinism test; `bookExclusive` leak test; correction audit test |
| **14 — Instagram archive** | `/instagram` editorial mixed-rhythm gallery (not a 3×3 grid), filters, infinite scroll with cursor, lazy media, Reels as poster + play (no autoplay), `/instagram/[shortcode]` detail with writing cross-links | No media loaded above budget; indexation policy enforced |
| **15 — Book** 🔒 | `/book` as a literary object: cover, editorial description, excerpts, reviews when available, Amazon CTA, `bookExclusive` handling, CMS fields left empty where unknown | Zero invented metadata (§5) |
| **16 — ABYSS** | `/abyss`: gothic/brutalist register, "soul is deeper than the abyss", philosophy, coming-soon, waitlist (rate-limited, duplicate-safe, consent notice), admin export | Mobile-first, no hover dependency |
| **17 — SEO** | Per-route `generateMetadata`, canonicals, OG/Twitter, dynamic OG images, JSON-LD (Person, Book, CreativeWork), `sitemap.xml`, `robots.txt`, RSS, indexation policy | Rich-results validation clean; no fabricated structured data |
| **18 — Analytics** | First-party event API + collection, views/searches/filters/Amazon/Instagram/ABYSS/waitlist, admin charts, TTL retention | No PII, no third-party script |
| **19 — Performance** | Image pipeline (AVIF/WebP, responsive), route splitting, bundle analyzer in CI with budgets, API caching, Lighthouse CI | All §12 budgets met |
| **20 — Accessibility** | Focus management, skip link, landmarks, ARIA only where needed, alt text pipeline, form errors, reduced motion, screen-reader pass | axe clean on every route; keyboard-only walkthrough passes |
| **21 — Testing** | Fill every mandatory suite from ARCHITECTURE §12, Playwright critical flows, CI matrix | Coverage thresholds met; CI green |
| **22 — Deployment** | Vercel + Railway (api + worker) + Atlas + Cloudinary, `SETUP.md`, `ENVIRONMENT.md`, `INSTAGRAM.md`, `DEPLOYMENT.md`, `TROUBLESHOOTING.md`, admin seed, sync config | Production deploy live, first real sync green |

## What I need from you, and when

| When | What | Why |
|---|---|---|
| Before Phase 11 | Meta app ID + secret, and the long-lived Instagram token for `@triyanwrites` (`instagram_business_basic`) | Live sync. Phases 1–10 and 13 are built and tested entirely on the mock provider, so nothing is blocked until then. |
| Before Phase 15 | Amazon URL for *Leaving and Living*, cover image, and any of: publisher, ISBN, price, publication date, formats, real reviews, favourite poem | I will not invent any of it (§5). Unknown fields ship empty and flagged incomplete. |
| Before Phase 5/7 | A handful of real poems (EN + HI) to develop against, and the ~20-word literary statement for the homepage | So typography and the classifier are tuned on real work, not lorem ipsum. |
| Before Phase 34/16 | Anything you want said in About, and the ABYSS philosophy paragraph beyond the tagline | Same reason. |
| Anytime | The typography references you mentioned (Aquiline-style) | To validate or revise the display-face choice. |
