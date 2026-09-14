#!/usr/bin/env bash
# Update the live site after a GitHub push.
#
# First time on the server:
#   chmod +x deploy.sh
#
# Every update:
#   ssh ...
#   cd ~/~web-ur/UNITED-PANEL-WEB/site
#   ./deploy.sh
#
set -euo pipefail
trap 'echo "Deploy failed on line $LINENO." >&2' ERR

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SITE_DIR/.." && pwd)"
APP_NAME="web-ur"

echo "==> Repo: $REPO_ROOT"
echo "==> App:  $SITE_DIR"

cd "$REPO_ROOT"
echo "==> Pulling latest from GitHub..."
git pull --ff-only

cd "$SITE_DIR"
echo "==> Installing dependencies..."
npm ci

echo "==> Applying database schema (existing CMS content is kept)..."
npx prisma db push

echo "==> Building production site..."
npm run build

echo "==> Restarting $APP_NAME..."
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME"
else
  echo "    $APP_NAME is not running yet; starting it."
  pm2 start ecosystem.config.cjs
  pm2 save
fi

echo "==> Done."
pm2 status "$APP_NAME"
