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
   - `STORAGE_PATH` (absolute path, e.g. `/home1/username/uploads`)
   - Zoho / Resend keys if used

7. Click **Run NPM Install**
8. **Run JS script:** `scripts/cpanel-setup.mjs` (once — creates tables + admin user)
9. **Save** → **Restart**

### Verify

Open: `https://yourdomain.in/backend/api/health`  
Expected: `{"status":"ok",...}`

### Uploads folder

Create the folder from `STORAGE_PATH` in File Manager and set permissions **755**.  
Example: `/home1/simapre/uploads`

---

## 3. Frontend (`simba-frontend.zip`)

### Upload

1. cPanel → **File Manager** → `public_html`
2. **Optional:** back up existing site files
3. Upload `simba-frontend.zip` → **Extract** into `public_html`  
   (contents: `index.html`, `assets/`, `.htaccess`, etc.)

The included `.htaccess` enables React Router client-side routing on Apache.

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
| API 404 | Check Node app URL prefix matches `VITE_API_URL` (e.g. `/backend`) |
| CORS error | Add your site to `ALLOWED_ORIGINS` in backend env |
| Blank page after refresh | Ensure `.htaccess` is in `public_html` |
| Uploads fail | Create `STORAGE_PATH` folder with write permission |
| Prisma errors on server | Re-run **Run NPM Install**, then `scripts/cpanel-setup.mjs` |

---

## File outputs

| Zip | Location after pack |
|-----|---------------------|
| `simba-api.zip` | Repo root |
| `simba-frontend.zip` | Repo root |

Neither zip includes `node_modules`. The server installs dependencies via **Run NPM Install** in cPanel.
