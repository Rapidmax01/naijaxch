# Naija Trading Tools

A Nigerian trading SaaS platform with two products:

1. **ArbScanner** - Crypto arbitrage opportunity finder
2. **NGX Radar** - Nigerian stock market screener (Coming Soon)

## Features

### ArbScanner
- Real-time price monitoring across Nigerian crypto exchanges
- Automatic arbitrage opportunity detection
- Fee-adjusted profit calculations
- Telegram alerts for opportunities
- Arbitrage calculator

### Supported Exchanges
- Binance P2P
- Quidax
- Luno
- (More coming soon)

## Tech Stack

- **Backend**: FastAPI, PostgreSQL, Redis, Celery
- **Frontend**: React, TypeScript, Tailwind CSS, React Query
- **Scraping**: httpx, BeautifulSoup
- **Deployment**: Docker, Docker Compose

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Clone and setup environment**
```bash
cd naija-trading-tools
cp .env.example .env
# Edit .env with your configuration
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **Start Celery Workers** (for background tasks)
```bash
# In a new terminal
cd backend
source venv/bin/activate
celery -A app.tasks.celery_app worker -l info

# In another terminal (for scheduled tasks)
celery -A app.tasks.celery_app beat -l info
```

### Using Docker

```bash
docker-compose up -d
```

Access the app at:
- Frontend: http://localhost:5173
- API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### ArbScanner
- `GET /api/v1/arb/prices` - Get all exchange prices
- `GET /api/v1/arb/opportunities` - Get arbitrage opportunities
- `POST /api/v1/arb/calculate` - Calculate specific trade
- `GET /api/v1/arb/exchanges` - List supported exchanges
- `GET /api/v1/arb/fees` - Get fee structure
- `GET /api/v1/arb/alerts` - User alerts (auth required)
- `POST /api/v1/arb/alerts` - Create alert

## Project Structure

```
naija-trading-tools/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/            # Core utilities
│   │   ├── models/          # Database models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── scrapers/        # Exchange scrapers
│   │   ├── services/        # Business logic
│   │   └── tasks/           # Celery tasks
│   ├── alembic/             # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Zustand stores
│   │   └── types/           # TypeScript types
│   └── package.json
└── docker-compose.yml
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT

## Support

For support, email support@naijatradetools.com or open an issue on GitHub.
