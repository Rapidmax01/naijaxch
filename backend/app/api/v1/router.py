from fastapi import APIRouter

from app.api.v1 import auth, subscriptions, telegram, naira_rates
from app.api.v1 import p2p, portfolio, defi, news, calculator, dca, signals, airdrops
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

# P2P Rate Comparator
api_router.include_router(
    p2p.router,
    prefix="/p2p",
    tags=["P2P Comparator"]
)

# Portfolio Tracker
api_router.include_router(
    portfolio.router,
    prefix="",
    tags=["Portfolio"]
)

# DeFi Yield Finder
api_router.include_router(
    defi.router,
    prefix="/defi",
    tags=["DeFi Yields"]
)

# News Feed
api_router.include_router(
    news.router,
    prefix="/news",
    tags=["News"]
)

# Savings Calculator
api_router.include_router(
    calculator.router,
    prefix="/calculator",
    tags=["Calculator"]
)

# DCA Tracker
api_router.include_router(
    dca.router,
    prefix="/dca",
    tags=["DCA Tracker"]
)

# Trading Signals
api_router.include_router(
    signals.router,
    prefix="",
    tags=["Trading Signals"]
)

# Airdrops
api_router.include_router(
    airdrops.router,
    prefix="",
    tags=["Airdrops"]
)
