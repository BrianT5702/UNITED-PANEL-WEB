# Deploy United Panel site on DigitalOcean (shared droplet)

Server IP: `146.190.82.105`  
Goal: run this site **without breaking other apps** already on the server.

You already use **nip.io** for other apps (e.g. [ur.146-190-82-105.nip.io](https://ur.146-190-82-105.nip.io/)).  
Use the same pattern with a **new** subdomain so this site is separate:

**https://web-ur.146-190-82-105.nip.io**  
(or `http://…` until you add HTTPS for this host)

Admin: **https://web-ur.146-190-82-105.nip.io/admin/login**

`nip.io` is a free DNS helper: any name like `something.146-190-82-105.nip.io` points at IP `146.190.82.105`. No domain purchase needed.

---

## 0. Before you start

On your PC:

1. Push this project to GitHub (code + used images under `site/public/uploads`).
2. Do **not** push `.env` or `prisma/dev.db`.
3. Pick an unused local port on the server, e.g. **3010** (80/443 stay for nginx / other sites).

---

## 1. SSH into the droplet

```bash
ssh root@146.190.82.105
# or: ssh youruser@146.190.82.105
```

Install Node 20+ if missing:

```bash
node -v
# if old/missing, use NodeSource or nvm to install Node 20 LTS
```

Install PM2 (process manager) if missing:

```bash
npm install -g pm2
```

---

## 2. Put the app in its own folder

Same pattern as `ur-model` and `ups-ims` — in your home directory:

```bash
mkdir -p ~/web-ur
cd ~/web-ur
git clone YOUR_GITHUB_REPO_URL .
# if the Next app is inside /site:
cd site
```

---

## 3. Create server `.env`

```bash
cd /home/brian/web-ur/site
nano .env
```

Example:

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="pick-a-strong-password"
SESSION_SECRET="paste-a-long-random-string-here"
NODE_ENV=production
```

Generate a secret:

```bash
openssl rand -hex 32
```

---

## 4. Install, build, create DB

```bash
cd /home/brian/web-ur/site
npm ci
npx prisma db push
npm run build
```

Optional seed (only if you want default content):

```bash
npm run db:seed
```

**Persistent data (do not delete on future deploys):**

- `prisma/dev.db` — admin text / menu / page content  
- `public/uploads/` — uploaded images  

---

## 5. Run with PM2 on port 3010

**Important:** PM2 must run with `cwd` = the `site` folder. If cwd is wrong, admin uploads write somewhere else and `/uploads/...` returns 404.

Prefer the ecosystem file (sets cwd + `UPLOADS_DIR`):

```bash
cd /home/brian/~web-ur/UNITED-PANEL-WEB/site   # or ~/web-ur/site if you used that path
pm2 delete web-ur 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Or manually:

```bash
cd /home/brian/~web-ur/UNITED-PANEL-WEB/site
PORT=3010 UPLOADS_DIR="$(pwd)/public/uploads" pm2 start npm --name web-ur --cwd "$(pwd)" -- start
pm2 save
```

Check:

```bash
pm2 status
pm2 show web-ur | grep -E 'exec cwd|status'
curl -I http://127.0.0.1:3010
```

Quick test (if firewall allows the port):

**http://146.190.82.105:3010**

---

## 6. Unique hostname via Nginx (same style as your BIM site)

Add a **new** site file — do not change the config for `ur.146-190-82-105.nip.io`:

```bash
sudo nano /etc/nginx/sites-available/web-ur
```

Paste:

```nginx
server {
    listen 80;
    server_name web-ur.146-190-82-105.nip.io;

    client_max_body_size 20M;

    # Serve uploaded images from disk (avoids 404 if Next cwd is wrong)
    location /uploads/ {
        alias /home/brian/~web-ur/UNITED-PANEL-WEB/site/public/uploads/;
        access_log off;
        expires 7d;
    }

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Adjust the `alias` path if your clone lives elsewhere (e.g. `/home/brian/web-ur/site/public/uploads/`).

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/web-ur /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Open:

**http://web-ur.146-190-82-105.nip.io**

If your other sites use HTTPS with Certbot, add a cert for this host the same way:

```bash
sudo certbot --nginx -d web-ur.146-190-82-105.nip.io
```

This does **not** replace your BIM / other sites — Nginx routes only this hostname to port 3010.

---

## 7. Firewall (DigitalOcean)

In DO → Networking → Firewalls (or `ufw` on the droplet):

- Allow **22** (SSH)
- Allow **80** / **443** (HTTP/HTTPS) — already needed for other sites
- Optional: allow **3010** only if you want direct `IP:3010` access

---

## 8. After deploy checklist

- [ ] Homepage loads on `web-ur.146-190-82-105.nip.io`  
- [ ] Images load  
- [ ] `/admin/login` works with your server `ADMIN_PASSWORD`  
- [ ] Edit text → Save → refresh public page  
- [ ] Upload a photo → still there after `pm2 restart web-ur`  
- [ ] Existing sites (e.g. [ur.146-190-82-105.nip.io](https://ur.146-190-82-105.nip.io/)) still work  

---

## Troubleshooting: admin image upload 404

If the console shows `GET /uploads/….jpg 404` after picking a new image:

1. Find where the file was written:
   ```bash
   find ~ -name '1787195490518-*.jpg' 2>/dev/null
   ```
2. Confirm the real uploads folder:
   ```bash
   ls -la ~/~web-ur/UNITED-PANEL-WEB/site/public/uploads | tail
   ```
3. Fix PM2 cwd (section 5) and add the nginx `/uploads/` alias (section 6), then:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   pm2 restart web-ur
   ```
4. Re-upload the image (or move the orphaned file into `site/public/uploads/`).

---

## Updating the site later

```bash
cd ~/~web-ur/UNITED-PANEL-WEB/site
git pull
npm ci
npm run build
pm2 restart web-ur
```

Do **not** delete `prisma/dev.db` or `public/uploads` when updating.

---

## When you get a real domain later

Point a DNS `A` record to `146.190.82.105`, change `server_name` in Nginx to that domain, then Certbot. Ask again when ready.
