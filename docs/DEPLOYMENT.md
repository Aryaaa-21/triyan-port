# Deployment

Three pieces, as planned in `ARCHITECTURE.md` (D2):

| Piece | Host | Folder |
|---|---|---|
| Website (Next.js 16) | **Vercel** | `client/` |
| API (Express 5) | **Railway** (or any Node 22 host) | `server/` |
| Database | **MongoDB Atlas** | — |

The website builds and runs on its own, showing its designed empty states. Writings, the
About portrait, Instagram, the contact form and the waitlist need the API.

Recommended order: database → API → website. Each step needs a value from the one
before it.

---

## 1. Database: MongoDB Atlas

1. Create a cluster (the free M0 tier is fine to start).
2. **Database Access:** add a user with a strong password.
3. **Network Access:** allow `0.0.0.0/0`, because Railway's outbound IPs change. Or use
   Railway's static IP add-on and allow only that.
4. **Connect → Drivers:** copy the `mongodb+srv://…` string. Use the database name
   `triyan_prod`.

Indexes are created automatically when the API starts, so there's no manual step.

## 2. API: Railway

1. **New Project → Deploy from GitHub repo →** this repository.
2. Service **Settings**:
   - Root directory: *leave empty* (the repository root, since the API needs `shared/`).
   - Build command: `npm ci && npm run build:shared && npm run build -w @triyan/server`
   - Start command: `npm run start:api -w @triyan/server`
   - Health check path: `/readyz`
3. **Variables:**

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | the Atlas `mongodb+srv://…` string |
   | `MONGODB_DB_NAME` | `triyan_prod` |
   | `PUBLIC_SITE_URL` | the website's URL, e.g. `https://triyan.vercel.app` |
   | `CORS_ORIGINS` | the same URL (comma-separate several) |
   | `INSTAGRAM_PROVIDER` | `mock` until the Meta credentials exist (see `INSTAGRAM.md`) |
   | `LOG_LEVEL` | `info` |
   | `MONGOMS_DISABLE_POSTINSTALL` | `1`: skips a test-only MongoDB download during install |

   Railway sets `PORT` itself.
4. **Networking → Generate domain.** This URL is the website's `API_BASE_URL`.
5. Check: `https://<api-domain>/readyz` returns `{"status":"ready","database":"connected"}`.

Optional, once Instagram is connected: add a second service from the same repository
with the same build, start command `npm run start:worker -w @triyan/server` and
`SYNC_ENABLED=true`. Until then, the admin's "Sync now" button does the same job.

## 3. Seed the database (once, from your computer)

The `--` separates npm's arguments from the script's:

```bash
cd ~/triyan
export MONGODB_URI='mongodb+srv://…'   # the Atlas string
export MONGODB_DB_NAME=triyan_prod

# the admin account (choose a strong password)
ADMIN_SEED_PASSWORD='…' npm run seed:admin -w @triyan/server -- --email you@example.com

# About, Book, ABYSS and site settings, from the owner's confirmed answers
npm run seed:content -w @triyan/server
```

## 4. Website: Vercel

1. **Add New → Project →** import this repository from GitHub.
2. **Root Directory: `client`** (click *Edit* and choose it). The framework is detected
   as Next.js.
3. Leave the build and install commands alone. `client/vercel.json` sets them:
   - it installs only the website's packages, not the API's;
   - it builds `shared/` and then the website.

   Node.js 22 comes from `client/package.json`.
4. **Environment Variables:**

   | Name | Value | Needed |
   |---|---|---|
   | `API_BASE_URL` | the Railway API URL, no trailing slash | yes, for content |
   | `NEXT_PUBLIC_SITE_URL` | the site's public URL | once you have a custom domain; until then the Vercel production URL is used |
   | `NEXT_PUBLIC_SITE_NAME` | `Triyan` | no (default) |

5. **Deploy.** Then put the final website URL into Railway's `PUBLIC_SITE_URL` and
   `CORS_ORIGINS`.

**Custom domain:**
1. Vercel → *Settings → Domains*.
2. Update `NEXT_PUBLIC_SITE_URL` (Vercel) and `PUBLIC_SITE_URL` / `CORS_ORIGINS`
   (Railway).
3. Redeploy both.

## How it behaves in production

- **Pages are pre-rendered and refresh on a timer:** the homepage every 2 minutes; About,
  Book, ABYSS and Contact every 5; the sitemap every 10. New or edited writing appears
  within minutes.
  - An on-demand refresh hook (`REVALIDATE_URL` / `REVALIDATE_SECRET`) is reserved in the
    configuration but **not implemented**.
- **The admin lives at `/admin/login`.** Admin calls go through the website itself
  (`/api/admin/*`), so the session cookie stays first-party (`SameSite=Lax`, `Secure`).
- **If the API is down,** the website still serves. Content sections show their empty
  states instead of failing.
- **Rate limits** (login, contact) are kept in memory, per API instance.
- **Images:** the front-page image, the portrait and the category artwork are in
  `client/public` and are optimised by Vercel. Instagram media links come from
  Instagram's CDN and expire (see `FINAL_AUDIT.md`).

## Checklist

- [ ] Atlas cluster, user and network access
- [ ] Railway API deployed; `/readyz` reports `ready`
- [ ] Admin and content seeded
- [ ] Vercel project with Root Directory `client` and `API_BASE_URL` set
- [ ] Railway `PUBLIC_SITE_URL` / `CORS_ORIGINS` set to the website URL
- [ ] Sign in at `/admin/login` and publish a first writing
