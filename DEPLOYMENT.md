# Deployment Guide for NaijaXch

## Production Setup (Current)

NaijaXch is deployed on a **DigitalOcean Droplet** with automatic deployments via GitHub Actions.

- **Server:** DigitalOcean Droplet (1 GB / 25 GB / LON1 - Ubuntu 24.04)
- **Domain:** naijaxch.com
- **Stack:** Docker Compose (backend, frontend, PostgreSQL, Redis, Caddy)
- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`)

### How Deployments Work

1. Push code to `master` branch
2. GitHub Actions automatically SSHs into the droplet
3. Pulls latest code and rebuilds the backend container
4. Zero-downtime for database, Redis, frontend, and Caddy

### Required GitHub Secrets

These are configured in **GitHub repo > Settings > Secrets and variables > Actions**:

| Secret | Description |
|--------|-------------|
| `DO_HOST` | Droplet IP address |
| `DO_USERNAME` | SSH user (e.g. `root`) |
| `DO_SSH_KEY` | Private SSH key for the droplet |
| `PROJECT_PATH` | Project path on server (e.g. `/root/naijaxch`) |

---

## Local Development

### Prerequisites
- Docker and Docker Compose installed
- Domain name (for production)
- Paystack account for payments
- Resend account for emails (optional)

### 1. Clone and Configure

```bash
git clone git@github.com:Rapidmax01/naijaxch.git
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
docker compose up -d --build

# Check logs
docker compose logs -f

# Run database migrations
docker compose exec backend alembic upgrade head
```

### 4. Access the App

- Frontend: http://localhost (or your domain)
- API Docs: http://localhost:8000/api/docs
- Health Check: http://localhost:8000/health

---

## Manual Deployment

If you need to deploy manually (e.g. GitHub Actions is down):

```bash
ssh root@178.62.63.169
cd /root/naijaxch
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build backend
```

To rebuild all services:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Database Migrations

```bash
# Generate a new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker compose exec backend alembic upgrade head

# Rollback one migration
docker compose exec backend alembic downgrade -1
```

---

## Monitoring

### Health Checks
- Backend: `GET /health`
- Database: Automatic healthcheck in docker-compose

### Logs
```bash
# All logs
docker compose logs -f

# Specific service
docker compose logs -f backend
```

---

## SSL/HTTPS

Production uses **Caddy** for automatic HTTPS (configured in `Caddyfile`). Caddy handles Let's Encrypt certificate provisioning and renewal automatically.

---

## Architecture

```
                    ┌──────────┐
                    │  Caddy   │ :80/:443
                    └────┬─────┘
                    ┌────┴─────┐
              ┌─────┤          ├─────┐
              │     └──────────┘     │
        ┌─────▼────┐          ┌──────▼───┐
        │ Frontend │          │ Backend  │ :8000
        │  (Nginx) │          │ (FastAPI)│
        └──────────┘          └────┬─────┘
                              ┌────┴─────┐
                        ┌─────┤          ├─────┐
                        │     └──────────┘     │
                  ┌─────▼────┐          ┌──────▼───┐
                  │ Postgres │          │  Redis   │
                  │   :5432  │          │  :6379   │
                  └──────────┘          └──────────┘
```

---

## Support

- Issues: https://github.com/Rapidmax01/naijaxch/issues
- Email: support@naijaxch.com
