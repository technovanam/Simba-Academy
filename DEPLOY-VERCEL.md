# Temporary hosting on Vercel (frontend + backend)

Deploy **two separate Vercel projects** from the same Git repo.

| Project | Root directory | Docs |
|---------|----------------|------|
| **Frontend** (website) | `frontend` | [frontend/DEPLOY-VERCEL.md](frontend/DEPLOY-VERCEL.md) |
| **Backend** (API) | `backend` | [backend/DEPLOY-VERCEL.md](backend/DEPLOY-VERCEL.md) |

## Quick start

### 1. Backend first

1. Vercel → New Project → import repo → **Root Directory: `backend`** (required — not repo root)
2. Framework Preset: **Other** (do not override Output Directory)
3. Add env vars from [backend/.env.vercel.example](backend/.env.vercel.example)
4. Deploy → note URL e.g. `https://simba-api.vercel.app`
5. Test: `curl https://YOUR-BACKEND.vercel.app/api/health` (must return JSON, not 404)
6. Set **`DATABASE_URL`** to your **Aiven MySQL** Service URI (`?ssl-mode=REQUIRED`). In Aiven → **Firewall** → allow **`0.0.0.0/0`** so Vercel can connect.
7. Run once (home WiFi or mobile hotspot if college blocks DB ports): from `backend/`, `npx prisma db push`, then `npx tsx src/config/seedAdmin.ts`

### 2. Frontend second

1. New Project → same repo → **Root Directory: `frontend`** (required)
2. Framework Preset: **React Router** (auto-detected — do not set Output Directory manually)
3. Set `VITE_API_URL=https://simba-api.vercel.app`
4. Deploy

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

## 404 troubleshooting

| Symptom | Fix |
|---------|-----|
| **Whole site 404** | Wrong Root Directory — frontend must be `frontend`, backend must be `backend` |
| **Frontend pages 404** | Remove custom Output Directory in Vercel settings; redeploy with `@vercel/react-router` preset |
| **API `/api/health` 404** | Backend Root Directory must be `backend`; redeploy after `vercel.json` fix |
| **API works, UI empty** | Set `VITE_API_URL` on frontend project and redeploy |
| **CORS error** | Add frontend URL to backend `ALLOWED_ORIGINS` + `ALLOW_VERCEL_PREVIEWS=true` |

## Important for temp hosting

- **Uploads:** set `USE_WEBDAV=true` on backend so files go to cPanel Web Disk (Vercel disk is ephemeral)
- **Database:** use **Aiven MySQL** (or cPanel with Remote MySQL `%`) — not `localhost` on Vercel
- **Not for long-term production** — use cPanel deploy ([backend/DEPLOY-CPANEL.md](backend/DEPLOY-CPANEL.md)) when ready
