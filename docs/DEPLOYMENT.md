# Deployment

A MERN app, deployed as **one Vercel project** from the repository root, with
**MongoDB Atlas** as the database:

| Piece | On Vercel |
|---|---|
| React site (`client/`, built by Vite) | static files from `client/dist` |
| Express (`server/`) | one serverless function, `api/index.mjs`: the API (`/api/v1/*`), `/sitemap.xml`, `/robots.txt`, and every page address (it answers with the app, and a real 404 for pages that do not exist) |
| MongoDB | Atlas (any MongoDB reachable from the internet) |

All of this is configured in `vercel.json`, so nothing in the Vercel dashboard needs
changing except the environment variables.

---

## 1. Database: MongoDB Atlas

1. Create a cluster (the free M0 tier is fine to start).
2. **Database Access:** add a user with a strong password.
3. **Network Access:** allow `0.0.0.0/0`, because Vercel's functions have no fixed IP.
4. **Connect → Drivers:** copy the `mongodb+srv://…` string.

Indexes are created automatically on the first request.

## 2. Seed it (once, from your computer)

The `--` separates npm's arguments from the script's:

```bash
export MONGODB_URI='mongodb+srv://…'    # the Atlas string
export MONGODB_DB_NAME=triyan_prod
ADMIN_SEED_PASSWORD='…' npm run seed:admin -w @triyan/server -- --email you@example.com
npm run seed:content -w @triyan/server
npm run import:instagram-archive -w @triyan/server
```

The last command loads the @triyanwrites archive: the Instagram posts with their
screenshots, and the writings that fill the Writings shelves. It is safe to run again
after the archive data changes (see `INSTAGRAM.md`).

## 3. Vercel

1. **Add New → Project →** import the GitHub repository.
2. Keep **Root Directory** as the repository root. Vercel reads `vercel.json`:
   - install with `npm ci`;
   - build with `npm run build` (shared, server, then client);
   - serve `client/dist`;
   - run `api/index.mjs`.
3. **Environment Variables:**

   | Name | Value |
   |---|---|
   | `MONGODB_URI` | the Atlas `mongodb+srv://…` string |
   | `MONGODB_DB_NAME` | `triyan_prod` |
   | `INSTAGRAM_PROVIDER` | `mock` until the Meta credentials exist (see `INSTAGRAM.md`) |
   | `VITE_SITE_URL` | optional: the public address, once you have a custom domain |

   `NODE_ENV=production` is set by Vercel.
4. **Deploy.** Check `https://<project>.vercel.app/readyz`: it should return
   `{"status":"ready","database":"connected"}`.

Without `MONGODB_URI` the site is complete but read-only. It serves the Writings and
Instagram archives straight from `server/data/instagram-archive.json`, and the About,
Book and ABYSS pages from the owner's seeded words (`server/src/content/seed.ts`), all
of which are in the repository; pushing a change to them is enough to update the site.
`/readyz` then reports `"source":"archive-file"`. What needs a database is everything
that has to remember something: signing in to the admin, the contact inbox and the
waitlist. Add `MONGODB_URI` and the whole API switches to the database.

**From the command line instead of the dashboard:**

```bash
npx vercel login
npx vercel link                 # once
npx vercel env add MONGODB_URI  # and the others
npx vercel --prod
```

## Elsewhere: any Node host

The same code runs as one long-lived process (Railway, Render, a VPS):

```bash
npm ci && npm run build
NODE_ENV=production MONGODB_URI='…' MONGODB_DB_NAME=triyan_prod PORT=8080 npm start
```

Express serves `client/dist` and the API from one origin. In production it refuses to
start without `MONGODB_URI`.

## Email: telling subscribers about a new writing

Readers can leave their address in the footer ("New writings, by email"). The owner
decides, per writing, whether to email it: a tick-box before publishing, or a button on a
piece that is already live. Each writing can be sent once. Subscribers are listed at
`/admin/subscribers`.

Nothing is sent until an email provider is connected. Until then sign-ups are still
kept. To connect one, set these on the host (Vercel / Render) and redeploy:

| Variable | Value |
|---|---|
| `EMAIL_PROVIDER` | `resend` or `brevo` |
| `RESEND_API_KEY` *or* `BREVO_API_KEY` | the key from that provider |
| `EMAIL_FROM` | a sender that provider has verified, e.g. `Triyan Writes <hello@your-domain.com>` |
| `PUBLIC_SITE_URL` | the site's real address — the links inside the emails are built from it |

With a provider connected, a new subscriber first receives a confirmation link and is
only added after opening it. Every email carries an unsubscribe link.

On Vercel a function has a time limit, so very large lists (thousands) should move to a
long-running host such as Render, or to the provider's own broadcast tool (the list can
be exported as CSV from the admin).

## How it behaves in production

- **The site is a React app.**
  - Each page loads its data from the API before it shows, and moving between pages
    is instant.
  - Every page sets its own title, description, canonical link and social cards.
  - Writings, Book and About also carry structured data.
- **The admin lives at `/admin/login`.** The site and the API share an origin, so the
  session cookie is first-party (`SameSite=Lax`, `Secure`, `httpOnly`).
- **If the database is down,** pages still render and show their empty states;
  `/readyz` says why.
- **Rate limits** (global, login, contact) are kept in memory, per function instance.
- **Instagram images** in the archive are files in `client/public/archive/instagram`,
  deployed with the site. Posts from a later API sync would link to Instagram's CDN, and
  those links expire (see `INSTAGRAM.md`).

## Checklist

- [ ] Atlas cluster, user and network access
- [ ] Admin, content and the Instagram archive seeded
- [ ] Vercel project imported, with `MONGODB_URI` and `MONGODB_DB_NAME`
- [ ] `/readyz` reports `ready`
- [ ] Sign in at `/admin/login` and publish a first writing
