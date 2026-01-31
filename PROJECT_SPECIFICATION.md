# Naija Trading Tools - Complete Project Specification
## Crypto Arbitrage Scanner + NGX Stock Screener

---

## PROJECT OVERVIEW

**Company Name:** NaijaTrade Tools (or TradeRadar Nigeria)
**Products:**
1. **ArbScanner** - Crypto arbitrage opportunity finder
2. **NGX Radar** - Nigerian stock market screener

**Target Market:** Nigerian traders and investors
**Business Model:** Freemium SaaS (subscription-based)
**Initial Budget:** $5,000-10,000
**Timeline:** 8-12 weeks for both MVPs

---

## PRODUCT 1: ARBSCANNER (Crypto Arbitrage Scanner)

### Problem Statement
Nigerian crypto traders manually check 5-10 exchanges to find price differences for arbitrage. This is:
- Time-consuming (30-60 minutes per scan)
- Error-prone (manual calculations)
- Slow (opportunities disappear in seconds)
- Incomplete (can't monitor all exchanges simultaneously)

### Solution
Real-time arbitrage scanner that:
- Monitors all Nigerian-relevant crypto exchanges
- Calculates profit after ALL fees automatically
- Sends instant alerts via Telegram
- Shows volume/liquidity availability
- Tracks historical opportunities

### Target Users
- P2P arbitrage traders (buy low on one platform, sell high on another)
- Crypto enthusiasts looking for quick profits
- Trading groups/communities
- Professional arbitrageurs

### Exchanges to Monitor

#### Phase 1 (MVP)
| Exchange | Type | Data Method | Priority |
|----------|------|-------------|----------|
| Binance P2P | P2P | Web scraping | High |
| Bybit P2P | P2P | API + Scraping | High |
| Quidax | Exchange | REST API | High |
| Luno | Exchange | REST API | High |
| Yellow Card | Exchange | REST API | Medium |

#### Phase 2 (Post-Launch)
| Exchange | Type | Data Method |
|----------|------|-------------|
| Kucoin P2P | P2P | Scraping |
| OKX P2P | P2P | Scraping |
| Paxful | P2P | Scraping |
| Remitano | P2P | Scraping |
| Roqqu | Exchange | API |
| Patricia | Exchange | Scraping |

### Cryptocurrencies to Track
| Phase 1 | Phase 2 |
|---------|---------|
| USDT | SOL |
| BTC | BNB |
| ETH | XRP |
| | USDC |

### Core Features (MVP)

#### 1. Live Price Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│  ARBSCANNER - Live Crypto Prices (NGN)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  USDT/NGN                                        Updated: Now   │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │ Exchange    │ Buy (₦)     │ Sell (₦)    │ Spread      │     │
│  ├─────────────┼─────────────┼─────────────┼─────────────┤     │
│  │ Binance P2P │ 1,580       │ 1,595       │ 0.95%       │     │
│  │ Bybit P2P   │ 1,575       │ 1,590       │ 0.95%       │     │
│  │ Quidax      │ 1,590       │ 1,610       │ 1.26%       │     │
│  │ Luno        │ 1,585       │ 1,605       │ 1.26%       │     │
│  │ Yellow Card │ 1,588       │ 1,608       │ 1.26%       │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
│                                                                 │
│  🔥 ARBITRAGE OPPORTUNITIES                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Buy USDT on Bybit P2P @ ₦1,575                          │   │
│  │ Sell USDT on Quidax @ ₦1,610                            │   │
│  │ Gross Profit: ₦35 (2.22%)                               │   │
│  │ Fees: ~₦8 (0.5%)                                        │   │
│  │ NET PROFIT: ₦27 (1.71%) ✅                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Arbitrage Calculator
- Input: Amount to trade (₦)
- Output: 
  - Best buy exchange
  - Best sell exchange
  - Gross profit
  - All fees (trading, withdrawal, network)
  - Net profit
  - ROI percentage
  - Estimated time to complete

#### 3. Fee Database
Maintain accurate fee structure for all exchanges:
```json
{
  "binance_p2p": {
    "trading_fee": 0,
    "withdrawal_fee_usdt_trc20": 1,
    "withdrawal_fee_usdt_bep20": 0.29,
    "withdrawal_fee_btc": 0.0000012,
    "ngn_deposit_fee": 0,
    "ngn_withdrawal_fee": 0
  },
  "quidax": {
    "trading_fee_percent": 0.5,
    "withdrawal_fee_usdt": 2,
    "ngn_deposit_fee": 0,
    "ngn_withdrawal_fee_percent": 0.5
  }
}
```

#### 4. Telegram Bot Alerts
```
🚨 ARBITRAGE ALERT 🚨

💰 Opportunity Found!

Buy: USDT on Bybit P2P
Price: ₦1,575

Sell: USDT on Quidax  
Price: ₦1,610

📊 Analysis:
• Spread: ₦35 (2.22%)
• Est. Fees: ₦8
• Net Profit: ₦27 (1.71%)
• Min Trade: ₦50,000
• Max Trade: ₦500,000

⏰ Alert Time: 2:34 PM WAT
🔗 Trade Now: [Links to both exchanges]

---
ArbScanner Pro | arbscanner.ng
```

#### 5. Historical Opportunities
- Log all opportunities detected
- Show which were profitable
- Calculate average daily opportunities
- Best times for arbitrage

### Premium Features

| Feature | Free | Starter | Pro | Business |
|---------|------|---------|-----|----------|
| Price refresh rate | 15 min | 5 min | Real-time | Real-time |
| Alerts per day | 3 | 20 | Unlimited | Unlimited |
| Exchanges | 3 | 5 | All | All |
| Cryptocurrencies | USDT only | USDT, BTC | All | All |
| Historical data | 24 hours | 7 days | 30 days | Unlimited |
| API access | ❌ | ❌ | ✅ | ✅ |
| WhatsApp alerts | ❌ | ❌ | ✅ | ✅ |
| Custom thresholds | ❌ | ✅ | ✅ | ✅ |
| Multi-user | ❌ | ❌ | ❌ | 5 users |
| Priority support | ❌ | ❌ | ✅ | ✅ |

### Pricing (NGN)

| Tier | Monthly | Quarterly | Yearly |
|------|---------|-----------|--------|
| Free | ₦0 | - | - |
| Starter | ₦3,000 | ₦7,500 | ₦27,000 |
| Pro | ₦10,000 | ₦25,000 | ₦90,000 |
| Business | ₦30,000 | ₦75,000 | ₦270,000 |

---

## PRODUCT 2: NGX RADAR (Nigerian Stock Screener)

### Problem Statement
Nigerian stock investors have no good tools:
- NGX website is slow and hard to navigate
- No screening/filtering capabilities
- No technical analysis tools
- No price alerts
- International tools (TradingView, Yahoo Finance) don't cover NGX properly

### Solution
"The TradingView for Nigerian Stocks" - a comprehensive stock screening and analysis platform for NGX-listed companies.

### Target Users
- Retail investors
- Stock traders
- Investment clubs
- Financial advisors
- Stockbrokers (B2B)

### Data Sources

| Data Type | Source | Method | Frequency |
|-----------|--------|--------|-----------|
| Stock prices | NGX website | Scraping | Daily 3PM WAT |
| Company info | NGX website | Scraping | Weekly |
| Financials | NGX/SEC filings | PDF parsing | Quarterly |
| Dividends | NGX announcements | Scraping | As announced |
| News | BusinessDay, Nairametrics | RSS feeds | Hourly |
| Insider trading | SEC Nigeria | Scraping | Daily |

### Stocks to Cover

#### Phase 1 (Top 50 by Market Cap)
- Banking: GTCO, Zenith, Access, UBA, FBN, Stanbic, FCMB, Fidelity
- Consumer: Nestle, Nigerian Breweries, Unilever, Dangote Sugar, Flour Mills
- Industrial: Dangote Cement, BUA Cement, Lafarge
- Oil & Gas: Seplat, Oando, Total, Conoil
- Telecom: MTNN, Airtel
- Others: Presco, Okomu, Transcorp, etc.

#### Phase 2 (All ~160 listed stocks)

### Core Features (MVP)

#### 1. Stock Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│  NGX RADAR - Nigerian Stock Market                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Market Summary (Jan 30, 2026)                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ NGX ASI: 98,456.23  ▲ +1.2%  │  Volume: 342M  │ Trades: 5.2K│
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🔥 Top Gainers          📉 Top Losers           📊 Most Active │
│  ┌────────────────────┐ ┌────────────────────┐ ┌──────────────┐│
│  │ MTNN    ▲ +9.8%    │ │ OANDO   ▼ -4.2%   │ │ GTCO   45M   ││
│  │ DANGCEM ▲ +5.2%    │ │ PRESCO  ▼ -3.1%   │ │ ZENITH 38M   ││
│  │ GTCO    ▲ +4.1%    │ │ FCMB    ▼ -2.8%   │ │ ACCESS 32M   ││
│  │ ZENITH  ▲ +3.8%    │ │ FIDELITY▼ -2.1%   │ │ UBA    28M   ││
│  └────────────────────┘ └────────────────────┘ └──────────────┘│
│                                                                 │
│  📋 Your Watchlist                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Symbol │ Price    │ Change  │ Volume │ P/E   │ Div Yield │  │
│  ├────────┼──────────┼─────────┼────────┼───────┼───────────┤  │
│  │ GTCO   │ ₦45.20   │ +4.1%   │ 45M    │ 3.2   │ 8.5%      │  │
│  │ DANGCEM│ ₦290.00  │ +5.2%   │ 12M    │ 12.4  │ 4.2%      │  │
│  │ MTNN   │ ₦198.50  │ +9.8%   │ 8M     │ 15.8  │ 5.1%      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Stock Screener
Filter stocks by:

**Fundamental Filters:**
- Price range (₦)
- Market cap
- P/E ratio
- Dividend yield
- EPS
- Book value
- Debt/Equity ratio
- Revenue growth
- Profit margin

**Technical Filters:**
- Price vs 50-day MA
- Price vs 200-day MA
- RSI (overbought/oversold)
- 52-week high/low
- Volume vs average

**Sector Filters:**
- Banking
- Consumer Goods
- Industrial
- Oil & Gas
- Agriculture
- Insurance
- Healthcare

#### 3. Stock Detail Page
```
┌─────────────────────────────────────────────────────────────────┐
│  GTCO - Guaranty Trust Holding Company                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Price: ₦45.20  ▲ +4.1% (+₦1.80)                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    [PRICE CHART]                          │  │
│  │                    1D | 1W | 1M | 3M | 1Y | ALL           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Key Statistics                                                 │
│  ┌────────────────────────┬─────────────────────────────────┐  │
│  │ Market Cap: ₦1.33T     │ 52W High: ₦52.00               │  │
│  │ P/E Ratio: 3.2         │ 52W Low: ₦28.50                │  │
│  │ EPS: ₦14.12            │ Avg Volume: 35M                │  │
│  │ Dividend Yield: 8.5%   │ Beta: 1.2                      │  │
│  │ Book Value: ₦42.50     │ Shares Out: 29.4B              │  │
│  └────────────────────────┴─────────────────────────────────┘  │
│                                                                 │
│  📰 Recent News                                                 │
│  • GTCO reports 25% profit growth in Q3 2025                   │
│  • Analysts upgrade GTCO to "Strong Buy"                       │
│  • GTCO declares ₦3.00 interim dividend                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4. Price Alerts
- Set target price (above/below)
- Get notified via Email/Telegram
- One-time or recurring alerts

#### 5. Dividend Calendar
```
┌─────────────────────────────────────────────────────────────────┐
│  Upcoming Dividends                                             │
├─────────────────────────────────────────────────────────────────┤
│  Symbol │ Type      │ Amount  │ Qualification │ Payment Date   │
│  ───────┼───────────┼─────────┼───────────────┼────────────────│
│  GTCO   │ Interim   │ ₦3.00   │ Feb 15, 2026  │ Mar 10, 2026   │
│  ZENITH │ Final     │ ₦3.50   │ Mar 01, 2026  │ Apr 05, 2026   │
│  MTNN   │ Interim   │ ₦5.25   │ Feb 20, 2026  │ Mar 15, 2026   │
└─────────────────────────────────────────────────────────────────┘
```

### Premium Features

| Feature | Free | Basic | Pro | Investor |
|---------|------|-------|-----|----------|
| Watchlist stocks | 5 | 20 | Unlimited | Unlimited |
| Screener access | Basic | Full | Full | Full |
| Price alerts | 2 | 10 | Unlimited | Unlimited |
| Historical data | 1 month | 1 year | 5 years | 10 years |
| Technical indicators | ❌ | Basic | All | All |
| Dividend calendar | ❌ | ✅ | ✅ | ✅ |
| Insider trading | ❌ | ❌ | ✅ | ✅ |
| Portfolio tracker | ❌ | ❌ | ✅ | ✅ |
| Export data | ❌ | ❌ | CSV | CSV + API |
| News alerts | ❌ | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ | ✅ |

### Pricing (NGN)

| Tier | Monthly | Quarterly | Yearly |
|------|---------|-----------|--------|
| Free | ₦0 | - | - |
| Basic | ₦2,500 | ₦6,000 | ₦22,500 |
| Pro | ₦7,500 | ₦18,000 | ₦67,500 |
| Investor | ₦15,000 | ₦36,000 | ₦135,000 |

---

## TECHNICAL ARCHITECTURE

### System Overview

```
                                    USERS
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              ┌──────────┐      ┌──────────┐      ┌──────────┐
              │   Web    │      │ Telegram │      │  Mobile  │
              │   App    │      │   Bot    │      │   App    │
              └────┬─────┘      └────┬─────┘      └────┬─────┘
                   │                 │                 │
                   └─────────────────┼─────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │    CLOUDFLARE       │
                          │   (CDN + Security)  │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │    LOAD BALANCER    │
                          │      (Nginx)        │
                          └──────────┬──────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
       ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
       │  API Server │        │  API Server │        │  WebSocket  │
       │  (FastAPI)  │        │  (FastAPI)  │        │   Server    │
       └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
              │                      │                      │
              └──────────────────────┼──────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
             ┌───────────┐    ┌───────────┐    ┌───────────┐
             │  Redis    │    │ PostgreSQL│    │TimescaleDB│
             │  (Cache)  │    │  (Main)   │    │ (Prices)  │
             └───────────┘    └───────────┘    └───────────┘

                          DATA COLLECTION LAYER
              ┌──────────────────────────────────────────┐
              │              CELERY WORKERS              │
              ├──────────┬──────────┬──────────┬─────────┤
              │ Binance  │  Bybit   │  Quidax  │  Luno   │
              │ Scraper  │ Scraper  │   API    │   API   │
              └──────────┴──────────┴──────────┴─────────┘
              ┌──────────┬──────────┬──────────┐
              │   NGX    │   SEC    │   News   │
              │ Scraper  │ Scraper  │  Fetcher │
              └──────────┴──────────┴──────────┘
```

### Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| **Frontend** | React 18 + TypeScript | Modern, fast, SEO with Next.js option |
| **Styling** | Tailwind CSS | Rapid development |
| **Charts** | Recharts + TradingView Widget | Professional charts |
| **State** | Zustand | Lightweight, simple |
| **API Client** | React Query | Caching, auto-refresh |
| **Backend** | Python FastAPI | Fast, async, type hints |
| **Database** | PostgreSQL | Reliable, JSONB support |
| **Time Series** | TimescaleDB | Optimized for price data |
| **Cache** | Redis | Real-time data, sessions |
| **Queue** | Celery + Redis | Background jobs |
| **Scraping** | Playwright | JavaScript rendering |
| **Bot** | python-telegram-bot | Telegram integration |
| **Auth** | JWT + Refresh Tokens | Stateless, secure |
| **Payments** | Paystack | Nigerian payments |
| **Email** | Resend or Brevo | Transactional emails |
| **Hosting** | Hetzner/Railway | Cost-effective |
| **CDN** | Cloudflare | Free, DDoS protection |

---

## PROJECT STRUCTURE

```
naija-trading-tools/
├── README.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
│
├── backend/
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   │
│   │   │   │   ├── arbscanner/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── prices.py
│   │   │   │   │   ├── opportunities.py
│   │   │   │   │   ├── alerts.py
│   │   │   │   │   └── history.py
│   │   │   │   │
│   │   │   │   ├── ngxradar/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── stocks.py
│   │   │   │   │   ├── screener.py
│   │   │   │   │   ├── watchlist.py
│   │   │   │   │   ├── alerts.py
│   │   │   │   │   ├── dividends.py
│   │   │   │   │   └── news.py
│   │   │   │   │
│   │   │   │   ├── subscriptions.py
│   │   │   │   └── webhooks.py
│   │   │
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── security.py
│   │   │   ├── database.py
│   │   │   ├── redis.py
│   │   │   └── exceptions.py
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── subscription.py
│   │   │   │
│   │   │   ├── arbscanner/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── exchange.py
│   │   │   │   ├── price.py
│   │   │   │   ├── opportunity.py
│   │   │   │   └── alert.py
│   │   │   │
│   │   │   └── ngxradar/
│   │   │       ├── __init__.py
│   │   │       ├── stock.py
│   │   │       ├── price.py
│   │   │       ├── financial.py
│   │   │       ├── dividend.py
│   │   │       ├── watchlist.py
│   │   │       └── alert.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── subscription.py
│   │   │   ├── arbscanner.py
│   │   │   └── ngxradar.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── email.py
│   │   │   ├── payment.py
│   │   │   │
│   │   │   ├── arbscanner/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── price_aggregator.py
│   │   │   │   ├── arbitrage_calculator.py
│   │   │   │   ├── alert_service.py
│   │   │   │   └── fee_calculator.py
│   │   │   │
│   │   │   └── ngxradar/
│   │   │       ├── __init__.py
│   │   │       ├── stock_service.py
│   │   │       ├── screener_service.py
│   │   │       ├── technical_analysis.py
│   │   │       └── alert_service.py
│   │   │
│   │   ├── scrapers/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   │
│   │   │   ├── crypto/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── binance_p2p.py
│   │   │   │   ├── bybit_p2p.py
│   │   │   │   ├── quidax.py
│   │   │   │   ├── luno.py
│   │   │   │   └── yellowcard.py
│   │   │   │
│   │   │   └── stocks/
│   │   │       ├── __init__.py
│   │   │       ├── ngx.py
│   │   │       ├── sec_nigeria.py
│   │   │       └── news.py
│   │   │
│   │   ├── tasks/
│   │   │   ├── __init__.py
│   │   │   ├── celery_app.py
│   │   │   ├── crypto_tasks.py
│   │   │   ├── stock_tasks.py
│   │   │   └── alert_tasks.py
│   │   │
│   │   ├── data/
│   │   │   ├── exchanges.json
│   │   │   ├── fees.json
│   │   │   ├── ngx_stocks.json
│   │   │   └── sectors.json
│   │   │
│   │   └── telegram_bot/
│   │       ├── __init__.py
│   │       ├── bot.py
│   │       ├── handlers/
│   │       │   ├── __init__.py
│   │       │   ├── start.py
│   │       │   ├── prices.py
│   │       │   ├── alerts.py
│   │       │   └── account.py
│   │       └── keyboards.py
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_arbscanner.py
│   │   └── test_ngxradar.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic.ini
│
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   └── assets/
│   │
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   └── Toast.tsx
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Layout.tsx
│   │   │   │
│   │   │   ├── arbscanner/
│   │   │   │   ├── PriceGrid.tsx
│   │   │   │   ├── OpportunityCard.tsx
│   │   │   │   ├── ArbitrageCalculator.tsx
│   │   │   │   ├── ExchangeSelector.tsx
│   │   │   │   ├── AlertConfig.tsx
│   │   │   │   └── HistoryTable.tsx
│   │   │   │
│   │   │   ├── ngxradar/
│   │   │   │   ├── MarketSummary.tsx
│   │   │   │   ├── StockTable.tsx
│   │   │   │   ├── StockChart.tsx
│   │   │   │   ├── Screener.tsx
│   │   │   │   ├── WatchlistWidget.tsx
│   │   │   │   ├── DividendCalendar.tsx
│   │   │   │   ├── NewsWidget.tsx
│   │   │   │   └── AlertConfig.tsx
│   │   │   │
│   │   │   └── common/
│   │   │       ├── PriceChange.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── ErrorBoundary.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Pricing.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   │
│   │   │   ├── arbscanner/
│   │   │   │   ├── ArbDashboard.tsx
│   │   │   │   ├── Opportunities.tsx
│   │   │   │   ├── Calculator.tsx
│   │   │   │   ├── Alerts.tsx
│   │   │   │   └── History.tsx
│   │   │   │
│   │   │   ├── ngxradar/
│   │   │   │   ├── NGXDashboard.tsx
│   │   │   │   ├── Screener.tsx
│   │   │   │   ├── StockDetail.tsx
│   │   │   │   ├── Watchlist.tsx
│   │   │   │   ├── Dividends.tsx
│   │   │   │   └── Alerts.tsx
│   │   │   │
│   │   │   ├── Account.tsx
│   │   │   ├── Subscription.tsx
│   │   │   └── NotFound.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── usePrices.ts
│   │   │   ├── useStocks.ts
│   │   │   ├── useAlerts.ts
│   │   │   └── useSubscription.ts
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── arbscanner.ts
│   │   │   ├── ngxradar.ts
│   │   │   └── subscription.ts
│   │   │
│   │   ├── store/
│   │   │   ├── index.ts
│   │   │   ├── authStore.ts
│   │   │   ├── priceStore.ts
│   │   │   └── settingsStore.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── calculations.ts
│   │   │
│   │   └── types/
│   │       ├── index.ts
│   │       ├── arbscanner.ts
│   │       └── ngxradar.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── telegram-bot/
│   ├── bot.py
│   ├── handlers/
│   ├── requirements.txt
│   └── Dockerfile
│
└── docs/
    ├── API.md
    ├── DEPLOYMENT.md
    └── SCRAPING.md
```

---

## DATABASE SCHEMA

### Users & Auth

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    telegram_chat_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product VARCHAR(20) NOT NULL CHECK (product IN ('arbscanner', 'ngxradar', 'bundle')),
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'starter', 'basic', 'pro', 'business', 'investor')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
    price_ngn DECIMAL(10,2),
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    paystack_subscription_code VARCHAR(100),
    paystack_customer_code VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    subscription_id UUID REFERENCES subscriptions(id),
    amount_ngn DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    paystack_reference VARCHAR(100) UNIQUE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ArbScanner Tables

```sql
-- Exchanges
CREATE TABLE exchanges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('p2p', 'exchange')),
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exchange Fees
CREATE TABLE exchange_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id UUID REFERENCES exchanges(id),
    crypto VARCHAR(10) NOT NULL,
    network VARCHAR(20),
    trading_fee_percent DECIMAL(5,4) DEFAULT 0,
    withdrawal_fee DECIMAL(20,8) DEFAULT 0,
    deposit_fee DECIMAL(20,8) DEFAULT 0,
    min_withdrawal DECIMAL(20,8),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exchange_id, crypto, network)
);

-- Crypto Prices (TimescaleDB hypertable)
CREATE TABLE crypto_prices (
    time TIMESTAMPTZ NOT NULL,
    exchange_id UUID REFERENCES exchanges(id),
    crypto VARCHAR(10) NOT NULL,
    fiat VARCHAR(10) DEFAULT 'NGN',
    buy_price DECIMAL(20,2),
    sell_price DECIMAL(20,2),
    volume_24h DECIMAL(20,2),
    PRIMARY KEY (time, exchange_id, crypto)
);
SELECT create_hypertable('crypto_prices', 'time');

-- Arbitrage Opportunities
CREATE TABLE arbitrage_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crypto VARCHAR(10) NOT NULL,
    buy_exchange_id UUID REFERENCES exchanges(id),
    sell_exchange_id UUID REFERENCES exchanges(id),
    buy_price DECIMAL(20,2) NOT NULL,
    sell_price DECIMAL(20,2) NOT NULL,
    spread_percent DECIMAL(10,4) NOT NULL,
    estimated_fees DECIMAL(20,2),
    net_profit_percent DECIMAL(10,4),
    min_trade_amount DECIMAL(20,2),
    max_trade_amount DECIMAL(20,2),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- User Alerts (ArbScanner)
CREATE TABLE arb_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crypto VARCHAR(10),
    min_spread_percent DECIMAL(5,2) DEFAULT 1.0,
    buy_exchanges UUID[],
    sell_exchanges UUID[],
    is_active BOOLEAN DEFAULT TRUE,
    notify_telegram BOOLEAN DEFAULT TRUE,
    notify_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### NGX Radar Tables

```sql
-- Stocks
CREATE TABLE stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap DECIMAL(20,2),
    shares_outstanding BIGINT,
    listing_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Prices (TimescaleDB hypertable)
CREATE TABLE stock_prices (
    time DATE NOT NULL,
    stock_id UUID REFERENCES stocks(id),
    open_price DECIMAL(20,2),
    high_price DECIMAL(20,2),
    low_price DECIMAL(20,2),
    close_price DECIMAL(20,2),
    volume BIGINT,
    trades INTEGER,
    PRIMARY KEY (time, stock_id)
);
SELECT create_hypertable('stock_prices', 'time');

-- Stock Financials
CREATE TABLE stock_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID REFERENCES stocks(id),
    period_end DATE NOT NULL,
    period_type VARCHAR(20) CHECK (period_type IN ('Q1', 'Q2', 'Q3', 'Q4', 'FY')),
    revenue DECIMAL(20,2),
    net_income DECIMAL(20,2),
    eps DECIMAL(10,4),
    total_assets DECIMAL(20,2),
    total_liabilities DECIMAL(20,2),
    book_value_per_share DECIMAL(10,4),
    pe_ratio DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, period_end, period_type)
);

-- Dividends
CREATE TABLE dividends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID REFERENCES stocks(id),
    dividend_type VARCHAR(20) CHECK (dividend_type IN ('interim', 'final', 'special')),
    amount_per_share DECIMAL(10,4) NOT NULL,
    qualification_date DATE,
    closure_date DATE,
    payment_date DATE,
    year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Watchlists
CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT 'My Watchlist',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Watchlist Items
CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE,
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(watchlist_id, stock_id)
);

-- Stock Alerts
CREATE TABLE stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) CHECK (alert_type IN ('price_above', 'price_below', 'percent_change', 'volume')),
    target_value DECIMAL(20,4) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_triggered BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMP,
    notify_telegram BOOLEAN DEFAULT TRUE,
    notify_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News
CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    source VARCHAR(100),
    url VARCHAR(500),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News Stock Relations
CREATE TABLE news_stocks (
    news_id UUID REFERENCES news(id) ON DELETE CASCADE,
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    PRIMARY KEY (news_id, stock_id)
);
```

---

## API ENDPOINTS

### Authentication
```
POST   /api/v1/auth/register           - Register new user
POST   /api/v1/auth/login              - Login
POST   /api/v1/auth/logout             - Logout
POST   /api/v1/auth/refresh            - Refresh token
POST   /api/v1/auth/verify-email       - Verify email
POST   /api/v1/auth/forgot-password    - Request password reset
POST   /api/v1/auth/reset-password     - Reset password
GET    /api/v1/auth/me                 - Get current user
PUT    /api/v1/auth/me                 - Update profile
POST   /api/v1/auth/telegram/link      - Link Telegram account
```

### ArbScanner
```
GET    /api/v1/arb/prices              - Get all current prices
GET    /api/v1/arb/prices/:crypto      - Get prices for specific crypto
GET    /api/v1/arb/opportunities       - Get current opportunities
GET    /api/v1/arb/opportunities/:id   - Get opportunity details
POST   /api/v1/arb/calculate           - Calculate arbitrage
GET    /api/v1/arb/exchanges           - List exchanges
GET    /api/v1/arb/fees                - Get fee structure
GET    /api/v1/arb/history             - Get historical opportunities
GET    /api/v1/arb/alerts              - List user alerts
POST   /api/v1/arb/alerts              - Create alert
PUT    /api/v1/arb/alerts/:id          - Update alert
DELETE /api/v1/arb/alerts/:id          - Delete alert
```

### NGX Radar
```
GET    /api/v1/ngx/market              - Market summary
GET    /api/v1/ngx/stocks              - List all stocks
GET    /api/v1/ngx/stocks/:symbol      - Stock details
GET    /api/v1/ngx/stocks/:symbol/prices   - Historical prices
GET    /api/v1/ngx/stocks/:symbol/financials - Company financials
GET    /api/v1/ngx/screener            - Screen stocks
GET    /api/v1/ngx/gainers             - Top gainers
GET    /api/v1/ngx/losers              - Top losers
GET    /api/v1/ngx/active              - Most active
GET    /api/v1/ngx/dividends           - Dividend calendar
GET    /api/v1/ngx/news                - Market news
GET    /api/v1/ngx/watchlists          - User watchlists
POST   /api/v1/ngx/watchlists          - Create watchlist
PUT    /api/v1/ngx/watchlists/:id      - Update watchlist
DELETE /api/v1/ngx/watchlists/:id      - Delete watchlist
POST   /api/v1/ngx/watchlists/:id/stocks - Add stock to watchlist
DELETE /api/v1/ngx/watchlists/:id/stocks/:symbol - Remove stock
GET    /api/v1/ngx/alerts              - List stock alerts
POST   /api/v1/ngx/alerts              - Create alert
DELETE /api/v1/ngx/alerts/:id          - Delete alert
```

### Subscriptions
```
GET    /api/v1/subscriptions/plans     - List plans
GET    /api/v1/subscriptions/current   - Current subscription
POST   /api/v1/subscriptions/checkout  - Create payment
POST   /api/v1/subscriptions/verify    - Verify payment
POST   /api/v1/subscriptions/cancel    - Cancel subscription
POST   /api/v1/webhooks/paystack       - Paystack webhook
```

---

## ENVIRONMENT VARIABLES

```env
# Application
APP_NAME=NaijaTrade
APP_ENV=development
DEBUG=true
SECRET_KEY=your-super-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/naijatradetools
REDIS_URL=redis://localhost:6379

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxx

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-xxxxx
TELEGRAM_WEBHOOK_URL=https://api.yourdomain.com/telegram/webhook

# Email (Resend)
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=hello@naijatradetools.com

# Scraping
PROXY_URL=http://proxy:port
SCRAPER_USER_AGENT=Mozilla/5.0...

# Exchange APIs (where available)
QUIDAX_API_KEY=xxxxx
QUIDAX_API_SECRET=xxxxx
LUNO_API_KEY=xxxxx
LUNO_API_SECRET=xxxxx

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (monorepo structure)
- [ ] Database schema + migrations
- [ ] User authentication (register, login, JWT)
- [ ] Basic API structure
- [ ] Frontend skeleton with routing
- [ ] Docker development environment

### Phase 2: ArbScanner MVP (Week 3-5)
- [ ] Exchange scrapers (Binance P2P, Quidax, Luno)
- [ ] Price aggregation service
- [ ] Arbitrage calculation logic
- [ ] Fee database
- [ ] Real-time price dashboard
- [ ] Basic Telegram bot (prices, alerts)
- [ ] Alert system (create, trigger, notify)

### Phase 3: NGX Radar MVP (Week 6-8)
- [ ] NGX website scraper
- [ ] Stock data pipeline
- [ ] Market summary dashboard
- [ ] Basic screener
- [ ] Watchlist functionality
- [ ] Stock detail pages with charts
- [ ] Price alerts

### Phase 4: Monetization (Week 9-10)
- [ ] Paystack integration
- [ ] Subscription management
- [ ] Plan restrictions/limits
- [ ] Payment webhooks
- [ ] Upgrade flows

### Phase 5: Polish & Launch (Week 11-12)
- [ ] Landing pages
- [ ] Pricing page
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Performance optimization
- [ ] Testing
- [ ] Documentation
- [ ] Deploy to production

---

## HOSTING & INFRASTRUCTURE

### Production Setup

| Service | Provider | Cost/Month |
|---------|----------|------------|
| API Server | Hetzner CX31 (4 vCPU, 8GB) | €9.20 (~$10) |
| Database | Hetzner managed Postgres | €15-20 |
| Redis | Hetzner (on same server) | $0 |
| Worker Server | Hetzner CX21 (2 vCPU, 4GB) | €5.30 (~$6) |
| Frontend | Vercel Free/Pro | $0-20 |
| Domain | Namecheap | $12/year |
| Cloudflare | Free plan | $0 |
| Email (Resend) | Free tier | $0 |
| Monitoring | UptimeRobot + Sentry | $0 |
| **Total** | | **~$40-60/month** |

### Scaling Path
1. Start: Single server ($20/mo)
2. Growth: Separate DB, add workers ($60/mo)
3. Scale: Load balancer, multiple API servers ($150/mo)

---

## REVENUE PROJECTIONS

### ArbScanner
```
Month 3 (Launch):
- 200 free users
- 30 Starter × ₦3,000 = ₦90,000
- 10 Pro × ₦10,000 = ₦100,000
Total: ₦190,000 (~$230/mo)

Month 6:
- 500 free users
- 80 Starter × ₦3,000 = ₦240,000
- 40 Pro × ₦10,000 = ₦400,000
- 5 Business × ₦30,000 = ₦150,000
Total: ₦790,000 (~$950/mo)

Month 12:
- 2,000 free users
- 300 Starter × ₦3,000 = ₦900,000
- 150 Pro × ₦10,000 = ₦1,500,000
- 20 Business × ₦30,000 = ₦600,000
Total: ₦3,000,000 (~$3,600/mo)
```

### NGX Radar
```
Month 3 (Launch):
- 150 free users
- 25 Basic × ₦2,500 = ₦62,500
- 10 Pro × ₦7,500 = ₦75,000
Total: ₦137,500 (~$165/mo)

Month 6:
- 400 free users
- 60 Basic × ₦2,500 = ₦150,000
- 30 Pro × ₦7,500 = ₦225,000
- 5 Investor × ₦15,000 = ₦75,000
Total: ₦450,000 (~$540/mo)

Month 12:
- 1,500 free users
- 200 Basic × ₦2,500 = ₦500,000
- 100 Pro × ₦7,500 = ₦750,000
- 25 Investor × ₦15,000 = ₦375,000
Total: ₦1,625,000 (~$1,950/mo)
```

### Combined Revenue
```
Month 3: ~$400/mo
Month 6: ~$1,500/mo
Month 12: ~$5,500/mo
Month 24: ~$15,000/mo (projected)
```

---

## MARKETING STRATEGY

### Pre-Launch (2 weeks before)
1. Create Twitter/X account (@NaijaTradeTools)
2. Create Telegram channel for updates
3. Build email waitlist
4. Post teaser content on crypto/stock forums

### Launch
1. Product Hunt launch
2. Announce on Nigerian crypto Telegram groups
3. Reddit posts (r/Nigeria, r/CryptoCurrency)
4. Nairaland forum posts
5. Reach out to crypto influencers for reviews

### Ongoing
1. SEO content (blog posts about arbitrage, investing)
2. YouTube tutorials
3. Partner with trading communities
4. Referral program (1 month free for referrals)

---

## SUCCESS METRICS

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Registered Users | 500 | 1,500 | 5,000 |
| Paying Users | 50 | 200 | 800 |
| MRR (₦) | ₦300K | ₦1.2M | ₦4.5M |
| MRR ($) | $360 | $1,440 | $5,400 |
| Churn Rate | <10% | <8% | <5% |
| NPS | >30 | >40 | >50 |

---

This specification is ready for Claude Code implementation. Start with Phase 1 Foundation, then build ArbScanner MVP first (faster time to revenue).
