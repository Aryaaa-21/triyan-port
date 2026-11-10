# PROJECT AUDIT — Triyan Writes / ABYSS

**Audit date:** 2026-11-10
**Auditor:** Claude Opus 5 (also the author of all code audited — see caveat below)
**Commit audited:** `559be36`
**Verdict:** **~10% complete.** Foundation is sound. The product does not yet exist.

---

## Caveat on this audit's value

This audit is weaker than a normal one, and you should know why.

This codebase is **four commits old and I wrote all of it in this session**. There is no
inherited code, no previous author, no archaeology to do. So the categories that make an
audit valuable — undocumented decisions, fake implementations left by someone else,
accumulated debt — are almost empty, and not because the code is excellent. They are
empty because the code is *young*.

An audit by the person who wrote the code is also structurally compromised: I am checking
my own work against my own intent. I have tried to compensate by relying on executed
evidence (builds, tests, HTTP responses, screenshots, greps) rather than on my memory of
what I meant to build. Every status below cites what was actually run.

**Recommendation:** treat this as a status report with evidence, and get an independent
review before launch.

---

## Executive Summary

| | |
|---|---|
| Phases complete | **3 of 23** (Phase 0 architecture, 1 setup, 2 design system) |
| Source files | 67 tracked, 3,027 lines |
| Tests | **110 passing**, 0 failing |
| Build | Passes. `VERIFY_EXIT=0` for lint → typecheck → test → production build |
| Database models | **0 of 16** |
| API endpoints | **3 of ~45** (`/healthz`, `/readyz`, `/api/v1`) |
| Public routes | **1 of ~14**, and it is a placeholder |
| Admin | **Does not exist** |
| Instagram | **Does not exist** |
| Production vulnerabilities | **0** (`npm audit --omit=dev`) |
| Secrets committed | **None** |

**What is real:** a correctly-wired monorepo, a hardened Express shell, a shared taxonomy
that both sides consume, and a design system whose legibility is enforced by tests that
fail the build.

**What is not real:** everything a visitor or Triyan would actually use. No writing can be
stored, published, read, searched or shared. Triyan cannot log in. No Instagram post has
ever been synchronised, because no code exists to synchronise one.

**The single biggest risk is not technical.** It is that there is no content. Seven writing
*titles* have been supplied with an explicit instruction not to fabricate the body text. A
literary archive with no literature cannot be meaningfully finished, designed or tested.

---

## Architecture Audit

### Frontend — **PARTIAL**, sound
Next.js 16.4.6, App Router, React 19.3.1, TypeScript 5.9.3 strict, Tailwind v4.3.5.
Server-rendered; `generateMetadata` available per route. One route exists.
Security headers set in `next.config.ts`. SSR API client with ISR cache tags and
`stale-if-error` so pages survive an API outage.
*Verified:* production build succeeds; page rendered and inspected in both themes and at
390px/360px viewports.

### Backend — **PARTIAL**, sound
Express 5.3 + TypeScript, ESM. Middleware order is deliberate: helmet → CORS allowlist →
compression → request id → pino → rate limit → body parsers → cookies → routes → 404 →
error handler. Typed `HttpError` maps to a single error envelope with a correlation id.
Split `api` / `worker` entry points exist; the worker schedules nothing yet.
*Verified by HTTP:* `/healthz` 200, `/readyz` 503 with reason, `/api/v1` envelope, unknown
route 404 with `requestId`, `nosniff` + `referrer-policy` present, no `x-powered-by`.

### Database — **MISSING**
Mongoose 9.12 connection helper exists with `sanitizeFilter` and `strictQuery`. **Zero
models, zero indexes, zero queries.** No MongoDB instance is connected; Docker's WSL
integration is off and there is no local `mongod`. The API deliberately boots without a
database in development and reports the degraded state honestly.

### Authentication — **MISSING**
No `User` model, no login route, no session, no password hashing, no admin guard.
Designed (argon2id, rotating refresh tokens, first-party cookie via a Next proxy, CSRF)
but **not a line of it is written**.

### External integrations — **MISSING**
No Instagram provider, no mock provider, no media provider, no OCR. The capability matrix
and sync algorithm are specified in `docs/ARCHITECTURE.md` §7; none is implemented.

### Deployment — **MISSING**
No CI workflow, no `Dockerfile`, no `railway.json`, no `vercel.json`, **no git remote**.
The repository exists on one disk with no backup.

---

## Feature Matrix

Status is judged against the complete workflow, per the operating rule — not against
whether a file exists.

### Visitor capabilities (spec §59)

| Feature | Status | Evidence | Problems | Priority |
|---|---|---|---|---|
| Enter the site | PARTIAL | `curl /` → 200, rendered and screenshotted | Placeholder content only; no nav, no footer | P1 |
| Navigate all pages | MISSING | `/writings` → 404 | Only `/` exists | P0 |
| Read a writing | MISSING | No route, no model | The core product | P0 |
| Search writings | MISSING | — | — | P0 |
| Filter by category/theme/emotion/language | MISSING | Taxonomy exists in `@triyan/shared`; no UI, no query | — | P0 |
| Share a writing URL | MISSING | — | — | P1 |
| Discover the book | MISSING | — | Amazon URL now supplied | P1 |
| Browse Instagram archive | MISSING | — | Blocked on Meta credentials for live data | P1 |
| Filter Instagram content | MISSING | — | — | P2 |
| Open original Instagram post | MISSING | — | — | P2 |
| Discover ABYSS | MISSING | — | — | P2 |
| Contact Triyan | MISSING | — | No email address supplied | P2 |
| Use the site on mobile | PARTIAL | Verified correct at true 390px and 360px viewports | Only one page exists to verify | P1 |
| Theme toggle (Void/Manuscript) | PARTIAL | Both environments render; system preference honoured; choice persists | **No toggle UI** — a visitor cannot switch | P1 |

### Triyan's capabilities (spec §59)

| Feature | Status | Evidence | Problems | Priority |
|---|---|---|---|---|
| Log in | MISSING | No auth code | — | P0 |
| Create / edit / draft / preview writing | MISSING | No CMS | — | P0 |
| Publish / unpublish | MISSING | — | — | P0 |
| Categorise and tag | MISSING | — | — | P0 |
| Edit About / Book / ABYSS / Contact | MISSING | — | Required so content changes need no code | P1 |
| Correct a classification | MISSING | — | — | P1 |

### Instagram (spec §16–§25)

| Feature | Status | Evidence | Problems | Priority |
|---|---|---|---|---|
| Official API integration | MISSING / BLOCKED | — | Needs Meta app + long-lived token | P1 |
| Mock provider for development | MISSING | — | Required so sync is testable offline | P0 |
| Initial historical sync with pagination | MISSING | — | — | P1 |
| Incremental sync | MISSING | — | — | P1 |
| Duplicate prevention | MISSING | — | Design relies on a unique index that does not exist | P1 |
| Deleted media → `sourceAvailable=false` | MISSING | — | — | P2 |
| Retry / rate limit / token expiry handling | MISSING | — | — | P1 |
| Sync status visible to admin | MISSING | — | — | P2 |

### Classification (spec §23–§25)

| Feature | Status | Evidence | Problems | Priority |
|---|---|---|---|---|
| Taxonomy (8 categories, 20 themes, 14 emotions, 4 languages) | DONE | `shared/src/taxonomy.ts`, 6 tests | — | — |
| Rule-based classifier | MISSING | — | — | P1 |
| Confidence + `needsReview` | MISSING | Threshold constant exists; nothing computes it | — | P1 |
| Manual override preserved across sync | MISSING | — | — | P1 |
| Re-run classification | MISSING | — | — | P2 |

### Cross-cutting

| Feature | Status | Evidence | Problems | Priority |
|---|---|---|---|---|
| Design tokens, dual environment | DONE | 54 token tests; AAA contrast on body copy; zero colour literals outside `tokens.css` | — | — |
| Typography system | DONE | 5 families build; 55 subsets fetched; Devanagari auto-selected from language | Unverified against real Hindi poetry — none supplied | P1 |
| UI primitives | DONE | 7 components, 18 tests covering ARIA and language selection | Small set; will grow | — |
| Error envelope + correlation ids | DONE | Verified over HTTP | — | — |
| Security headers, CORS allowlist, rate limiting | DONE | Verified over HTTP | Not yet exercised against real auth | — |
| Literary 404 | MISSING | `/no-such-page` → Next's default "This page could not be found" | Spec §41 explicitly forbids a generic 404 | P1 |
| Error boundary (`error.tsx`) | MISSING | File absent | — | P1 |
| `sitemap.xml` / `robots.txt` | MISSING | Files absent | — | P1 |
| Favicon / icon | MISSING | No `icon.*` in `app/` | — | P2 |
| Analytics | MISSING | — | — | P2 |
| 3D intro | MISSING | — | Deliberately deferred — see execution order | P2 |
| Custom cursor | MISSING | — | — | P2 |
| CI pipeline | MISSING | `npm run verify` works but nothing runs it automatically | — | P1 |
| Deployment config | MISSING | — | — | P1 |

---

## Critical Bugs

**No open bugs.** Three were found and fixed during this session by running the app rather
than by reading it:

1. **API crashed at startup.** `db.ts` imported `ConnectionStates` as a named export from
   mongoose — present in the type declarations, absent from the ESM runtime build. It
   typechecked and then threw `SyntaxError`. *Fixed in `559be36`; `modules.test.ts` now
   loads every server module at runtime so this class of defect cannot recur silently.*
2. **A design token was silently ignored.** `max-w-prose` resolved to Tailwind's built-in
   `65ch`, not `--measure-prose`; `max-w-prose` and `max-w-full` are static utilities that
   the `--container-*` mappings shadowed without error. *Fixed: mapping removed, explicit
   `.measure-*` utilities are now the only way to set a reading measure.*
3. **`verify` ran lint before building `@triyan/shared`,** producing 15 spurious
   "type cannot be resolved" errors. *Fixed in `bc6438d`.*

Browser console errors are **UNVERIFIED** — Chrome's debug port is not reachable from WSL,
so no console capture has been performed. This should be closed out with real browser
automation during QA.

---

## Security Issues

| Issue | Severity | Status |
|---|---|---|
| Secrets committed | — | **None.** Scanned for Mongo URIs with credentials, Instagram tokens, AWS keys. Clean. |
| `.env` tracked | — | **No.** Only `.env.example` for both workspaces; `server/.env` and `client/.env.local` confirmed gitignored. |
| Production dependency vulnerabilities | — | **0** (`npm audit --omit=dev`). 11 moderate exist but are all dev-only, inside ESLint's dependency tree. |
| Authentication | **HIGH** | Does not exist. Every admin control in the spec is unprotected because none exists yet. |
| Authorization tests | **HIGH** | The rule that every admin route must 401 when unauthenticated is specified and **untested**, because there are no admin routes. |
| Build artifact committed | LOW | `client/tsconfig.tsbuildinfo` is tracked. Harmless (a file-path list) but it leaks local directory structure and causes diff churn. **Should be gitignored.** |
| Rate limiting | — | Global limiter present. Per-account login throttling not built. |
| CSRF | — | Designed, not built. No mutating endpoint exists yet. |

No exploitable vulnerability was found, largely because there is not enough application to
attack.

---

## Missing Features

Everything in the Feature Matrix marked MISSING. The load-bearing ones, in dependency
order:

1. **16 database models and their indexes** — nothing can be stored.
2. **Public content API** — writings, taxonomy, book, about, abyss, waitlist, contact.
3. **Admin authentication** — argon2id, refresh rotation, first-party cookie, CSRF.
4. **Admin CMS** — the writing editor and content screens.
5. **Instagram provider + mock provider** — the mock is a prerequisite for testing sync.
6. **Sync service** — pagination, checkpointing, resume, dedup, retry, rate limits.
7. **Classification service** — normaliser, language detector, lexicons, scorer, confidence.
8. **Public pages** — archive, reading page, book, about, instagram, abyss, contact.
9. **SEO output** — sitemap, robots, JSON-LD, OG images, canonicals.
10. **Literary 404 and error boundaries.**
11. **Visual layer** — intro, cursor, transitions.
12. **CI, deployment config, git remote.**

---

## Technical Debt

Genuinely small, because the code is new. Recorded honestly rather than padded:

| Item | Severity | Note |
|---|---|---|
| `client/tsconfig.tsbuildinfo` tracked in git | LOW | Build artifact. Gitignore and `git rm --cached`. |
| `@testing-library/jest-dom` installed, never imported | LOW | Unused dependency. Remove, or start using its matchers. |
| Client lint is weaker than server lint | MEDIUM | `eslint-config-next`'s parser does not forward `parserOptions.project`, so type-aware rules cannot run on the client. Mitigated by `tsc --noEmit`, but the asymmetry is real and should be revisited. |
| Zod schemas have no tests | **MEDIUM** | `shared/src/schemas/` is the validation backbone for the API *and* every admin form, and nothing exercises it. I rewrote `csvArray` twice during Phase 1 — once for a type error, once for unsafe stringification — and no test caught either. This is the most important gap in the current test suite. |
| Test distribution is lopsided | MEDIUM | 54 of 110 tests assert design tokens. Server has 19, of which 11 are import smoke tests. |
| Placeholder copy in `page.tsx` | LOW | Expected at this stage; must not survive Phase 2 of the new plan. |
| Homepage content is hardcoded | LOW | Correct to flag — it must come from the CMS before launch. |
| Performance budget was wrong | RESOLVED | The original 120 KB reading-route target was below the framework floor of 131.7 KB. Re-baselined against measurement; `measure-bundle.mjs` reports it. |

---

## Content status (spec §51–§55)

Newly supplied, now recorded:

| Item | Status |
|---|---|
| Amazon link | `https://amzn.in/d/06c0R7gp` — **supplied**, destination not yet verified |
| Personal Instagram | `https://www.instagram.com/triyxnn` — supplied |
| Literary Instagram | `https://www.instagram.com/triyanwrites` — supplied |
| Book concept + audience + sales line | Supplied |
| Bio facts | Supplied |
| ABYSS tagline and philosophy | Supplied |
| 7 writing titles | Supplied, **body text explicitly withheld** |

Still required from the owner, and genuinely blocking:

| Item | Blocks |
|---|---|
| **Body text of the writings** | The entire archive. A literary site cannot be built, tuned or tested without literature. Titles alone cannot be published. |
| **Hindi poems** | Verification that the Devanagari face, measure and leading are right. Currently unproven. |
| **Professional email** | Contact page |
| **Book cover image** | Book page |
| Publisher / ISBN / price / publication date / formats | Book metadata — will ship as empty, clearly-marked CMS fields |
| Meta app ID, secret, long-lived token | Live Instagram sync |

**Ambiguity to resolve:** §29 and §51 give "writing since around age 10 / 2016". Stated
together these imply a birth year, which is personal information. The About page will say
only what Triyan confirms he wants public; I will not derive or publish an age.

---

## Recommended Execution Order

The new brief's §58 ordering **supersedes** `docs/ROADMAP.md`, and it is the better order.
My roadmap placed the 3D intro at Phase 4, before the data layer at Phase 8 — meaning the
homepage and archive would have been built against imagined API shapes and retrofitted
later. The new order puts the visual layer after core functionality is stable. Adopting it.

### P0 — blocking
1. Gitignore `tsconfig.tsbuildinfo`; remove the unused dependency.
2. **Test the zod schemas** before anything depends on them.
3. **Create a git remote and push.** Four phases of work currently live on one disk.
4. Database models + indexes (all 16).
5. Public content API with validation and caching.
6. Admin authentication, with the "every admin route 401s" test written first.
7. Writing CRUD end to end: login → create → draft → edit → preview → publish → public page → SEO → shareable URL. Nothing is DONE until that whole chain runs.

### P1 — required for production
8. Public pages: archive, reading page, book, about, contact.
9. Literary 404 and error boundaries.
10. Instagram mock provider, then the real provider.
11. Sync service: pagination, checkpoint, resume, dedup, retry, rate limits.
12. Classification service with confidence and manual-override protection.
13. Instagram archive and detail pages.
14. SEO: sitemap, robots, JSON-LD, OG images, canonicals.
15. CI pipeline running `npm run verify`.
16. Deployment: Vercel + Railway + Atlas, with real environment variables.

### P2 — important polish
17. ABYSS page and waitlist.
18. Cinematic intro, custom cursor, page transitions — now correctly last.
19. Analytics.
20. Accessibility pass with axe; performance pass against the measured budget.

### P3 — future
21. Semantic/LLM classifier behind the existing strategy interface.
22. OCR for poem images.
23. Atlas Search if the archive outgrows a Mongo text index.
24. ABYSS commerce.

---

## Known limitations that will not be engineered away

Recorded so they are never mistaken for bugs:

- **Reel audio transcripts are not available** through any official Instagram API. Reels
  will carry caption, poster frame and a deep link. This will not be faked.
- **Instagram CDN URLs expire.** `media_url` is a short-lived signed link, so media must be
  mirrored at sync time or the archive silently rots.
- **Stories** are 24-hour and out of scope for an archive.
- **Text inside poem images** needs OCR; accuracy on stylised type is unreliable, so it is
  deferred and will never be presented as Triyan's words without his confirmation.
- **Instagram sync requires a Professional account** and Meta App Review. Until then,
  development runs entirely on the mock provider.
