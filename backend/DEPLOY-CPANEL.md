# Deploy Simba Academy Backend on cPanel

Target stack: **Node.js 20+**, **MySQL/MariaDB** (`simbapre_simbaacademy`), domain **`api.simbapreschool.in`**.

---

## 1. One-time cPanel setup

### Database (if not done)

1. cPanel → **MySQL Databases**
2. Database: `simbapre_simbaacademy`
3. User: `simbapre_school` → add to database with **ALL PRIVILEGES**

### Subdomain for API

1. cPanel → **Subdomains** → create **`api`** → document root e.g. `api.simbapreschool.in`
2. cPanel → **SSL/TLS** → AutoSSL for `api.simbapreschool.in`

### Node.js application

1. cPanel → **Setup Node.js App** → **Create Application**
2. Use these settings:

| Field | Value |
|-------|--------|
| Node.js version | **20.x** (or latest LTS) |
| Application mode | **Production** |
| Application root | `/home/simbapre/api` (or your chosen folder) |
| Application URL | `api.simbapreschool.in` |
| Application startup file | `dist/index.js` |
| Passenger log file | leave default |

3. Click **Create**

---

## 2. Upload backend files

Pick **one** method.

### Method A — ZIP upload (easiest)

On your PC:

```powershell
cd backend
npm run deploy:pack
```

This creates `backend/deploy/simba-api.zip`. Upload and extract it into the **Application root** folder (`/home/simbapre/api`) via cPanel File Manager or FTP.

### Method B — Git (cPanel Git Version Control)

1. cPanel → **Git Version Control** → clone this repo
2. Set deploy path; `.cpanel.yml` in the repo root runs the backend deploy script automatically on **Deploy HEAD Commit**

### Method C — SSH

```bash
cd ~/api
git pull   # or upload files
bash scripts/cpanel-deploy.sh
```

---

## 3. Environment variables

In cPanel → **Setup Node.js App** → your app → **Environment Variables**, add (or create `/home/simbapre/api/.env`):

Copy from `.env.production.example` and fill real secrets. Minimum required:

```env
NODE_ENV=production
DATABASE_URL=mysql://simbapre_school:YOUR_PASSWORD@localhost:3306/simbapre_simbaacademy?allowPublicKeyRetrieval=true
JWT_SECRET=<openssl rand -hex 32>
FRONTEND_URL=https://www.simbapreschool.in
ALLOWED_ORIGINS=https://www.simbapreschool.in,https://simbapreschool.in
STORAGE_PATH=/home/simbapre/public_html/simba
DEFAULT_ADMIN_EMAIL=admin@simbaacademy.in
DEFAULT_ADMIN_PASSWORD=<strong password — first login only>
ZOHO_PAYMENTS_PLACEHOLDER=false
GOOGLE_OAUTH_REDIRECT_URI=https://api.simbapreschool.in/api/admin/google-reviews/oauth-callback
```

**Password URL-encoding:** `@` → `%40`, `!` → `%21`, `#` → `%23`

Create the uploads folder:

```bash
mkdir -p ~/public_html/simba
chmod 755 ~/public_html/simba
```

---

## 4. Install & deploy on server

In cPanel Node.js app page, click **Run NPM Install**, then open **Terminal** (or SSH):

```bash
source /home/simbapre/nodevenv/api/20/bin/activate   # path shown in cPanel Node app
cd ~/api
npm run deploy:cpanel
```

Or run the shell script:

```bash
cd ~/api
bash scripts/cpanel-deploy.sh
```

Then in cPanel → **Setup Node.js App** → **Restart**.

---

## 5. Verify

```bash
curl https://api.simbapreschool.in/api/health
```

Expected:

```json
{"status":"ok","timestamp":"...","uptime":...,"environment":"production"}
```

From your PC (optional):

```powershell
cd backend
$env:PLAYWRIGHT_API_URL="https://api.simbapreschool.in"
node scripts/production-readiness.mjs
```

---

## 6. Connect frontend

In your frontend build (`.env.production` or cPanel env for static site):

```env
VITE_API_URL=https://api.simbapreschool.in
```

Rebuild and deploy the frontend to `www.simbapreschool.in`.

---

## 7. Updates (re-deploy)

```powershell
# Local
cd backend
npm run deploy:pack
```

Upload new zip → extract over `/home/simbapre/api` → SSH:

```bash
cd ~/api
npm run deploy:cpanel
```

Restart the Node.js app in cPanel.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **503 / app not starting** | Check cPanel → Node.js app → **Open log**. Ensure `dist/index.js` exists (`npm run build`). |
| **Missing env var** | App crashes on boot — check error log; set all vars from `.env.production.example`. |
| **Database connection failed** | Use `localhost` as host on server (not `157.66.191.9`). Run `npm run db:check`. |
| **CORS error in browser** | Add your exact frontend origin to `ALLOWED_ORIGINS` (include `https://www.`). |
| **Uploads 404** | `STORAGE_PATH` must point to writable folder; create `public_html/simba`. |
| **Prisma P2022** | Run `npm run deploy:cpanel` or `npx prisma db push` on server. |
| **Port in use** | Let cPanel assign `PORT` — do not hardcode a conflicting port in `.env`. |

---

## File layout on server

```
/home/simbapre/
├── api/                    ← Node.js application root
│   ├── dist/index.js       ← startup file
│   ├── prisma/
│   ├── package.json
│   ├── .env                ← secrets (not in git)
│   └── data/               ← Google reviews snapshot, etc.
└── public_html/
    ├── simba/              ← uploaded files (STORAGE_PATH)
    └── ...                 ← frontend static site
```
