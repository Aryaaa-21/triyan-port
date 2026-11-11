# Instagram integration

## Status

| Part | Status |
|---|---|
| Provider abstraction (`server/src/services/instagram/provider.ts`) | Done |
| Official Graph provider (`graph.provider.ts`, graph.instagram.com) | Built and unit-tested against recorded response shapes. **Never run against the real API: no credentials have been supplied.** |
| Mock provider | Done. Captions are labelled `[mock]`; mock posts are never served when `NODE_ENV=production`. |
| Sync: full, incremental, pagination, checkpoint/resume, dedup, retry, rate limit, token errors, run lock | Done, tested against a real MongoDB |
| Deleted posts | Marked `available: false`, never destroyed |
| Classifier (rules, bilingual lexicon, language detection, confidence, `needsReview`) | Done. Strategy interface ready for an LLM/semantic classifier. |
| Manual correction (recorded, survives reclassify and caption edits) | Done |
| `/instagram`, `/instagram/:id`, homepage section, admin `/admin/instagram` | Done |
| Scheduled sync | Worker runs an incremental sync every `SYNC_CRON` (`*/N * * * *`) when `SYNC_ENABLED=true` |

## The screenshot archive

Until the official API is connected, `/instagram` is filled from the owner's own archive
of `@triyanwrites`: one screenshot per post, reel and carousel slide, taken from the
public profile and showing the card as Instagram shows it (name, image, counts).

| Part | Where |
|---|---|
| Images (full size and thumbnail, WebP) | `client/public/archive/instagram/<shortcode>-<slide>.webp` |
| Post data: date, caption, slides, category | `server/data/instagram-archive.json` |
| Import script | `npm run import:instagram-archive -w @triyan/server` |

How it behaves:

- Posts are stored with `provider: 'archive'`. They are public in production, like `graph`
  posts. A sync never touches them, and "Refresh" in the admin leaves them as they are.
- Each post was sorted into its category by reading the image, not just the caption
  (`method: 'LLM'`, `classifierVersion: 'claude-image-read-1'`). "Reclassify" skips archive
  posts. A correction made in the admin is kept when the import is run again.
- Captions are the owner's words only: the standing footer ("Original works…"), the keyword
  list and the hashtags are left out.
- A reel is archived as one still, so it is stored as an image with `productType: 'REELS'`.
- The import is safe to run again. It matches posts on their Instagram shortcode.
- `/instagram?sort=oldest` reads the archive from the first post forward.

Run the import once against each database (development, then production with the Atlas
`MONGODB_URI`), after the images have been deployed with the website.

When the Graph API is connected later, its posts will arrive under Instagram's numeric ids,
so the same post would appear twice. Hide the archive copies first (or delete
`provider: 'archive'` documents) before the first full sync.

## External blocker

Real syncing needs, from the account owner:

1. `@triyanwrites` switched to a **Professional** (Creator or Business) account.
2. A Meta app with the **Instagram API with Instagram Login** product and the
   `instagram_business_basic` permission (App Review if it will serve the public).
3. A **long-lived access token** for the account (valid 60 days, refreshable).

Then set in `server/.env`:

```
INSTAGRAM_PROVIDER=graph
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
INSTAGRAM_ACCESS_TOKEN=...
SYNC_ENABLED=true
```

and run `npm run sync:instagram -w @triyan/server -- FULL` once. No code changes are needed.

## Known limitations

- Media URLs from Instagram's CDN are signed and expire. They are stored as-is; when
  one expires, the tile falls back to the caption until the next sync refreshes it.
  Mirroring media to Cloudinary is not built yet.
- Long-lived tokens expire after 60 days. Expiry is detected and reported as
  `TOKEN_EXPIRED` in the admin, but automatic token refresh is not built.
- `@triyxnn` (personal account) is deliberately not synced.
