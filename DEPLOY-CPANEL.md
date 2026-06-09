# Deploy Simba Academy on cPanel

Two separate zip files — **backend API** and **static frontend**. Build them on your PC, then upload to cPanel.

## 1. Build the zip files (on your PC)

```bash
# From repo root — builds both zips
npm run pack:cpanel
```

Or separately:

```bash
npm run pack:backend   # → simba-api.zip
npm run pack:frontend  # → simba-frontend.zip
```

### Before packing the frontend

Copy the production env template and set your live API URL:

```bash
cp frontend/.env.production.example frontend/.env.production
# Edit VITE_API_URL if your domain differs
```

`VITE_API_URL` must match where the Node app is reachable, e.g. `https://simbapreschool.in/backend`.

---

## 2. Backend API (`simba-api.zip`)

### Upload

1. cPanel → **File Manager**
2. Create folder outside `public_html`, e.g. `backend-api` (or use the path cPanel assigns for Node.js apps)
3. Upload `simba-api.zip` → **Extract**

### Node.js app

1. cPanel → **Setup Node.js App** → **Create Application**
2. **Node.js version:** 20+
3. **Application root:** folder where you extracted (e.g. `backend-api`)
4. **Application URL:** `/backend` (or a subdomain like `api.yourdomain.com`)
5. **Application startup file:** `app.js`
6. **Environment variables:** copy from `backend/.env.production.example` (or paste from your local `.env`). At minimum:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL` / `ALLOWED_ORIGINS`
   - Zoho / Resend keys (set `PAYMENTS_ENABLED=true`, `ZOHO_PAYMENTS_PLACEHOLDER=false`)
   - `PUBLIC_API_URL` (e.g. `https://simbapreschool.in/backend`)

7. Click **Run NPM Install**
8. **Run JS script:** `scripts/cpanel-setup.mjs` (once — creates tables + admin user)
9. **Save** → **Restart**

### Verify

Open: `https://yourdomain.in/backend/api/health`  
Expected: `{"status":"ok",...}`

### Uploads folder

Uploads are stored **inside the Node app** at `uploads/` (created automatically on first start).  
Public URL: `https://yourdomain.in/backend/uploads/…`  
In File Manager, ensure `<app-root>/uploads` exists with permissions **755** (writable by Node).

---

## 3. Frontend (`simba-frontend.zip`)

### Upload

1. cPanel → **File Manager** → `public_html`
2. **Optional:** back up existing site files
3. Upload `simba-frontend.zip` → **Extract** into `public_html`  
   (contents: `index.html`, `assets/`, `.htaccess`, etc.)

The included `.htaccess` enables React Router client-side routing on Apache.

**Important:** Do **not** delete `public_html/backend/` — that folder is created by **Setup Node.js App** for the API (`/backend` URL). The frontend zip only goes in `public_html` root. If `public_html/backend/.htaccess` is missing, the Node app cannot start/stop (see troubleshooting below).

### Verify

- `https://yourdomain.in/` — portal picker / landing
- Login pages load and call the API (check browser Network tab for `/backend/api/...`)

---

## 4. MySQL (if not done)

1. cPanel → **MySQL Databases** — create database + user, add user to database
2. Put the connection string in `DATABASE_URL` on the Node app
3. Re-run `scripts/cpanel-setup.mjs` if tables are missing

---

## 5. Troubleshooting

| Issue | Fix |
|--------|-----|
| `FileNotFoundError: ... public_html/backend/.htaccess` | Create folder `public_html/backend`, add empty `.htaccess`, then **Setup Node.js App → Edit app → Save** (regenerates Passenger config). See section 6. |
| API 404 | Check Node app URL prefix matches `VITE_API_URL` (e.g. `/backend`) |
| CORS error | Add your site to `ALLOWED_ORIGINS` in backend env |
| Blank page after refresh | Ensure `.htaccess` is in `public_html` |
| Uploads fail | Ensure `<app-root>/uploads` exists with write permission (755) |
| Prisma errors on server | Re-run **Run NPM Install**, then `scripts/cpanel-setup.mjs` |
| `tsc` / TS7006 / TS7016 (`Could not find declaration file for module 'express'`) | **Do not build on the server.** `simba-api.zip` already includes compiled `dist/`. Re-pack on your PC (`npm run pack:backend`), re-upload, **Run NPM Install**, **Restart**. If you must compile in cPanel Terminal: `npm run cpanel-install` then `npm run build` (needs devDependencies from `.npmrc`). |

---

## 6. Fix missing `public_html/backend/.htaccess`

This happens if the frontend was extracted over the Node.js `/backend` URL folder.

### Option A — cPanel File Manager (recommended)

1. **File Manager** → `public_html`
2. Create folder **`backend`** (if missing)
3. Inside `backend`, create new file **`.htaccess`** (enable *Show Hidden Files* in Settings)
4. Leave it **empty** and save
5. **Setup Node.js App** → open your API app → click **Save** (cPanel writes Passenger lines into that file)
6. **Restart** the app

### Option B — Terminal

```bash
mkdir -p ~/public_html/backend
touch ~/public_html/backend/.htaccess
chmod 644 ~/public_html/backend/.htaccess
```

Then **Setup Node.js App → Save → Restart**.

### Option C — Copy template

From `simba-api.zip`, use `scripts/public_html-backend.htaccess.template` — replace `simbapre` and `nodevenv` paths with values shown on your **Setup Node.js App** page, save as `public_html/backend/.htaccess`.

---

## File outputs

| Zip | Location after pack |
|-----|---------------------|
| `simba-api.zip` | Repo root |
| `simba-frontend.zip` | Repo root |

Neither zip includes `node_modules`. The server installs dependencies via **Run NPM Install** in cPanel.
