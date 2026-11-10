# Data models — what exists, and what deliberately does not

Six models exist. The original architecture listed sixteen. The difference is not an
omission: a model is created when a workflow needs it, not to make a count look
complete. Each deferred model below names the phase that will introduce it.

## Implemented

| Model | Why it exists |
|---|---|
| **Writing** | The canonical literary object. Everything else references it; it references nothing. |
| **User** | The single administrator. No public signup exists. `role` is present so adding an editor later needs no migration. |
| **RefreshToken** | One row per issued refresh token, enabling rotation with reuse detection. Without it, a stolen token is valid until it expires. |
| **Book** | Singleton for *Leaving and Living*. Every unconfirmed fact defaults to empty. |
| **About** | Singleton for the author page. Contains no field capable of holding an age or birth date. |
| **SiteSettings** | Cross-cutting values the owner must change without a deploy. Deliberately small. |

## Three decisions worth recording

**`Writing.content` is stored verbatim.** It is not trimmed, normalised or collapsed.
Line breaks, blank lines between stanzas, leading indentation and typographic
punctuation are the poem itself. Tests assert byte-for-byte round-tripping for English,
Devanagari, mixed Hinglish and smart punctuation.

**The text index sets `language_override: 'textSearchLanguage'`.** By default MongoDB
treats a field literally named `language` as a per-document text-search language. Our
`language` field holds `HINDI`, which MongoDB rejects as unsupported — and the failure
is on *write*, so **every insert into the collection fails**. The index also uses
`default_language: 'none'`, because the English stemmer would mangle Devanagari and the
archive is bilingual. This was found by a test, not in production.

**`publishedAt` is derived, never accepted from the client.** It is stamped the first
time a writing becomes `PUBLISHED` and preserved across later edits, so correcting a
typo in a published poem does not silently reorder the archive.

## Deferred, with the phase that introduces them

| Model | Phase | Why not now |
|---|---|---|
| `InstagramMedia` | 3 | Nothing can be synced before the provider exists. |
| `InstagramSyncState` | 3 | Cursor and health state for the sync job. |
| `Classification` | 3 | Immutable classification records. |
| `ClassificationCorrection` | 3 | Append-only audit of admin overrides. |
| `Media` | 3 | Provider-agnostic asset records; needed once Instagram media is mirrored. |
| `WaitlistSubscriber` | 4 | ABYSS waitlist. |
| `AnalyticsEvent` | 4 | First-party analytics. |
| `Category` / `Tag` as documents | later | The taxonomy is enum-backed in `@triyan/shared` and consumed by both sides. Documents would only add editable display labels, which nothing needs yet. |
| `BookReview` as its own collection | later | Reviews are embedded in `Book`. There are none, and a separate collection buys nothing until there are many. |

## Indexes

| Index | Serves |
|---|---|
| `{ slug: 1 }` unique | The public reading URL, and slug-collision detection |
| `{ status: 1, publishedAt: -1 }` | The archive's default query |
| `{ status: 1, featured: 1, publishedAt: -1 }` | The homepage featured rail |
| `{ status: 1, primaryCategory: 1, publishedAt: -1 }` | Category filtering |
| `{ themes: 1 }`, `{ emotions: 1 }`, `{ tags: 1 }` | Multikey filters |
| `{ bookExclusive: 1, status: 1 }` | Guards the invariant that book-exclusive writing is never served |
| `writing_text` | Bilingual full-text search |
| `User.email` unique | Login |
| `RefreshToken.tokenHash` unique, `expiresAt` TTL | Session lookup; expiry without a cron job |
