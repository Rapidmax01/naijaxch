from fastapi import APIRouter

from app.api.v1 import auth, subscriptions, telegram, naira_rates
from app.api.v1.arbscanner import prices, opportunities, alerts
from app.api.v1.ngxradar import stocks, screener, watchlist, alerts as ngx_alerts, dividends

api_router = APIRouter()

# Auth routes
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

# ArbScanner routes
api_router.include_router(
    prices.router,
    prefix="/arb",
    tags=["ArbScanner - Prices"]
)

api_router.include_router(
    opportunities.router,
    prefix="/arb",
    tags=["ArbScanner - Opportunities"]
)

api_router.include_router(
    alerts.router,
    prefix="/arb",
    tags=["ArbScanner - Alerts"]
)

# NGX Radar routes
api_router.include_router(
    stocks.router,
    prefix="/ngx",
    tags=["NGX Radar - Stocks"]
)

api_router.include_router(
    screener.router,
    prefix="/ngx",
    tags=["NGX Radar - Screener"]
)

api_router.include_router(
    watchlist.router,
    prefix="/ngx",
    tags=["NGX Radar - Watchlist"]
)

api_router.include_router(
    ngx_alerts.router,
    prefix="/ngx",
    tags=["NGX Radar - Alerts"]
)

api_router.include_router(
    dividends.router,
    prefix="/ngx",
    tags=["NGX Radar - Dividends"]
)

# Subscription & Payment routes
api_router.include_router(
    subscriptions.router,
    prefix="",
    tags=["Subscriptions & Payments"]
)

# Naira Rates
api_router.include_router(
    naira_rates.router,
    prefix="/naira",
    tags=["Naira Rates"]
)

# Telegram routes
api_router.include_router(
    telegram.router,
    prefix="",
    tags=["Telegram"]
)
