# Deployment Guide for NaijaTrade Tools

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Domain name (for production)
- Paystack account for payments
- Resend account for emails (optional)

### 1. Clone and Configure

```bash
git clone <repo-url>
cd Naijaxch

# Copy and edit environment variables
cp .env.example .env
nano .env
```

### 2. Configure Environment Variables

Edit `.env` with your values:

```bash
# Required
SECRET_KEY=generate-a-32-char-random-string
POSTGRES_PASSWORD=your-secure-db-password
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_PUBLIC_KEY=pk_live_xxx

# Optional but recommended
RESEND_API_KEY=re_xxx
TELEGRAM_BOT_TOKEN=xxx:xxx
```

### 3. Build and Run

```bash
# Build and start all services
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Run database migrations
docker-compose exec backend alembic upgrade head
```

### 4. Access the App

- Frontend: http://localhost (or your domain)
- API Docs: http://localhost:8000/api/docs
- Health Check: http://localhost:8000/health

---

## Production Deployment Options

### Option A: Railway (Recommended for Quick Deploy)

1. Push code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Add PostgreSQL and Redis services
4. Connect your GitHub repo
5. Set environment variables
6. Deploy!

### Option B: DigitalOcean App Platform

1. Create a DigitalOcean account
2. Create a new App
3. Connect GitHub repo
4. Add managed PostgreSQL and Redis
5. Configure environment variables
6. Deploy

### Option C: VPS (Ubuntu)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repo and setup
git clone <repo-url>
cd Naijaxch
cp .env.example .env
nano .env

# Run with Docker Compose
docker-compose up -d

# Setup SSL with Certbot (if using custom domain)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Database Migrations

```bash
# Generate a new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Rollback one migration
docker-compose exec backend alembic downgrade -1
```

---

## Monitoring

### Health Checks
- Backend: `GET /health`
- Database: Automatic healthcheck in docker-compose

### Logs
```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

---

## SSL/HTTPS Setup

For production, use a reverse proxy like:

1. **Cloudflare** (easiest) - Free SSL, just point DNS
2. **Nginx + Certbot** - Self-managed SSL
3. **Traefik** - Automatic SSL with Let's Encrypt

Example Nginx config for production:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Scaling

For high traffic:

1. Use Redis for session storage
2. Run multiple backend instances
3. Use a load balancer (nginx, HAProxy)
4. Consider managed PostgreSQL (Supabase, Neon)

---

## Support

- Issues: https://github.com/your-repo/issues
- Email: support@naijatradetools.com
