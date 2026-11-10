# TRIYAN — Master Architecture

**Status:** Phase 0 (architecture). No implementation decisions in this document are provisional unless marked `OPEN`.
**Last updated:** 2026-11-10

---

## 0. Decisions already taken (and why)

| # | Decision | Rationale |
|---|---|---|
| D1 | **Monorepo: `/client` Next.js 15 App Router + `/server` Express + TypeScript + Mongoose** | The spec mandates Express/Mongoose (§42) but also demands per-page metadata, OG tags, structured data and a sitemap that do not depend on client JS (§47). A client-rendered SPA cannot satisfy §47 for a growing archive. Next.js server-renders the public site by calling the Express API; Express remains the single owner of the database, Instagram sync, jobs and admin auth. |
| D2 | **Vercel (client) · Railway (server + worker) · MongoDB Atlas · Cloudinary (media)** | Railway runs long-lived processes, so Instagram sync is a *real* background worker rather than a chunked serverless cron. Every external provider sits behind an adapter interface (§73). |
| D3 | **Instagram API with Instagram Login only** (`graph.instagram.com`) | Instagram Basic Display API was shut down 2024-12-04. This is the only compliant route for a Professional account. No scraping, no browser automation, no unofficial endpoints (§56). |
| D4 | **Deterministic rules classifier v1, strategy-pattern pluggable** | §57/§58: the site must work with zero AI spend; semantic/LLM classifiers are added later behind the same interface without touching callers. |
| D5 | **Admin API is proxied through Next.js route handlers**, public reads go straight to Express | Vercel→Railway is cross-site, so an admin session cookie would need `SameSite=None`, weakening CSRF posture. Proxying `/api/admin/*` through the Next.js origin keeps the session cookie first-party `SameSite=Lax`, `httpOnly`, `Secure`. |
| D6 | **Instagram CDN URLs are mirrored to our own media store on sync** | `media_url` / `thumbnail_url` returned by the Graph API are signed, short-lived CDN links. Rendering them directly produces an archive that silently rots. We mirror to Cloudinary at sync time and always retain `permalink` as the durable source of truth. |
| D7 | **Writings are canonical; Instagram is a distribution channel** (§83) | One poem = one `Writing` document. `InstagramMedia` links to it. We never duplicate the text as a second literary record. |

---

## 1. Product architecture

### 1.1 What this product is
A permanent literary home for Triyan: an **archive-first** website where the writing is the product, discovery is by theme and emotion rather than by date, and Instagram is ingested as a *source feed* rather than displayed as a social embed.

### 1.2 Audiences
1. **Readers** arriving from Instagram — want to read more, in a calmer place than a feed.
2. **Readers arriving from search** — land directly on `/writings/[slug]`; that page must stand alone.
3. **Triyan (admin)** — must be able to publish a poem in under 60 seconds (§98).
4. **Future: ABYSS followers** — brand introduction and waitlist only (§35).

### 1.3 Value hierarchy (drives every layout decision)
`WRITING → LITERARY EXPERIENCE → IDENTITY → BOOK → INSTAGRAM → ABYSS → FUTURE`

Operationally this means: the reading route (`/writings/[slug]`) has the **strictest** performance and motion budget on the site, and the 3D intro has the **loosest** — because one is the product and the other is the doorway.

### 1.4 Content model in one sentence
A `Writing` is the canonical literary object; `InstagramMedia` and `Book` are *channels* that reference it; `Classification` is machine-derived metadata *about* either, always stamped with method, version and confidence.

### 1.5 Explicitly out of scope for V1
Cart, checkout, payments, inventory, orders (§35). Multi-author accounts. Comments on writings. Newsletter sending (we store waitlist only). Instagram publishing *to* Instagram.

---

## 2. Technical architecture

```
                     ┌──────────────────────────────────────────┐
  reader ───────────▶│  Vercel — Next.js 15 (App Router)        │
                     │  · RSC + ISR public pages                │
                     │  · generateMetadata / JSON-LD / sitemap  │
                     │  · /api/admin/* proxy (first-party cookie)│
                     │  · R3F intro (lazy, client-only chunk)   │
                     └───────────────┬──────────────────────────┘
                                     │ server-side fetch (ISR tags)
                                     ▼
                     ┌──────────────────────────────────────────┐
                     │  Railway — Express + TypeScript          │
                     │                                          │
                     │  api  ──▶ controllers ─▶ services ─▶ models
                     │  worker ─▶ jobs (node-cron)              │
                     │            · instagram:sync              │
                     │            · instagram:token-refresh     │
                     │            · classification:backfill     │
                     │            · sitemap:ping                │
                     └──┬────────────────┬──────────────────┬───┘
                        │                │                  │
                        ▼                ▼                  ▼
                 MongoDB Atlas     Cloudinary        graph.instagram.com
                 (Mongoose)        (media mirror)    (official API only)
```

### 2.1 Runtime split
Two Railway services from one image, different start commands:
- `api` — HTTP only. Never performs a sync inline (§43).
- `worker` — `node-cron` scheduler. No HTTP listener except `/healthz`.

Both share `/server/src` (services, models, integrations). Jobs are invoked through a `JobRunner` abstraction whose only implementation today is in-process; swapping to BullMQ/Redis later is a single file (§43).

### 2.2 Why not serverless for sync
A full historical import is hundreds-to-thousands of paginated API calls plus media mirroring. On Railway this is one resumable long-running job with a persisted cursor. The job is *still* written to be resumable and idempotent (§24) so the architecture survives a later move to serverless.

### 2.3 Caching strategy (§88)
| Layer | Mechanism | Invalidation |
|---|---|---|
| Next.js page/data | ISR + `revalidateTag` | Express fires a signed webhook to `/api/revalidate` after any admin mutation or completed sync |
| Express read responses | `Cache-Control: public, s-maxage` + in-process LRU for `SiteSettings`, `Book`, `About`, taxonomy | TTL + explicit bust on mutation |
| Media | Cloudinary CDN, immutable URLs keyed by content hash | never (new hash = new URL) |

Cache tags: `writings`, `writing:<slug>`, `instagram`, `instagram:<id>`, `taxonomy`, `book`, `about`, `abyss`, `settings`.

### 2.4 Degraded operation (§87)
- Instagram API down → sync job fails and records the reason; the website serves the last synchronized data. Visitors notice nothing.
- Express down → Next.js serves the last successful ISR render; `/writings` and `/writings/[slug]` stay readable. An error boundary shows a literary failure state, not a stack trace.
- WebGL unavailable → static/CSS fallback hero (§10). Never a blank screen.

---

## 3. Visual architecture

### 3.1 Two environments, not two palettes
**VOID** (night, default) is a black void with light emerging from it. **MANUSCRIPT** (day) is a printed page. These are *different physical worlds*, not inverted values (§7): VOID uses glow, vignette and absence of borders; MANUSCRIPT uses hairline rules, ink weight and paper grain. Shadows exist only in MANUSCRIPT; VOID uses luminance instead.

### 3.2 Tokens (`/client/src/styles/tokens.css`)
All values live here as CSS custom properties, consumed through Tailwind v4 `@theme`. No magic values in components (§77).

```
/* VOID */
--bg            #050505   --fg          #ededee
--bg-raised     #0b0b0c   --fg-muted    #8a8a8f
--surface       #121214   --fg-subtle   #5a5a60
--border        #1f1f22   --accent      #cfc7b8   /* bone */
--border-strong #2e2e33   --ember       #8a3a2e   /* rare, ABYSS-adjacent */

/* MANUSCRIPT */
--bg            #f4f0e8   --fg          #1a1917
--bg-raised     #fbf8f2   --fg-muted    #6b6760
--surface       #efe9de   --fg-subtle   #938d82
--border        #ddd5c6   --accent      #7a5c3e   /* sepia */
--border-strong #c6bca8   --ember       #8a3a2e
```
Radius `0 / 2px / 4px` only — editorial, not card-based. Spacing is a 4px-based scale with named editorial steps (`--space-gutter`, `--space-measure`, `--space-section`). Motion tokens: `--dur-instant 120ms`, `--dur-base 320ms`, `--dur-slow 720ms`, `--dur-cinematic 1800ms`, `--ease-void cubic-bezier(.16,1,.3,1)`.

Every token is validated for contrast ≥ 4.5:1 body / 3:1 large in both environments as part of the test suite.

### 3.3 Type system (§8)
| Role | Family | Notes |
|---|---|---|
| Display | **Cormorant Garamond** 300, large sizes, tight leading, wide tracking | Literary, manuscript-adjacent, legible. The "experimental" quality comes from scale, tracking and composition — not from an illegible face. |
| Reading (Latin) | **Spectral** 400 | Designed for on-screen long-form; generous x-height for poetry. |
| Reading (Devanagari) | **Tiro Devanagari Hindi** | Hindi poems get a face actually designed for Devanagari poetry; selected automatically from `Writing.language`. |
| UI | **Geist Sans** | Navigation, filters, metadata, admin. Deliberately not Inter. |
| ABYSS wordmark | **UnifrakturMaguntia**, wordmark only + **Archivo** condensed uppercase for ABYSS UI | Gothic/streetwear register, isolated to `/abyss` so it never contaminates the literary pages. |

All self-hosted via `next/font` with `display: swap` and subsetting; the Devanagari face loads only on pages containing Hindi.

### 3.4 Motion contract (§12)
| Zone | Budget |
|---|---|
| Intro, hero, page transitions, 3D, section entrances | High. GSAP + R3F. |
| Archive grid, filters, cursor | Medium. Transform/opacity only. |
| **Poem body, long text, book excerpts** | Near zero. One fade-in of the whole block, then nothing moves. No per-word staggering of poetry — ever. |

`prefers-reduced-motion: reduce` collapses every zone to opacity-only and freezes the 3D scene to a single static frame.

---

## 4. Information architecture

```
/                      Home — cinematic intro, identity, featured, archive invitation,
                              book, instagram, abyss, about, contact
/writings              Archive — search, category/language/emotion/theme filters
/writings/[slug]       Reading page (canonical literary URL)
/book                  Leaving and Living
/about                 Literary about
/instagram             Editorial Instagram archive
/instagram/[shortcode] Instagram item detail
/abyss                 ABYSS brand introduction + waitlist
/contact               Contact
/admin                 Dashboard
/admin/writings        · /new · /[id]
/admin/instagram       · /[id] · /sync
/admin/taxonomy        categories, tags, themes, emotions
/admin/book            · /reviews
/admin/about  /admin/abyss  /admin/waitlist  /admin/media  /admin/seo  /admin/settings
/sitemap.xml  /robots.txt  /rss.xml  /opengraph-image
```

Primary nav exposes **five** items only (§13): `Writings · Book · Instagram · ABYSS · About`. Contact lives in the footer. Theme toggle and search are icon affordances, not nav items.

### 4.1 Indexation policy (§84)
| Route | Policy |
|---|---|
| `/writings/[slug]` | index, follow. Full `CreativeWork` JSON-LD. In sitemap. |
| `/instagram/[shortcode]` **linked** to a writing | `noindex, follow` + `<link rel=canonical>` → the writing. |
| `/instagram/[shortcode]` **unlinked**, caption ≥ 200 chars, `indexable=true` | index, follow. In sitemap. |
| all other Instagram detail | `noindex, follow`. Not in sitemap. |

This prevents thousands of thin pages from diluting the archive while still letting substantial caption-only pieces rank.

---

## 5. Database — ER plan

### 5.1 Entities and relationships
```
User 1───* RefreshToken
User 1───* ClassificationCorrection (correctedBy)

Writing *───* Category   (primaryCategory: 1, secondaryCategories: *)
Writing *───* Tag
Writing *───* Theme      (enum-backed, denormalized array)
Writing *───* Emotion    (enum-backed, denormalized array)
Writing 1───1 Classification (latest, embedded snapshot + history ref)
Writing 1───* InstagramMedia        (a poem may be posted more than once)
Writing *───1 Book          (bookExclusive / includedInBook)
Writing 1───1 Media         (coverImage)

InstagramMedia 1───0..1 Writing     (linkedWriting, nullable)
InstagramMedia 1───1 Classification (embedded snapshot)
InstagramMedia 1───* Media          (mirrored assets, incl. carousel children)

InstagramSyncState  — singleton per account (cursor, checkpoints, health)
Classification      — immutable record; latest snapshot embedded on the subject
ClassificationCorrection — append-only audit of admin overrides (§21, §39)

Book 1───* BookReview
Book 1───* Writing (selected excerpts)

About        — singleton
Abyss        — singleton (+ future products[])
SiteSettings — singleton
WaitlistSubscriber — standalone, unique email
Media        — standalone, provider-agnostic
AnalyticsEvent     — append-only, no PII
```

### 5.2 Key schema notes
- **Enum discipline.** Categories, themes, emotions and languages are TypeScript const enums in `/shared/taxonomy.ts`, consumed by both client and server. `Category` also exists as a *document* so it can carry display name, literary blurb, slug and order — but its `key` is constrained to the enum.
- **`Classification` snapshot shape** (embedded on `Writing` and `InstagramMedia` for query speed, with the full immutable record in its own collection):
  `{ primaryCategory, secondaryCategories[], themes[], emotions[], language, contentType, confidence, method, modelVersion, lexiconVersion, classifiedAt, needsReview, manualOverride, overriddenAt, overriddenBy }`
- **`manualOverride: true` is sacred.** Reclassification jobs skip any subject with `manualOverride` unless explicitly forced with a confirmed admin flag (§61).
- **Soft availability, never deletion** (§25): `InstagramMedia.sourceAvailable: boolean` + `sourceUnavailableSince`. Records are retained.
- **Dedup fields on both `Writing` and `InstagramMedia`:** `normalizedText`, `contentHash` (sha256), `simhash` (64-bit as BigInt string).

### 5.3 Indexes (§41)
```
Writing: {slug:1} unique · {published:1, publishedAt:-1} · {primaryCategory:1, publishedAt:-1}
         {themes:1} · {emotions:1} · {tags:1} · {language:1} · {featured:1, publishedAt:-1}
         {contentHash:1} · text index on {title, excerpt, content} with weights 10/5/1
InstagramMedia: {instagramId:1} unique · {shortcode:1} unique sparse · {timestamp:-1}
         {primaryCategory:1, timestamp:-1} · {mediaType:1} · {mediaProductType:1}
         {linkedWriting:1} · {sourceAvailable:1, timestamp:-1} · {contentHash:1}
         text index on {caption}
WaitlistSubscriber: {email:1} unique (lowercased, normalized)
Classification: {subjectType:1, subjectId:1, classifiedAt:-1}
ClassificationCorrection: {fromCategory:1, toCategory:1, createdAt:-1}
AnalyticsEvent: {type:1, createdAt:-1} · {createdAt:1} TTL 400d
RefreshToken: {tokenHash:1} unique · {expiresAt:1} TTL
```
**Search:** MongoDB text index for V1 — it is in-database, free, and handles the expected archive size (hundreds to low thousands of documents) well within budget. Devanagari is tokenized adequately by the `none` language setting, so Hindi documents are indexed with `language_override` disabled and matched by exact token. `OPEN`: if the archive exceeds ~10k documents or fuzzy/typo tolerance becomes a requirement, migrate to Atlas Search — the `SearchProvider` interface exists from day one so this is a one-adapter change.

---

## 6. API architecture

REST, versioned under `/api/v1`. All responses `{ data, meta? }`; all errors `{ error: { code, message, details? } }` with a stable machine code.

### 6.1 Public (cacheable, unauthenticated)
```
GET  /api/v1/writings            ?q &category &categories &themes &emotions &language
                                 &featured &from &to &sort &page &limit
GET  /api/v1/writings/:slug
GET  /api/v1/writings/:slug/related          semantic-adjacency, not random (§65)
GET  /api/v1/instagram           ?q &category &language &mediaType &from &to &cursor &limit
GET  /api/v1/instagram/:idOrShortcode
GET  /api/v1/taxonomy                        categories+counts, themes, emotions, tags
GET  /api/v1/book
GET  /api/v1/about
GET  /api/v1/abyss
GET  /api/v1/settings
POST /api/v1/waitlist                        rate-limited, honeypot + duplicate-safe
POST /api/v1/contact                         rate-limited
POST /api/v1/analytics/event                 batched, no PII
GET  /api/v1/sitemap-index                   slugs + lastmod for Next.js sitemap
```

### 6.2 Admin (session required, proxied through Next.js origin)
```
POST   /api/v1/auth/login            /logout   /refresh   /me
POST   /api/v1/auth/change-password

GET    /api/v1/admin/dashboard
CRUD   /api/v1/admin/writings[/:id]            + POST /:id/publish /unpublish
POST   /api/v1/admin/writings/classify-preview  ← live suggestions in the editor (§98)
POST   /api/v1/admin/writings/:id/link-instagram

GET    /api/v1/admin/instagram[/:id]
PATCH  /api/v1/admin/instagram/:id             feature/hide/link/presentation metadata (§26)
PATCH  /api/v1/admin/instagram/:id/classification   ← records a ClassificationCorrection
POST   /api/v1/admin/instagram/sync            202 Accepted, enqueues; never blocks (§43)
GET    /api/v1/admin/instagram/sync-status
POST   /api/v1/admin/instagram/reclassify      requires {confirm:true, scope} (§61)
GET    /api/v1/admin/instagram/duplicates      candidate links awaiting confirmation

CRUD   /api/v1/admin/taxonomy/categories  /tags
CRUD   /api/v1/admin/book  /book/reviews
PATCH  /api/v1/admin/about  /abyss  /settings  /seo
GET    /api/v1/admin/waitlist      + /export.csv
CRUD   /api/v1/admin/media
GET    /api/v1/admin/jobs                      job history, failures, next run
GET    /api/v1/admin/classification/corrections + /suggestions  (§21 learning surface)
```

### 6.3 Cross-cutting middleware order
`helmet → cors(allowlist) → requestId → pino-http → rateLimit → bodyParser(limits) → mongoSanitize → zod validate → auth → authorize → handler → errorHandler`

Validation is **zod**, with schemas shared with the client for form parity.

---

## 7. Instagram integration architecture

### 7.1 Compliance statement
Official API only (§56). `graph.instagram.com`, Instagram API with Instagram Login. Scope: `instagram_business_basic`. No scraping, no HTML parsing, no unofficial endpoints, no browser automation, no credential handling.

### 7.2 Capability matrix — what the official API actually gives us
| Requirement | Status | Detail |
|---|---|---|
| All image / carousel / video / Reel **feed** media, full history | ✅ | `GET /me/media` is cursor-paginated over the full media list. |
| Caption, timestamp, permalink, media type, username | ✅ | |
| Carousel children | ✅ | `children{id,media_type,media_url,thumbnail_url}` |
| Reels identified as such | ✅ | `media_product_type: REELS` |
| Media binaries | ⚠️ | `media_url`/`thumbnail_url` are **short-lived signed CDN URLs**. We mirror them at sync time (D6). |
| Like / comment counts | ⚠️ | Available on media for Professional accounts; treated as optional and never shown as a credential (§5). Not persisted if absent. |
| **Stories** | ⚠️ | Separate endpoint, 24-hour lifetime. Out of scope for an archive. |
| **Reel audio transcript** | ❌ | Not offered by the API. We will not fake it (§22). Reels carry caption + poster frame + deep link. |
| **Text inside a poem screenshot** | ❌ via API | Requires OCR on the mirrored image. See §7.6. |
| Account insights / followers | ❌ used | Deliberately not fetched or displayed (§5). |

Every ⚠️/❌ above is surfaced in `/admin/instagram/sync` as a plain-language limitation note, so the limitation is visible rather than mysterious.

### 7.3 Provider interface
```ts
interface InstagramProvider {
  fetchMediaPage(opts: { after?: string; limit: number }): Promise<InstagramPage>
  fetchMedia(id: string): Promise<InstagramMediaDTO | null>
  refreshLongLivedToken(): Promise<{ accessToken: string; expiresAt: Date }>
}
```
Two implementations: `GraphInstagramProvider` (production) and `MockInstagramProvider` (dev + CI), the latter scripted to reproduce pagination, new posts, duplicates, updated captions, 429s, 5xx, token expiry, missing media and deleted media (§55). **No test or local dev run touches the real API.**

### 7.4 Sync algorithm (§24, §25)
```
acquire advisory lock (single-flight, Mongo findOneAndUpdate on InstagramSyncState)
load syncState → { mode: FULL|INCREMENTAL, cursor, lastSyncedAt, newestSeenTimestamp }
loop:
  page = provider.fetchMediaPage({ after: cursor })
  for media in page.items:
      upsert by instagramId  (unique index = structural guarantee of no duplicates)
      if new or caption/media changed:
          mirror assets → MediaProvider (content-hash keyed, skip if hash unchanged)
          normalize text → classify → dedup-check → auto-link writing if score ≥ 0.95
      else: skip (counted)
  persist cursor after EVERY page  ← resumability
  if INCREMENTAL and page.oldestTimestamp < lastSyncedAt and no changes in page: break
  if !page.next: break
  if rateLimited: persist checkpoint, schedule resume with backoff, exit cleanly
reconcile removals: ids present in DB, absent from a completed FULL pass
                    → sourceAvailable=false (never delete) (§25)
write run report → JobRun { status, imported, updated, skipped, failed, reason, durationMs }
emit revalidateTag('instagram')
```
Idempotency: `instagramId` unique index + content-hash guards on media mirroring. Re-running a sync is always safe.

### 7.5 Schedule & resilience (§44, §45)
- `instagram:sync` INCREMENTAL every 30 min (configurable in `SiteSettings`).
- `instagram:token-refresh` daily; long-lived tokens last ~60 days and are refreshed well before expiry; failure raises a loud admin health state.
- Backoff: exponential with jitter, `Retry-After` honoured, `X-App-Usage` / `x-business-use-case-usage` headers parsed and the job self-throttles before hitting a limit. Global token-bucket throttle in front of the provider.
- Health model exposed to admin: `HEALTHY | RUNNING | DEGRADED | FAILED | TOKEN_EXPIRED` with `lastSuccessfulSync`, `nextScheduledSync`, last run counters and failure reason.

### 7.6 OCR — scoped honestly
Triyan's posts are frequently **typeset text images**, where the caption may not contain the poem. Plan:
- V1: classification uses caption + hashtags + any admin-supplied text. If a post has an image and a caption shorter than 40 characters, it is flagged `textExtractionPending`.
- V1.1: an optional `OcrProvider` (tesseract.js in the worker, English + Hindi traineddata) runs only on flagged posts, writes to `extractedText`, and re-classifies. OCR output is stored separately from `caption` and never presented as Triyan's words without admin confirmation — it is classification input, not published content.
This is explicitly *not* presented as a solved problem; accuracy on stylized type is mixed.

### 7.7 Writing ↔ Instagram linkage (§30, §31, §82)
Pipeline: `normalize → contentHash exact match → simhash Hamming ≤ 8 → Jaccard on 5-gram shingles`.
- ≥ 0.95 → auto-link, `linkConfidence` stored.
- 0.82–0.95 → candidate queued in `/admin/instagram/duplicates` for one-click confirm/reject.
- < 0.82 → no link.
`bookExclusive` writings are excluded from auto-linking and can never be auto-published through sync (§33) — enforced in the service layer *and* as a schema-level guard, with a dedicated regression test.

---

## 8. Auto-categorization architecture

### 8.1 Module boundary (§19)
`/server/src/services/classification/` — pure, dependency-free of Express and React. Entry point:
```ts
classify(input: ClassificationInput, opts?): Promise<ClassificationResult>
```
`ClassificationInput = { title?, text, hashtags[], sourceHints? }`. Deterministic: same input + same lexicon version = same output. This makes it unit-testable without a database.

### 8.2 Pipeline
```
raw text
 → normalize   NFKC, lowercase, strip emoji/zero-width, unify quotes/dashes,
               split hashtags (camelCase + lexicon), keep Devanagari intact
 → language    Devanagari ratio + Latin stopword profile + romanized-Hindi lexicon
               → ENGLISH | HINDI | HINGLISH | UNKNOWN
 → tokenize    light stemming for English (no heavy NLP dep); Devanagari matras normalized
 → score       weighted lexicon match → per-category score vector
               + theme vector + emotion vector
 → adjust      negation windows, intensifiers, hashtag weight 0.6, title weight 1.5,
               category co-occurrence priors
 → decide      primary = argmax; secondaries = within 70% of primary, max 2
 → confidence  margin(top, runner-up) × coverage(matched tokens / content tokens)
               × lengthReliability
 → verdict     confidence < 0.55 → needsReview = true
```

### 8.3 Lexicons
Versioned TypeScript data modules per category, each entry `{ term, weight, lang, variants[] }`, covering English, Devanagari Hindi and romanized Hinglish (e.g. `judaai`, `tanhaai`, `yaad`, `बिछड़ना`, `तन्हाई`). `lexiconVersion` is stamped on every `Classification` so any record can be traced to the rules that produced it (§59). Matching is multi-signal — weighted terms, variants, co-occurrence — not exact keyword equality (§57).

### 8.4 Strategy pattern (§58)
```ts
interface ClassifierStrategy { readonly id: string; readonly version: string
  classify(input: NormalizedInput): Promise<StrategyOutput> }
```
Registered: `RulesClassifier` (v1, default). Planned, no code changes required at call sites: `EmbeddingClassifier` (centroid similarity per category), `LlmClassifier` (structured output). An `EnsembleClassifier` can combine them with recorded per-strategy contributions. **The site never requires a paid API to function.**

### 8.5 Safety & learning (§21)
- Every result stores `confidence`, `method`, `modelVersion`, `lexiconVersion`, `classifiedAt`.
- `confidence < 0.55` → `needsReview = true`, shown in an admin review queue.
- Admin override → immutable `ClassificationCorrection { subject, fromCategory, toCategory, fromThemes, toThemes, correctedBy, createdAt }` and `manualOverride = true` on the subject.
- A nightly analysis aggregates corrections into **suggestions** (`"mortality → existentialism, 14 times, suggest lowering weight of 'nothingness' in MORTALITY_NOTHINGNESS"`), surfaced in admin. **Nothing is applied automatically** (§21) — a human bumps the lexicon version.
- Reclassification requires explicit confirmation and never overwrites `manualOverride` records (§61).

### 8.6 Worked example (§18/§60 — verifying the design, not seeded content)
`"Some people leave long before they say goodbye."`
→ lexicon hits: `leave` (ABSENCE_LOSS .8), `goodbye` (ABSENCE_LOSS .7, LOVE_LONGING .4), `long` (temporal, discounted)
→ primary `ABSENCE_LOSS`, secondary `LOVE_LONGING`, themes `[separation, loss]`, emotions `[longing, melancholy]`, language `ENGLISH`, confidence ≈ 0.88, `needsReview: false`.
Frontend renders only the human label: **Absence & Loss**.

---

## 9. Admin architecture

### 9.1 Auth (§46)
Single admin user, seeded by a CLI script (never a public signup route). argon2id password hashing. Access token (JWT, 15 min) + rotating refresh token (hashed in Mongo, 30 d, reuse-detection revokes the family). Cookies `httpOnly, Secure, SameSite=Lax`, first-party via the Next.js proxy (D5). Login rate-limited and slowed per-IP and per-account. CSRF double-submit token on all mutating admin requests. Admin routes are `noindex` and excluded from the sitemap. TOTP 2FA is a planned additive field on `User`.

### 9.2 Writing editor — the 60-second publish path (§98)
Paste poem → debounced `classify-preview` returns detected language, suggested primary/secondary categories, themes, emotions with confidence → chips are **pre-filled and editable**, never a blank form → slug auto-generated from title with collision handling → SEO title/description auto-derived (editable, with length meters) → excerpt auto-cut at a line boundary → Publish. Autosave to draft every 3 s. Keyboard-first: `⌘S` save, `⌘⏎` publish. A side-by-side "reader preview" renders the exact reading-page typography.

### 9.3 Instagram admin — no approval workflow (§26)
Synced posts are **live by default**. The admin screens are for *correction and curation*, not gatekeeping: feature, hide, recategorize (recorded as a correction), link to a writing, edit presentation metadata, mark important. The sync panel shows health, counters, cursor position, next run, last failure and the documented API limitations from §7.2.

### 9.4 Admin UI posture (§71)
Functional, fast, legible. Shares the design tokens but none of the experimental motion: dense data tables, sticky filters, server-side pagination, inline status badges, optimistic updates with rollback, no custom cursor, no 3D.

---

## 10. Folder structure (§53)

```
triyan/
├─ package.json                 npm workspaces, root scripts
├─ shared/                      compiled to both sides; the single source of taxonomy truth
│  ├─ taxonomy.ts               categories, themes, emotions, languages, content types
│  ├─ schemas/                  zod schemas shared by API validation and client forms
│  └─ types/
├─ client/                      Next.js 15 · App Router · TS · Tailwind v4
│  └─ src/
│     ├─ app/
│     │  ├─ (site)/             layout with nav/footer/cursor/theme
│     │  │  ├─ page.tsx  writings/  book/  about/  instagram/  abyss/  contact/
│     │  ├─ admin/              separate layout, no 3D, no cursor
│     │  ├─ api/
│     │  │  ├─ admin/[...path]/route.ts    first-party admin proxy (D5)
│     │  │  └─ revalidate/route.ts         signed ISR invalidation hook
│     │  ├─ sitemap.ts  robots.ts  rss.xml/route.ts  opengraph-image.tsx
│     ├─ components/            ui/ · editorial/ · reading/ · archive/ · admin/
│     ├─ features/              writings/ · instagram/ · book/ · abyss/ · search/
│     ├─ three/                 scenes/ · materials/ · shaders/ · hooks/ · fallbacks/
│     ├─ hooks/  lib/  services/  styles/  types/
├─ server/                      Express · TS · Mongoose
│  └─ src/
│     ├─ app.ts  api.ts  worker.ts
│     ├─ config/                env (zod-validated), db, logger, constants
│     ├─ controllers/  routes/  services/  models/  validators/  middleware/  utils/  types/
│     ├─ integrations/
│     │  ├─ instagram/          provider.ts · graph.provider.ts · mock.provider.ts · mapper.ts
│     │  ├─ media/              provider.ts · cloudinary.provider.ts · local.provider.ts
│     │  └─ ocr/                provider.ts · tesseract.provider.ts
│     ├─ services/classification/   index.ts · normalize.ts · language.ts · score.ts
│     │                             confidence.ts · strategies/ · lexicons/
│     ├─ services/dedup/        hash.ts · simhash.ts · similarity.ts
│     ├─ jobs/                  runner.ts · scheduler.ts · instagram.sync.ts
│     │                         instagram.token.ts · classification.backfill.ts
│     └─ scripts/               seed-admin.ts · seed-taxonomy.ts · reclassify.ts
└─ docs/                        ARCHITECTURE.md · ROADMAP.md · SETUP.md · INSTAGRAM.md
                                DEPLOYMENT.md · ENVIRONMENT.md · TROUBLESHOOTING.md
```

---

## 11. Deployment architecture

| Concern | Choice |
|---|---|
| Frontend | Vercel, `client/` root, Node 22 runtime, ISR enabled |
| API | Railway service `api`, `npm -w server run start:api` |
| Worker | Railway service `worker`, `npm -w server run start:worker`, same build |
| Database | MongoDB Atlas M0 → M10, IP allowlist + SRV, separate `triyan_dev` / `triyan_prod` |
| Media | Cloudinary free tier behind `MediaProvider`; local disk provider for dev |
| Secrets | Vercel + Railway project variables. Nothing in the repo. `.env.example` only. |
| Domain | Fully environment-driven; no hostname is hardcoded anywhere (§75) |
| TLS | Platform-managed on both |
| Observability | pino JSON logs → Railway; `/healthz` + `/readyz`; Sentry hook point reserved |

Environment variables are validated by a zod schema at boot — the server refuses to start with a missing or malformed secret rather than failing mysteriously later.

---

## 12. Quality gates

**Performance budget (§85)** — enforced in CI, build fails on regression:
| Metric | Budget |
|---|---|
| First-load JS, `/writings/[slug]` | ≤ 120 KB gzip |
| First-load JS, `/` excluding 3D | ≤ 180 KB gzip |
| 3D chunk (lazy, never blocks LCP) | ≤ 220 KB gzip |
| LCP (mobile, throttled) | < 2.0 s |
| CLS | < 0.05 |
| INP | < 150 ms |
| Mobile particle count | ≤ 1/3 of desktop; instanced |

**Testing (§54, §55)** — vitest + mongodb-memory-server + supertest on the server; vitest + RTL for components; Playwright for the critical flows (read a poem, search, filter, admin login, create+publish a writing, waitlist). Mandatory specific suites: auth, writing CRUD, search, filtering, sync pagination/resume/idempotency, duplicate prevention, classification determinism, correction recording, `bookExclusive` leak prevention, waitlist dedup + rate limit, admin authorization (every admin route asserted to 401 unauthenticated).

**Gates per phase:** `typecheck` clean, `lint` clean, tests green, production build succeeds, axe scan clean on changed routes, Lighthouse mobile within budget. A phase is not done until all six pass.

---

## 13. Where I am deliberately diverging from the spec

| Spec | Divergence | Why |
|---|---|---|
| §42 Express frontend-agnostic | Next.js added in front | §47 SEO is unachievable otherwise (D1) |
| §41 text search | Mongo text index now, `SearchProvider` interface for Atlas Search later | Free, adequate at this scale, zero lock-in |
| §22 "all posts visible" | True for all **feed** media; Stories excluded, Reel transcripts impossible | API reality, documented rather than faked (§56) |
| §18 OCR | Deferred to V1.1 behind a provider, flagged `textExtractionPending` in V1 | Accuracy on stylized type is unreliable; shipping it as "done" would be dishonest |
| §52 analytics | First-party `AnalyticsEvent`, no third-party script, no cookies | Privacy + performance budget |
