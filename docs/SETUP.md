# Local setup

## 0. Where the code lives (WSL)

The project is in the Windows Desktop folder, so it can be seen and opened from
Explorer:

- Windows: `C:\Users\Arya Bhagat\Desktop\triyan\triyan-port`
- Ubuntu (WSL): `/mnt/c/Users/Arya Bhagat/Desktop/triyan/triyan-port`

**Run every `npm` command from an Ubuntu (WSL) terminal**, never from PowerShell:
the installed packages include Linux builds of native tools (Tailwind, Vite, argon2),
which Windows Node cannot load. Files on the Windows drive are slower for Node than
the WSL filesystem, so installs and builds take longer here; the dev server watches
for edits by polling, so changes made from Windows editors are picked up.

Open it in VS Code with `code .` from that folder in Ubuntu.

### The node/npm shadowing trap

On this machine `node` resolves to the **Windows** binary while `npm` is the **WSL**
script:

```
$ which -a node
/home/<you>/.local/bin/node   ->  /mnt/c/nodejs/node.exe   # Windows node 24
/home/<you>/.nvm/versions/node/v22.23.1/bin/node           # WSL node 22
```

Every `npm` command then dies with `Cannot find module 'C:\home\...'` — the Windows
interpreter trying to resolve a Linux path. Fix it permanently by putting nvm ahead of
`~/.local/bin` in your shell profile:

```bash
# ~/.bashrc  (after any nvm block)
export PATH="$HOME/.nvm/versions/node/v22.23.1/bin:$PATH"
```

Verify — both must agree:

```bash
node -v   # v22.23.1
npm -v    # 10.9.8
```

## 1. Install

```bash
npm install          # installs all three workspaces
npm run build:shared # @triyan/shared must be compiled before the others typecheck
```

## 2. Configure

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local   # optional
```

| Variable | Where it comes from |
|---|---|
| `MONGODB_URI` | Locally, `npm run dev:db` prints it (`mongodb://127.0.0.1:27017`). In production, MongoDB Atlas → Connect → Drivers. |
| `INSTAGRAM_*` | Leave `INSTAGRAM_PROVIDER=mock` until the Meta credentials exist. See `docs/INSTAGRAM.md`. |
| `VITE_SITE_URL` (client, optional) | The public address, for canonical links. Defaults to wherever the site is served. |

The server validates its environment at boot and **refuses to start** on a missing or
malformed value, printing exactly which variable is wrong.

## 3. Run

```bash
npm run dev:db       # local MongoDB (in memory) on :27017 — own terminal; data is lost on exit
npm run dev          # shared (watch) + API :4000 + site :3000 (Vite, proxying /api to :4000)
```

Open <http://localhost:3000>. The first time, seed an admin and the confirmed content:

```bash
ADMIN_SEED_PASSWORD='…' npm run seed:admin -w @triyan/server -- --email you@example.com
npm run seed:content -w @triyan/server
```

Production-style (one Express process serves the built site and the API):

```bash
npm run build && npm start   # http://localhost:4000
```

Health checks: <http://localhost:4000/healthz> · <http://localhost:4000/readyz>

## 4. Verify before committing

```bash
npm run verify       # lint -> typecheck -> test -> production build
```

This is the same gate every phase must pass (ARCHITECTURE §12).

## 5. Troubleshooting

| Symptom | Cause |
|---|---|
| `Cannot find module 'C:\home\...'` | Windows/WSL node mismatch — see §0. |
| `Cannot find module '@triyan/shared'` | Run `npm run build:shared`. The shared package is consumed as compiled output, not source. |
| Lint reports `a type that cannot be resolved` across the server | Same cause: `shared/dist` is missing. `npm run verify` builds it first; a bare `npm run lint` does not. |
| `Invalid environment configuration` | The server is telling you precisely which variable is missing. |
| `MongoDB connection failed` | Atlas IP allowlist, or a password containing characters that need URL-encoding. |
| `readyz` returns 503 | The process is up but MongoDB is not connected. Expected before `MONGODB_URI` is set. |
| A phone-width screenshot shows text overflowing | Headless Chrome enforces a window width of roughly 500px, so `--window-size=390,...` renders wider and crops. Load the page in an `<iframe width="390">` on a harness page to get a true narrow viewport, or use real device emulation. |
