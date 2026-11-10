# Local setup

## 0. Toolchain — read this first (WSL)

**The project lives in the WSL filesystem at `~/triyan`, not on the Windows Desktop.**
This is deliberate. It was originally on `/mnt/c/.../Desktop/Triyan`, where every file
operation crosses the Windows/WSL boundary:

| Operation | On `/mnt/c` | In `~/triyan` |
|---|---|---|
| `npm install` | ~25 min | **11 s** |
| `eslint .` | ~2 min | **3 s** |
| `npm run verify` (lint + typecheck + test + build) | several min | **18 s** |

Open it with the WSL remote rather than through Windows Explorer:

```bash
cd ~/triyan && code .
```

From Windows the files are still reachable at `\\wsl$\<distro>\home\<you>\triyan`,
but **do not edit them through that path or through `/mnt/c`** — use WSL for anything
that writes.

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
cp client/.env.example client/.env.local
```

Then fill in:

| Variable | Where it comes from |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers. Create a database user, allow your IP. |
| `REVALIDATE_SECRET` | `openssl rand -hex 32`. Must be **identical** in `server/.env` and `client/.env.local`. |
| `INSTAGRAM_*` | Leave `INSTAGRAM_PROVIDER=mock` until Phase 11. See `docs/INSTAGRAM.md`. |

The server validates its environment at boot and **refuses to start** on a missing or
malformed value, printing exactly which variable is wrong.

## 3. Run

```bash
npm run dev          # shared (watch) + server :4000 + client :3000
npm run dev:server   # server only
npm run dev:client   # client only
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
