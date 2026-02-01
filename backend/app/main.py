from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging

from app.config import settings
from app.api.v1.router import api_router
from app.core.database import engine, Base, SessionLocal
from app.services.arbscanner.price_service import PriceService

logger = logging.getLogger(__name__)

# Background task control
background_tasks = set()


async def price_refresh_task():
    """Background task to refresh prices every minute."""
    while True:
        try:
            db = SessionLocal()
            price_service = PriceService(db)

            # Fetch prices for all cryptos
            for crypto in ["USDT", "BTC", "ETH"]:
                try:
                    prices = await price_service.fetch_all_prices(crypto)
                    logger.info(f"Refreshed {crypto} prices from {len(prices)} exchanges")
                except Exception as e:
                    logger.error(f"Error fetching {crypto} prices: {e}")

            db.close()
        except Exception as e:
            logger.error(f"Price refresh error: {e}")

        # Wait 60 seconds before next refresh
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    # Create database tables (in production, use Alembic migrations)
    Base.metadata.create_all(bind=engine)

    # Start background price refresh task
    task = asyncio.create_task(price_refresh_task())
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)
    logger.info("Started background price refresh task")

    yield

    # Shutdown - cancel background tasks
    for task in background_tasks:
        task.cancel()
    logger.info("Stopped background tasks")


app = FastAPI(
    title=settings.APP_NAME,
    description="Nigerian Trading Tools API - Crypto Arbitrage Scanner & NGX Stock Screener",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/api/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
