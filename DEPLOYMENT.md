# Deployment Guide

This app is a Next.js 16 application with a Node.js backend (required for API routes). Choose one deployment path below.

---

## Path A: Vercel (Recommended — Zero Config)

Best for: Teams that want a managed hosting platform with automatic HTTPS, custom domains, and zero DevOps.

### Setup

1. **Push to GitHub** (if not already)
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign up (free tier available)
   - Click "Add New" → "Project"
   - Select your GitHub repo (`po-workbench`)
   - Vercel auto-detects Next.js — no configuration needed

3. **Add Environment Variable**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add:
     - **Name:** `OPENAI_API_KEY`
     - **Value:** Your OpenAI API key (from https://platform.openai.com/api-keys)
     - **Environments:** Production, Preview, Development
   - Click "Save"

4. **Deploy**
   - Click "Deploy"
   - Vercel automatically:
     - Runs `npm install`
     - Runs `npm run build`
     - Serves the app via Node.js runtime
     - Assigns a URL: `https://po-workbench-<random>.vercel.app`

5. **Verify**
   ```bash
   curl https://po-workbench-<random>.vercel.app/api/health
   # Expected response: { "ok": true, "apiKey": true }
   ```

### Custom Domain (Optional)

In Vercel dashboard:
1. Go to Settings → Domains
2. Add your domain (e.g., `po-workbench.company.com`)
3. Update DNS records per Vercel's instructions
4. Vercel auto-provisions HTTPS via Let's Encrypt

---

## Path B: Self-Hosted VPS (Ubuntu/Debian)

Best for: Teams that need full control, specific compliance requirements, or existing server infrastructure.

### Prerequisites

- Server running Ubuntu 20.04+ or Debian 11+ (e.g., DigitalOcean Droplet, AWS EC2, Linode, Hetzner)
- SSH access
- Domain name pointing to server IP (optional but recommended for HTTPS)

### Step 1: Install Node.js

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verify: should be v20.x or higher
```

### Step 2: Clone and Install

```bash
cd /opt
sudo git clone https://github.com/<your-org>/po-workbench.git
cd po-workbench
sudo npm install --production
```

### Step 3: Configure Environment

```bash
sudo cp .env.local.example .env.local
sudo nano .env.local
# Add your OPENAI_API_KEY, save (Ctrl+X, Y, Enter)
```

### Step 4: Build

```bash
sudo npm run build
# Output goes to `.next/` directory
```

### Step 5: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
sudo pm2 start "npm start" --name po-workbench --max-memory-restart 500M
sudo pm2 save
sudo pm2 startup
# Follow instructions to enable auto-restart on server reboot
```

### Step 6: Configure Nginx (Reverse Proxy)

Install nginx:
```bash
sudo apt install -y nginx
```

Create config at `/etc/nginx/sites-available/po-workbench`:
```nginx
upstream po_workbench {
  server 127.0.0.1:3000;
  keepalive 64;
}

server {
  listen 80;
  server_name po-workbench.company.com;  # Replace with your domain

  location / {
    proxy_pass http://po_workbench;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
  }
}
```

Enable the config:
```bash
sudo ln -s /etc/nginx/sites-available/po-workbench /etc/nginx/sites-enabled/
sudo nginx -t  # Verify syntax
sudo systemctl restart nginx
```

### Step 7: Setup HTTPS (Optional but Recommended)

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d po-workbench.company.com
# Follow prompts to verify domain ownership
# Certbot auto-updates your nginx config with HTTPS
```

Enable auto-renewal:
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Step 8: Verify

```bash
curl http://localhost:3000/api/health
# Expected response: { "ok": true, "apiKey": true }

# Or hit the public domain:
curl https://po-workbench.company.com/api/health
```

### Monitoring & Logs

View PM2 logs:
```bash
sudo pm2 logs po-workbench
sudo pm2 status
```

View nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Updates

To deploy a new version:
```bash
cd /opt/po-workbench
sudo git pull origin main
sudo npm install --production
sudo npm run build
sudo pm2 restart po-workbench
```

---

## Path C: Docker (Advanced)

For teams using Kubernetes, Docker Swarm, or containerized CI/CD.

### Requirements

1. **Update `next.config.ts`** to enable standalone output:
   ```typescript
   const nextConfig = {
     output: 'standalone',
   };
   ```

2. **Create `Dockerfile`**:
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:20-alpine
   WORKDIR /app
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   COPY --from=builder /app/public ./public
   EXPOSE 3000
   ENV NODE_ENV=production
   CMD ["node", "server.js"]
   ```

3. **Create `docker-compose.yml`** (for local testing):
   ```yaml
   version: '3.8'
   services:
     web:
       build: .
       ports:
         - "3000:3000"
       environment:
         OPENAI_API_KEY: ${OPENAI_API_KEY}
       restart: unless-stopped
   ```

4. **Build and run**:
   ```bash
   docker build -t po-workbench .
   docker run -e OPENAI_API_KEY=sk-proj-... -p 3000:3000 po-workbench
   ```

---

## Monitoring & Logs

### Health Check Endpoint

All deployments provide a health check:
```bash
curl https://<your-domain>/api/health
```

Expected response (API key configured):
```json
{ "ok": true, "apiKey": true }
```

If `"apiKey": false`, the `OPENAI_API_KEY` env var is not set correctly.

### Error Tracking (Optional)

To integrate Sentry error monitoring (for future production use):

1. Create account at https://sentry.io
2. Create a Next.js project
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
   ```
4. Restart the app

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "API key not configured" | `OPENAI_API_KEY` env var not set | Check `/api/health` → set `apiKey: true` before proceeding |
| 502 Bad Gateway | App crashed or not running | Check PM2 logs: `pm2 logs po-workbench` |
| Slow stage execution | OpenAI API rate limiting | Wait a few seconds, retry. Check OpenAI dashboard for usage. |
| HTTPS cert warning | Self-signed or expired | Use Let's Encrypt (certbot) or Vercel's auto HTTPS |

---

## Production Readiness Checklist

Before deploying to a public URL:

- [ ] `OPENAI_API_KEY` is set as a server environment variable (not hardcoded)
- [ ] Health check returns `{ "ok": true, "apiKey": true }`
- [ ] You can run a stage end-to-end (Inbox → Business Need)
- [ ] Nginx or Vercel is configured to proxy to the app
- [ ] HTTPS is enabled (Vercel does this automatically)
- [ ] You've tested the app in a browser on the public URL
- [ ] Log files are being generated (PM2 or Vercel dashboards)

---

For questions or issues, see [SETUP.md](./SETUP.md) or [CLAUDE.md](./CLAUDE.md).
