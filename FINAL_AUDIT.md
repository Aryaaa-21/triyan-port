# Final Audit — Phases 1 to 4

Audited 2026-11-11 against `prompt.md` (the Phases 2–4 control document), by reading the
code, running every verification command, and driving the built site in a real browser.
No status below is taken from an earlier report.

**Status key:** DONE · PARTIAL · BLOCKED (waiting on something outside the codebase) ·
NOT IMPLEMENTED

## Verification run

| Command | Result |
|---|---|
| `npm run lint` (eslint + next lint + prettier) | Pass |
| `npm run typecheck` (shared, server, client) | Pass |
| `npm test` | **519 passed**, 0 failed (shared 163 · client 112 · server 244) |
| `npm run build` (shared, server, client) | Pass |
| API startup (`tsx src/api.ts`, real MongoDB) | `/readyz` → `{"status":"ready","database":"connected"}` |
| Production client (`next build && next start`) | Serves every route |
| `npm run e2e:browser` (Chromium, against the running stack) | All checks pass, exit 0 |
| `npm audit --omit=dev` | 0 vulnerabilities in production dependencies |

The browser run used a throwaway in-memory database holding two writings clearly labelled
`[fixture]` and 30 mock Instagram posts labelled `[mock]`. None of that data is in the repo
or any real database.

## Defects found and fixed during this audit

Every one of these passed the unit tests and only showed up in the browser:

1. **The mobile menu didn't work.** The header's `backdrop-filter` makes it the containing
   block for fixed-position children, so the "full-screen" panel was squeezed into the
   header strip and its links fell behind the page. Fixed by rendering the panel into
   `<body>` with a portal.
2. **`z-nav` / `z-overlay` produced no CSS.** Tailwind v4 has no z-index theme namespace, so
   these classes did nothing. Fixed with `z-(--z-*)`.
3. **Devanagari showed as empty boxes everywhere except the poem itself** (archive titles,
   excerpts, Instagram captions). Every font stack now falls back to Tiro Devanagari.
4. **The sitemap listed only `/` and `/writings`.** It now includes book, about, instagram,
   abyss and contact.
5. **No favicon**, so every page logged a 404. Added `app/icon.svg`.
6. Instagram tiles: the post-type label overlapped the caption.

## Requirements

### Core (Phase 1)

| Requirement | Implementation | Evidence / tests | Status | Remaining risk |
|---|---|---|---|---|
| CMS, auth, authorization | `auth.service`, `requireAdmin` on whole admin routers, argon2id, rotating sessions | `auth.routes.test`, `writing.routes.test`; every admin route returns 401 without a session | DONE | — |
| Draft / publish / unpublish / delete | `writing.service`, `/admin/writings/:id/{publish,unpublish}` | `e2e.publishing.test.ts` (18 cases: login → create → draft hidden → edit → publish → public → unpublish → hidden → delete) | DONE | — |
| Public writings, search, filters, related | `GET /writings` (text index, category/theme/language), `/writings/:slug/related` | route tests; browser: search, language filter | DONE | — |
| SEO, shareable URLs | per-page metadata, canonical, OG/Twitter, JSON-LD, sitemap, robots | browser + build | DONE | — |

### Phase 2 — public website

| Requirement | Implementation | Evidence | Status | Remaining risk |
|---|---|---|---|---|
| Homepage | `(site)/page.tsx`: opening → hero → selected writing → archive → book → Instagram → ABYSS → closing, all from the API | browser at 9 widths | DONE | Looks sparse until real writing is published |
| Writings archive | editorial list, search, category and language filters, empty/error states | browser | DONE | Theme and tag filters are API-only (no UI chips) |
| Writing detail | reading room: verbatim whitespace (`pre-wrap`), metadata, themes, share, related | browser: line and indentation preservation | DONE | — |
| About / Book | confirmed fields only; empty fields aren't rendered | `content.routes.test` asserts no age, birth date, publisher, ISBN, price, reviews | DONE | — |
| Book cover | page ready to show one | — | **BLOCKED** | Owner hasn't supplied a cover image |
| Contact | validated form, honeypot, 5/hour limit, can be switched off in settings | contact tests; API returns `delivery: PENDING_TRANSPORT` | **PARTIAL** | No email provider and no professional email address: messages are accepted but **not delivered** |
| Navigation / footer | desktop line nav; full-screen mobile panel (now working) | browser: mobile menu navigates | DONE | — |
| Light / dark | `void` / `manuscript`, set before first paint, saved, follows system | browser: toggle persists across reload | DONE | — |
| Responsive | 320, 375, 390, 414, 768, 1024, 1280, 1440, 1920 | browser: 13 routes × 9 widths, no horizontal overflow, exactly one `h1` | DONE | — |
| Hindi / Unicode | `lang="hi"`, Devanagari face, fallback in every stack | browser: computed font is Tiro Devanagari | DONE (technically) | **No real Hindi poem has been tested**: none has been supplied |
| Real literary content | content system ready | — | **BLOCKED** | Poem texts withheld by the owner; nothing has been invented |

### Phase 3 — Instagram

| Requirement | Implementation | Evidence | Status | Remaining risk |
|---|---|---|---|---|
| Official API integration | `graph.provider.ts` (graph.instagram.com, Instagram Login) | `graph.provider.test` (endpoint, fields, paging, error mapping) | **BLOCKED** | Never run against the real API. Needs a Professional account, a Meta app and a long-lived token. See `docs/INSTAGRAM.md` |
| Initial / incremental sync, pagination, checkpoint, dedup, retry | `sync.service.ts` | `sync.service.test` (14 cases on a real MongoDB) | DONE (mock provider) | — |
| Token expiry, invalid token, rate limits, API down, missing credentials | error kinds mapped to health states; rate-limit window; 503 with a clear message | sync + route tests | DONE | Automatic token refresh is NOT IMPLEMENTED; expiry is reported in the admin |
| Deleted / missing media | marked `available:false`, history kept, restored if the post reappears | sync test | DONE | — |
| Classification (categories, themes, emotions, language, confidence, needsReview) | `services/classifier` (rules, bilingual lexicon, strategy interface) | `classifier.test` (17 cases) | DONE | Rules are keyword-based, so poetic captions will often land in `needsReview`. That is intended, not hidden |
| Manual correction | override + append-only `corrections[]`; kept through reclassify and caption edits | route tests; browser: correct, hide, sync | DONE | — |
| `/instagram`, `/instagram/:id`, reels, original links | server-rendered grid, cursor pagination, filters, detail page with related posts | browser | DONE | Instagram CDN links expire; mirroring media is NOT IMPLEMENTED |
| Scheduled sync | worker interval from `SYNC_CRON` | `schedule.test` | DONE | — |
| Never show mock data in production | `publicProviderFilter`; mock provider reports itself unconfigured in production | code review | DONE | — |

### Phase 4 — visual identity

| Requirement | Implementation | Evidence | Status | Remaining risk |
|---|---|---|---|---|
| Cosmic intro + Three.js | `features/cosmos`: star and dust field, scroll speeds up the drift, theme-aware | browser: renders, about 47 fps in software GL | DONE | — |
| Lazy loading, code splitting, mobile limits, low-end / WebGL / reduced-motion fallback | 169 KB gz chunk loaded after idle; device tiers; pauses off screen | `cosmos.test`; browser: no Three.js download under reduced motion or without WebGL | DONE | — |
| Custom cursor | companion ring with 6 states; system cursor never hidden | `motion.test`; browser: every state | DONE | — |
| Motion system | split-letter type, reveals, page entrance, parallax, scroll cue; all disabled under reduced motion | browser: no content left invisible | DONE | — |
| Experimental typography | hero, opening, ABYSS mark; poems untouched | screenshots | DONE | — |
| ABYSS identity | mark, outlined echo, philosophy, "now", empty reserved spaces for garments and ventures | screenshots | DONE | No products, by design |

### Quality

| Area | Evidence | Status | Remaining risk |
|---|---|---|---|
| Accessibility | semantic landmarks, one `h1` per page, skip link, visible focus, labelled controls, `lang` on Hindi, nothing depends on hover/WebGL/cursor, reduced motion, contrast checked by `tokens.test` | **PARTIAL** | No automated axe audit; no screen-reader pass with real assistive tech |
| Performance | homepage first load 144 KB gz (framework floor 132 KB); local desktop LCP 296 ms, CLS 0.000 | **PARTIAL** | Measured locally only. No throttled mobile Lighthouse run, no INP measurement, no field data |
| Security | helmet, CORS allow-list, global + login + contact rate limits, argon2id, httpOnly SameSite=Lax cookies, zod validation everywhere, body limits, admin traffic proxied same-origin, 0 production vulnerabilities | DONE, with risk | **No Content-Security-Policy on the site** (inline theme script and JSON-LD need a nonce setup); 10 moderate advisories in dev dependencies |
| SEO | metadata, canonical, OG/Twitter, JSON-LD (Person, Book, CreativeWork), full sitemap, robots | DONE | Individual Instagram posts aren't in the sitemap |
| Unit + integration tests | 519 passing | DONE | — |
| E2E | server CMS flow (`e2e.publishing.test.ts`); browser flow (`e2e/browser.mjs`) | DONE | Browser E2E is not in CI and needs Chromium installed |
| CI / deployment | — | **NOT IMPLEMENTED** | No git remote and no CI pipeline: all history lives on one disk |

## External dependencies (owner action needed)

1. Poem texts, including Hindi poems.
2. Book cover image (and, if wanted, publisher, ISBN, price, date).
3. A professional email address, plus an email provider (e.g. Resend or Postmark) so contact messages are delivered.
4. Instagram: Professional account, Meta app with `instagram_business_basic`, long-lived token.
5. A git remote and hosting accounts (Vercel, Railway, MongoDB Atlas).

## Production risks, by severity

1. **No offsite copy of the code** (no git remote). Create one and push.
2. **Contact messages aren't delivered.** Either keep the form disabled in settings or add a provider before launch.
3. **No CSP header** on the site.
4. **Instagram media links expire** and the token expires after 60 days. Both need work (media mirroring, token refresh) before the archive can run unattended.
5. Performance and accessibility haven't been checked on real mobile hardware or with real assistive technology.
