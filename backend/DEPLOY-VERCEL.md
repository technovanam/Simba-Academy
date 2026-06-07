# Vercel — temporary backend hosting

Use a **separate Vercel project** with root directory `backend`.

## 1. Create Vercel project

1. [vercel.com](https://vercel.com) → **Add New Project** → import Git repo
2. **Root Directory:** `backend`
3. **Framework Preset:** Other
4. Build/install commands are read from `backend/vercel.json`

## 2. Environment variables

Set in Vercel → Project → **Settings → Environment Variables**:

```env
NODE_ENV=production
DATABASE_URL=mysql://simbapre_school:PASSWORD@simbapreschool.in:3306/simbapre_simbaacademy?allowPublicKeyRetrieval=true
JWT_SECRET=<openssl rand -hex 32>
FRONTEND_URL=https://YOUR-FRONTEND.vercel.app
ALLOWED_ORIGINS=https://YOUR-FRONTEND.vercel.app
ALLOW_VERCEL_PREVIEWS=true
STORAGE_PATH=/tmp/simba-uploads
USE_WEBDAV=true
WEBDAV_URL=https://simbapreschool.in:2078
WEBDAV_USER=simba@simbapreschool.in
WEBDAV_PASSWORD=<your webdisk password>
WEBDAV_BASE_URL=https://simbapreschool.in/simba
DEFAULT_ADMIN_EMAIL=admin@simbaacademy.in
DEFAULT_ADMIN_PASSWORD=<strong password>
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=contact@simbapreschool.in
ZOHO_PAYMENTS_PLACEHOLDER=false
GOOGLE_OAUTH_REDIRECT_URI=https://YOUR-BACKEND.vercel.app/api/admin/google-reviews/oauth-callback
```

Copy remaining keys from `.env.production.example` (Zoho, Google, etc.).

### Remote MySQL (required)

Vercel cannot use `localhost` for DB. In cPanel:

1. **Remote MySQL** → add access host **`%`** (any) or Vercel IP ranges
2. Use host **`simbapreschool.in`** (not `localhost`) in `DATABASE_URL`

After first deploy, run schema sync once from your PC (with remote DB URL):

```powershell
cd backend
$env:DATABASE_URL="mysql://simbapre_school:...@simbapreschool.in:3306/simbapre_simbaacademy?allowPublicKeyRetrieval=true"
npx prisma db push
```

## 3. Deploy

Push to Git — Vercel auto-deploys, or:

```powershell
cd backend
npx vercel --prod
```

## 4. Verify

```bash
curl https://YOUR-BACKEND.vercel.app/api/health
```

## Limitations (temporary hosting)

| Feature | On Vercel |
|---------|-----------|
| Auth, CRUD, payments, email | Works |
| Database | Remote cPanel MySQL |
| File uploads | **USE_WEBDAV=true** (files go to cPanel Web Disk) |
| Local `/uploads` | Ephemeral `/tmp` only — not for production files |
| Cold starts | First request may be slow (~2–5s) |
| Google GBP sync | Works once API quota approved |

## Update frontend

Set on the **frontend** Vercel project:

```env
VITE_API_URL=https://YOUR-BACKEND.vercel.app
```

See `frontend/DEPLOY-VERCEL.md`.
