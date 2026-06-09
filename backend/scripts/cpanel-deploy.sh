#!/usr/bin/env bash
# Run ON the cPanel server inside the Node.js application root (e.g. ~/api).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Simba API cPanel deploy (root: $ROOT)"

if [[ ! -f .env ]]; then
  echo "ERROR: .env missing. Copy .env.production.example → .env and fill secrets."
  exit 1
fi

# cPanel Node.js virtualenv (adjust version/path if cPanel shows a different one)
if [[ -f /home/simbapre/nodevenv/api/20/bin/activate ]]; then
  # shellcheck disable=SC1091
  source /home/simbapre/nodevenv/api/20/bin/activate
fi

export NODE_ENV=production

echo "==> npm install"
npm install

echo "==> build TypeScript"
npm run build

echo "==> prisma generate + db push"
npx prisma generate
npx prisma db push

mkdir -p uploads
chmod 755 uploads || true

mkdir -p data
chmod 755 data || true

echo "==> health check (local)"
node -e "
import 'dotenv/config';
const port = process.env.PORT || 3001;
fetch('http://127.0.0.1:' + port + '/api/health')
  .then(r => r.json())
  .then(j => console.log('Health:', j.status))
  .catch(() => console.log('Skip local health — restart app in cPanel, then curl public URL'));
" 2>/dev/null || true

echo ""
echo "Done. Restart the app in cPanel → Setup Node.js App → Restart"
echo "Then: curl https://api.simbapreschool.in/api/health"
