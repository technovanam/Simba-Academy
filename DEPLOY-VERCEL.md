# Temporary hosting on Vercel (frontend + backend)

Deploy **two separate Vercel projects** from the same Git repo.

| Project | Root directory | Docs |
|---------|----------------|------|
| **Frontend** (website) | `frontend` | [frontend/DEPLOY-VERCEL.md](frontend/DEPLOY-VERCEL.md) |
| **Backend** (API) | `backend` | [backend/DEPLOY-VERCEL.md](backend/DEPLOY-VERCEL.md) |

## Quick start

### 1. Backend first

1. Vercel → New Project → import repo → **Root Directory: `backend`**
2. Add env vars from [backend/.env.vercel.example](backend/.env.vercel.example)
3. Deploy → note URL e.g. `https://simba-api.vercel.app`
4. Enable **Remote MySQL** on cPanel (`%` host) — Vercel cannot use `localhost`
5. Run once from your PC: `npx prisma db push` with remote `DATABASE_URL`

### 2. Frontend second

1. New Project → same repo → **Root Directory: `frontend`**
2. Set `VITE_API_URL=https://simba-api.vercel.app`
3. Deploy

### 3. Link CORS

On backend project, set:

```env
FRONTEND_URL=https://simba-web.vercel.app
ALLOWED_ORIGINS=https://simba-web.vercel.app
ALLOW_VERCEL_PREVIEWS=true
```

Redeploy backend.

### 4. Test

```bash
curl https://simba-api.vercel.app/api/health
```

Open frontend URL → login, contact form, admin.

## Important for temp hosting

- **Uploads:** set `USE_WEBDAV=true` on backend so files go to cPanel Web Disk (Vercel disk is ephemeral)
- **Database:** stays on cPanel MySQL — remote connection required
- **Not for long-term production** — use cPanel deploy ([backend/DEPLOY-CPANEL.md](backend/DEPLOY-CPANEL.md)) when ready
