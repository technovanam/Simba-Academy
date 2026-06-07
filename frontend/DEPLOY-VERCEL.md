# Vercel — temporary frontend hosting

Use a **separate Vercel project** with root directory `frontend`.

## 1. Create Vercel project

1. [vercel.com](https://vercel.com) → **Add New Project** → same Git repo
2. **Root Directory:** `frontend`
3. **Framework Preset:** Vercel auto-detects React Router (via `@vercel/react-router` preset)

## 2. Environment variables

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://simba-api-xxx.vercel.app` |

Optional monitoring:

```env
VITE_SENTRY_DSN=
VITE_POSTHOG_KEY=
```

## 3. Deploy

Push to Git or:

```powershell
cd frontend
npx vercel --prod
```

## 4. Connect backend CORS

On the **backend** Vercel project, set:

```env
FRONTEND_URL=https://YOUR-FRONTEND.vercel.app
ALLOWED_ORIGINS=https://YOUR-FRONTEND.vercel.app
ALLOW_VERCEL_PREVIEWS=true
```

Redeploy backend after changing CORS vars.

## 5. Verify

- Open `https://YOUR-FRONTEND.vercel.app`
- Home page loads reviews from API
- Login / register hit backend (check browser Network tab → API calls go to `VITE_API_URL`)

## Notes

- Preview deployments get unique `*.vercel.app` URLs — `ALLOW_VERCEL_PREVIEWS=true` on backend allows them.
- For production, move to `www.simbapreschool.in` + `api.simbapreschool.in` on cPanel (see `DEPLOY-CPANEL.md`).
