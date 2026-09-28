#!/usr/bin/env bash
# Update the live site after a GitHub push without wiping editor saves.
#
# Editors change pages on the server. Those saves live in the SQLite database
# and in content/cms-snapshot.json. This script:
#   1. Copies that live snapshot aside
#   2. Pulls code (a fast-forward only)
#   3. Merges: server edits stay, git-only section updates come in
#   4. Loads the merged snapshot back into the database
#
# First time on the server:
#   chmod +x deploy.sh
#
# Every update:
#   ssh ...
#   cd ~/~web-ur/UNITED-PANEL-WEB/site
#   ./deploy.sh
#
# Do not git checkout or git reset --hard content/cms-snapshot.json yourself.
# That throws away the live copy this script merges.
#
set -euo pipefail

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SITE_DIR/.." && pwd)"
APP_NAME="web-ur"
SNAPSHOT_REL="site/content/cms-snapshot.json"
SNAPSHOT="$REPO_ROOT/$SNAPSHOT_REL"
WORK_DIR="$(mktemp -d)"
stopped=0
merged=0

cleanup() {
  rm -rf "$WORK_DIR"
}
on_err() {
  echo "Deploy failed on line ${BASH_LINENO[0]}." >&2
  # Pull may have replaced the snapshot. Put the live copy back so the app
  # cannot import GitHub's file over editor saves.
  if [[ "$merged" -eq 0 && -f "$WORK_DIR/live.json" && -n "${SNAPSHOT:-}" ]]; then
    cp "$WORK_DIR/live.json" "$SNAPSHOT" || true
    echo "Restored the live CMS snapshot." >&2
  fi
  if [[ "$stopped" -eq 1 ]]; then
    echo "Starting $APP_NAME again after the failed deploy." >&2
    pm2 restart "$APP_NAME" || true
  fi
  exit 1
}
trap on_err ERR
trap cleanup EXIT

write_empty_snapshot() {
  printf '%s\n' '{"version":1,"exportedAt":"","sections":[]}' > "$1"
}

load_env() {
  if [[ -f "$SITE_DIR/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$SITE_DIR/.env"
    set +a
  fi
}

# Write the database into cms-snapshot.json when the app tooling is installed.
# Returns 0 when live.json was refreshed from the database.
export_live_snapshot() {
  if [[ ! -d "$SITE_DIR/node_modules" ]]; then
    return 1
  fi
  echo "==> Exporting live CMS from the database..."
  if (cd "$SITE_DIR" && load_env && npm run content:export); then
    cp "$SNAPSHOT" "$WORK_DIR/live.json"
    return 0
  fi
  echo "    Database export failed; the on-disk snapshot will be used as the live CMS."
  return 1
}

echo "==> Repo: $REPO_ROOT"
echo "==> App:  $SITE_DIR"

cd "$REPO_ROOT"

# Ancestor for the merge: the snapshot git last had, before this pull.
if git cat-file -e "HEAD:$SNAPSHOT_REL" 2>/dev/null; then
  git show "HEAD:$SNAPSHOT_REL" > "$WORK_DIR/base.json"
else
  write_empty_snapshot "$WORK_DIR/base.json"
fi

# Keep a copy before git moves the working tree file.
if [[ -f "$SNAPSHOT" ]]; then
  cp "$SNAPSHOT" "$WORK_DIR/live.json"
else
  write_empty_snapshot "$WORK_DIR/live.json"
fi
export_live_snapshot || true

# Only the CMS snapshot is allowed to be dirty. Anything else blocks a safe pull.
other="$(
  {
    git diff --name-only
    git diff --cached --name-only
  } | grep -vx "$SNAPSHOT_REL" || true
)"
if [[ -n "$other" ]]; then
  echo "Other local changes are still in the repo, so a fast-forward pull is not safe:" >&2
  printf '%s\n' "$other" >&2
  echo "Move or commit those files, then run ./deploy.sh again. The CMS snapshot was left untouched." >&2
  exit 1
fi

# Stop the app before git replaces the snapshot. A running app imports that file
# on the next page view, which would overwrite editor saves with the pulled copy.
echo "==> Pausing $APP_NAME so the CMS file can be updated safely..."
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 stop "$APP_NAME"
  stopped=1
fi

# A dirty or untracked snapshot blocks git pull and would be overwritten.
if git ls-files --error-unmatch "$SNAPSHOT_REL" >/dev/null 2>&1; then
  git checkout -- "$SNAPSHOT_REL"
elif [[ -f "$SNAPSHOT" ]]; then
  rm -f "$SNAPSHOT"
fi

echo "==> Pulling latest from GitHub (fast-forward only)..."
# A local commit on the server blocks this. Deploy does not commit CMS data.
git pull --ff-only

if [[ -f "$SNAPSHOT" ]]; then
  cp "$SNAPSHOT" "$WORK_DIR/incoming.json"
else
  write_empty_snapshot "$WORK_DIR/incoming.json"
fi

# Put the live snapshot back until the merge is written. If the deploy stops
# halfway, a restart still loads editor saves instead of the raw GitHub file.
cp "$WORK_DIR/live.json" "$SNAPSHOT"

cd "$SITE_DIR"
echo "==> Installing dependencies..."
npm ci

echo "==> Applying database schema (existing CMS rows stay in the database)..."
npx prisma db push

echo "==> Building production site..."
npm run build

# The app is stopped, so this export is the database after the last editor save.
export_live_snapshot || true

echo "==> Merging live CMS edits with the pulled snapshot..."
node "$SITE_DIR/scripts/merge-cms-snapshot.cjs" \
  --base "$WORK_DIR/base.json" \
  --live "$WORK_DIR/live.json" \
  --incoming "$WORK_DIR/incoming.json" \
  --out "$SNAPSHOT"

echo "==> Loading the merged CMS into the database..."
load_env
npm run content:import
merged=1

echo "==> Restarting $APP_NAME..."
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME"
else
  echo "    $APP_NAME is not running yet; starting it."
  pm2 start ecosystem.config.cjs
  pm2 save
fi

echo "==> Done. Live editor saves were merged into content/cms-snapshot.json."
echo "    That file will look modified in git on the server. Leave it; the next deploy merges it again."
pm2 status "$APP_NAME"
