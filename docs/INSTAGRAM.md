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
