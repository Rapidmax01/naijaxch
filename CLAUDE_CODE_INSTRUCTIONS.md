# CLAUDE CODE INSTRUCTIONS
## Naija Trading Tools - Build Guide

---

## OVERVIEW

Build two Nigerian-focused trading SaaS products:
1. **ArbScanner** - Crypto arbitrage opportunity finder
2. **NGX Radar** - Nigerian stock market screener

Target market: Nigerian traders and investors
Tech stack: React + FastAPI + PostgreSQL + Redis

---

## BUILD ORDER (Critical!)

### Step 1: Project Foundation (Do First!)
```bash
# Create project structure
mkdir -p naija-trading-tools/{backend,frontend,telegram-bot,docs}
cd naija-trading-tools

# Initialize backend
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy alembic psycopg2-binary python-jose passlib bcrypt httpx redis celery playwright pydantic pydantic-settings python-telegram-bot

# Initialize frontend
cd ../frontend
npm create vite@latest . -- --template react-ts
npm install tailwindcss postcss autoprefixer @tanstack/react-query zustand react-router-dom recharts axios lucide-react clsx tailwind-merge
```

### Step 2: Database & Auth (Before Features!)
1. Set up PostgreSQL connection
2. Create user model + migrations
3. Implement JWT authentication
4. Create subscription model

### Step 3: ArbScanner MVP
1. Build exchange scrapers (Binance P2P, Quidax, Luno)
2. Price aggregation service
3. Arbitrage calculator
4. API endpoints
5. Frontend dashboard
6. Telegram bot alerts

### Step 4: NGX Radar MVP
1. Build NGX scraper
2. Stock data service
3. Screener logic
4. API endpoints
5. Frontend dashboard
6. Watchlist + alerts

### Step 5: Payments
1. Paystack integration
2. Subscription management
3. Plan restrictions

---

## PRIORITY FILES TO CREATE

### Backend (Create in Order)

```
1. backend/app/main.py
2. backend/app/config.py
3. backend/app/core/database.py
4. backend/app/core/security.py
5. backend/app/models/user.py
6. backend/app/models/subscription.py
7. backend/app/api/v1/auth.py
8. backend/app/scrapers/crypto/binance_p2p.py
9. backend/app/scrapers/crypto/quidax.py
10. backend/app/services/arbscanner/price_aggregator.py
11. backend/app/services/arbscanner/arbitrage_calculator.py
12. backend/app/api/v1/arbscanner/prices.py
13. backend/app/scrapers/stocks/ngx.py
14. backend/app/services/ngxradar/stock_service.py
15. backend/app/api/v1/ngxradar/stocks.py
```

### Frontend (Create in Order)

```
1. frontend/src/main.tsx
2. frontend/src/App.tsx
3. frontend/src/index.css (Tailwind)
4. frontend/src/services/api.ts
5. frontend/src/store/authStore.ts
6. frontend/src/pages/Login.tsx
7. frontend/src/pages/arbscanner/ArbDashboard.tsx
8. frontend/src/components/arbscanner/PriceGrid.tsx
9. frontend/src/components/arbscanner/OpportunityCard.tsx
10. frontend/src/pages/ngxradar/NGXDashboard.tsx
11. frontend/src/components/ngxradar/StockTable.tsx
12. frontend/src/components/ngxradar/Screener.tsx
```

---

## CRITICAL IMPLEMENTATION DETAILS

### 1. Binance P2P Scraper (Most Important)

Binance P2P has no official API. You must scrape the web interface.

```python
# backend/app/scrapers/crypto/binance_p2p.py

import httpx
from typing import List, Dict
import asyncio

class BinanceP2PScraper:
    """
    Scrape Binance P2P for USDT/NGN prices.
    
    Binance P2P API endpoint (unofficial):
    POST https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search
    """
    
    BASE_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
    
    async def get_prices(
        self, 
        crypto: str = "USDT", 
        fiat: str = "NGN",
        trade_type: str = "BUY"  # BUY or SELL
    ) -> List[Dict]:
        """
        Get P2P prices from Binance.
        
        trade_type: 
        - "BUY" = You buy crypto (merchant sells)
        - "SELL" = You sell crypto (merchant buys)
        """
        
        payload = {
            "asset": crypto,
            "fiat": fiat,
            "merchantCheck": True,  # Only verified merchants
            "page": 1,
            "payTypes": ["BANK"],  # Bank transfer
            "publisherType": None,
            "rows": 10,
            "tradeType": trade_type
        }
        
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.BASE_URL,
                json=payload,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_response(data, trade_type)
            else:
                raise Exception(f"Binance P2P error: {response.status_code}")
    
    def _parse_response(self, data: dict, trade_type: str) -> List[Dict]:
        """Parse Binance P2P response."""
        results = []
        
        for ad in data.get("data", []):
            adv = ad.get("adv", {})
            advertiser = ad.get("advertiser", {})
            
            results.append({
                "price": float(adv.get("price", 0)),
                "min_amount": float(adv.get("minSingleTransAmount", 0)),
                "max_amount": float(adv.get("maxSingleTransAmount", 0)),
                "available": float(adv.get("surplusAmount", 0)),
                "merchant": advertiser.get("nickName", "Unknown"),
                "completion_rate": float(advertiser.get("monthFinishRate", 0)) * 100,
                "orders": advertiser.get("monthOrderCount", 0),
                "trade_type": trade_type
            })
        
        return results
    
    async def get_best_prices(self, crypto: str = "USDT", fiat: str = "NGN"):
        """Get best buy and sell prices."""
        
        buy_ads, sell_ads = await asyncio.gather(
            self.get_prices(crypto, fiat, "BUY"),
            self.get_prices(crypto, fiat, "SELL")
        )
        
        # Best buy price (lowest price to buy crypto)
        best_buy = min(buy_ads, key=lambda x: x["price"]) if buy_ads else None
        
        # Best sell price (highest price to sell crypto)
        best_sell = max(sell_ads, key=lambda x: x["price"]) if sell_ads else None
        
        return {
            "exchange": "binance_p2p",
            "crypto": crypto,
            "fiat": fiat,
            "buy_price": best_buy["price"] if best_buy else None,
            "sell_price": best_sell["price"] if best_sell else None,
            "buy_ads": buy_ads[:5],  # Top 5
            "sell_ads": sell_ads[:5]
        }
```

### 2. Quidax API Integration

Quidax has an official API.

```python
# backend/app/scrapers/crypto/quidax.py

import httpx
from typing import Dict

class QuidaxAPI:
    """
    Quidax official API integration.
    Docs: https://docs.quidax.com/
    """
    
    BASE_URL = "https://www.quidax.com/api/v1"
    
    def __init__(self, api_key: str = None, api_secret: str = None):
        self.api_key = api_key
        self.api_secret = api_secret
    
    async def get_ticker(self, pair: str = "usdtngn") -> Dict:
        """
        Get current ticker for a pair.
        Pairs: btcngn, usdtngn, ethngn, etc.
        """
        
        url = f"{self.BASE_URL}/markets/tickers/{pair}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30.0)
            
            if response.status_code == 200:
                data = response.json()
                ticker = data.get("data", {}).get("ticker", {})
                
                return {
                    "exchange": "quidax",
                    "pair": pair,
                    "buy_price": float(ticker.get("buy", 0)),  # Best ask
                    "sell_price": float(ticker.get("sell", 0)),  # Best bid
                    "last_price": float(ticker.get("last", 0)),
                    "volume_24h": float(ticker.get("vol", 0)),
                    "high_24h": float(ticker.get("high", 0)),
                    "low_24h": float(ticker.get("low", 0))
                }
            else:
                raise Exception(f"Quidax API error: {response.status_code}")
    
    async def get_all_tickers(self) -> Dict:
        """Get all market tickers."""
        
        url = f"{self.BASE_URL}/markets/tickers"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30.0)
            
            if response.status_code == 200:
                return response.json().get("data", {})
            else:
                raise Exception(f"Quidax API error: {response.status_code}")
```

### 3. Luno API Integration

```python
# backend/app/scrapers/crypto/luno.py

import httpx
from typing import Dict

class LunoAPI:
    """
    Luno API integration.
    Docs: https://www.luno.com/en/developers/api
    """
    
    BASE_URL = "https://api.luno.com/api/1"
    
    async def get_ticker(self, pair: str = "USDTNGN") -> Dict:
        """
        Get ticker for a pair.
        Pairs: XBTNGN (BTC), USDTNGN, ETHNGN
        """
        
        url = f"{self.BASE_URL}/ticker"
        params = {"pair": pair}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=30.0)
            
            if response.status_code == 200:
                data = response.json()
                
                return {
                    "exchange": "luno",
                    "pair": pair,
                    "buy_price": float(data.get("ask", 0)),
                    "sell_price": float(data.get("bid", 0)),
                    "last_price": float(data.get("last_trade", 0)),
                    "volume_24h": float(data.get("rolling_24_hour_volume", 0))
                }
            else:
                raise Exception(f"Luno API error: {response.status_code}")
```

### 4. Arbitrage Calculator

```python
# backend/app/services/arbscanner/arbitrage_calculator.py

from typing import Dict, List, Optional
from decimal import Decimal
import json

class ArbitrageCalculator:
    """
    Calculate arbitrage opportunities between exchanges.
    """
    
    # Fee structure (keep updated!)
    FEES = {
        "binance_p2p": {
            "trading_fee": Decimal("0"),
            "withdrawal_usdt_trc20": Decimal("1"),
            "withdrawal_usdt_bep20": Decimal("0.29"),
        },
        "quidax": {
            "trading_fee": Decimal("0.005"),  # 0.5%
            "withdrawal_usdt": Decimal("2"),
            "ngn_withdrawal": Decimal("0.005"),  # 0.5%
        },
        "luno": {
            "trading_fee": Decimal("0.001"),  # 0.1%
            "withdrawal_usdt": Decimal("0"),
        }
    }
    
    def calculate_opportunity(
        self,
        buy_exchange: str,
        sell_exchange: str,
        buy_price: float,
        sell_price: float,
        crypto: str = "USDT",
        trade_amount_ngn: float = 100000
    ) -> Dict:
        """
        Calculate profit for an arbitrage opportunity.
        
        Args:
            buy_exchange: Exchange to buy from
            sell_exchange: Exchange to sell on
            buy_price: Price in NGN to buy 1 unit of crypto
            sell_price: Price in NGN to sell 1 unit of crypto
            crypto: Cryptocurrency (USDT, BTC, ETH)
            trade_amount_ngn: Amount in NGN to trade
        
        Returns:
            Dict with profit calculations
        """
        
        buy_price = Decimal(str(buy_price))
        sell_price = Decimal(str(sell_price))
        trade_amount = Decimal(str(trade_amount_ngn))
        
        # Calculate gross spread
        gross_spread = sell_price - buy_price
        gross_spread_percent = (gross_spread / buy_price) * 100
        
        # Calculate crypto amount bought
        crypto_amount = trade_amount / buy_price
        
        # Calculate fees
        buy_fee = self._get_trading_fee(buy_exchange, trade_amount)
        sell_fee = self._get_trading_fee(sell_exchange, trade_amount)
        withdrawal_fee = self._get_withdrawal_fee(buy_exchange, crypto)
        
        total_fees = buy_fee + sell_fee + withdrawal_fee
        total_fees_ngn = total_fees
        
        # Calculate net profit
        gross_revenue = crypto_amount * sell_price
        net_profit = gross_revenue - trade_amount - total_fees_ngn
        net_profit_percent = (net_profit / trade_amount) * 100
        
        # Determine if profitable
        is_profitable = net_profit > 0
        
        return {
            "buy_exchange": buy_exchange,
            "sell_exchange": sell_exchange,
            "crypto": crypto,
            "buy_price": float(buy_price),
            "sell_price": float(sell_price),
            "trade_amount_ngn": float(trade_amount),
            "crypto_amount": float(crypto_amount),
            "gross_spread": float(gross_spread),
            "gross_spread_percent": float(gross_spread_percent),
            "fees": {
                "buy_fee": float(buy_fee),
                "sell_fee": float(sell_fee),
                "withdrawal_fee": float(withdrawal_fee),
                "total": float(total_fees_ngn)
            },
            "net_profit": float(net_profit),
            "net_profit_percent": float(net_profit_percent),
            "is_profitable": is_profitable,
            "roi": float(net_profit_percent)
        }
    
    def _get_trading_fee(self, exchange: str, amount: Decimal) -> Decimal:
        """Get trading fee for an exchange."""
        fee_rate = self.FEES.get(exchange, {}).get("trading_fee", Decimal("0"))
        return amount * fee_rate
    
    def _get_withdrawal_fee(self, exchange: str, crypto: str) -> Decimal:
        """Get withdrawal fee (in crypto units, convert to NGN)."""
        # For simplicity, return fixed fee in NGN equivalent
        # In production, convert based on current price
        return self.FEES.get(exchange, {}).get(f"withdrawal_{crypto.lower()}", Decimal("0"))
    
    def find_best_opportunities(
        self,
        prices: Dict[str, Dict],
        min_spread_percent: float = 1.0,
        trade_amount_ngn: float = 100000
    ) -> List[Dict]:
        """
        Find all profitable arbitrage opportunities.
        
        Args:
            prices: Dict of exchange prices
                {"binance_p2p": {"buy": 1580, "sell": 1595}, ...}
            min_spread_percent: Minimum spread to consider
            trade_amount_ngn: Trade amount for calculations
        """
        
        opportunities = []
        exchanges = list(prices.keys())
        
        # Compare all exchange pairs
        for buy_exchange in exchanges:
            for sell_exchange in exchanges:
                if buy_exchange == sell_exchange:
                    continue
                
                buy_price = prices[buy_exchange].get("buy")
                sell_price = prices[sell_exchange].get("sell")
                
                if not buy_price or not sell_price:
                    continue
                
                # Calculate opportunity
                opp = self.calculate_opportunity(
                    buy_exchange=buy_exchange,
                    sell_exchange=sell_exchange,
                    buy_price=buy_price,
                    sell_price=sell_price,
                    trade_amount_ngn=trade_amount_ngn
                )
                
                # Filter by minimum spread
                if opp["gross_spread_percent"] >= min_spread_percent:
                    opportunities.append(opp)
        
        # Sort by net profit (descending)
        opportunities.sort(key=lambda x: x["net_profit_percent"], reverse=True)
        
        return opportunities
```

### 5. NGX Scraper

```python
# backend/app/scrapers/stocks/ngx.py

import httpx
from bs4 import BeautifulSoup
from typing import List, Dict
from datetime import datetime, date

class NGXScraper:
    """
    Scrape stock data from NGX (Nigerian Exchange) website.
    
    Note: NGX website structure may change. Update selectors as needed.
    """
    
    BASE_URL = "https://ngxgroup.com"
    
    async def get_all_equities(self) -> List[Dict]:
        """
        Get all listed equities with current prices.
        Source: https://ngxgroup.com/exchange/data/equities-price-list/
        """
        
        url = f"{self.BASE_URL}/exchange/data/equities-price-list/"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=60.0)
            
            if response.status_code == 200:
                return self._parse_equities_page(response.text)
            else:
                raise Exception(f"NGX scrape error: {response.status_code}")
    
    def _parse_equities_page(self, html: str) -> List[Dict]:
        """Parse the equities price list page."""
        
        soup = BeautifulSoup(html, "html.parser")
        stocks = []
        
        # Find the data table (adjust selector based on actual page structure)
        table = soup.find("table", {"id": "equities-table"})
        
        if not table:
            # Try alternative selector
            table = soup.find("table", class_="dataTable")
        
        if not table:
            return stocks
        
        rows = table.find("tbody").find_all("tr")
        
        for row in rows:
            cols = row.find_all("td")
            
            if len(cols) >= 8:
                try:
                    symbol = cols[0].text.strip()
                    name = cols[1].text.strip() if len(cols) > 1 else ""
                    
                    # Parse price (handle commas)
                    close_price = self._parse_number(cols[2].text)
                    open_price = self._parse_number(cols[3].text)
                    high_price = self._parse_number(cols[4].text)
                    low_price = self._parse_number(cols[5].text)
                    
                    # Parse change
                    change_text = cols[6].text.strip()
                    change = self._parse_number(change_text)
                    
                    # Parse volume
                    volume = self._parse_number(cols[7].text)
                    
                    stocks.append({
                        "symbol": symbol,
                        "name": name,
                        "close": close_price,
                        "open": open_price,
                        "high": high_price,
                        "low": low_price,
                        "change": change,
                        "change_percent": (change / open_price * 100) if open_price else 0,
                        "volume": int(volume) if volume else 0,
                        "date": date.today().isoformat()
                    })
                    
                except Exception as e:
                    # Skip problematic rows
                    continue
        
        return stocks
    
    def _parse_number(self, text: str) -> float:
        """Parse a number from text, handling commas and parentheses."""
        if not text:
            return 0.0
        
        # Remove commas, whitespace
        cleaned = text.strip().replace(",", "").replace(" ", "")
        
        # Handle negative (parentheses)
        if cleaned.startswith("(") and cleaned.endswith(")"):
            cleaned = "-" + cleaned[1:-1]
        
        # Handle percentage signs
        cleaned = cleaned.replace("%", "")
        
        try:
            return float(cleaned)
        except ValueError:
            return 0.0
    
    async def get_market_summary(self) -> Dict:
        """Get NGX All Share Index and market summary."""
        
        url = f"{self.BASE_URL}/exchange/data/market-statistics/"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=60.0)
            
            if response.status_code == 200:
                return self._parse_market_summary(response.text)
            else:
                raise Exception(f"NGX market summary error: {response.status_code}")
    
    def _parse_market_summary(self, html: str) -> Dict:
        """Parse market summary page."""
        
        soup = BeautifulSoup(html, "html.parser")
        
        # This will need to be adjusted based on actual page structure
        # Example structure - update selectors as needed
        
        return {
            "asi": 0,  # All Share Index
            "market_cap": 0,
            "volume": 0,
            "value": 0,
            "deals": 0,
            "date": date.today().isoformat()
        }
```

### 6. Telegram Bot

```python
# backend/app/telegram_bot/bot.py

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, 
    CommandHandler, 
    CallbackQueryHandler,
    ContextTypes
)
import asyncio

class TradingBot:
    """Telegram bot for ArbScanner and NGX Radar alerts."""
    
    def __init__(self, token: str):
        self.token = token
        self.app = Application.builder().token(token).build()
        self._setup_handlers()
    
    def _setup_handlers(self):
        """Set up command handlers."""
        self.app.add_handler(CommandHandler("start", self.start))
        self.app.add_handler(CommandHandler("prices", self.prices))
        self.app.add_handler(CommandHandler("arb", self.arbitrage))
        self.app.add_handler(CommandHandler("ngx", self.ngx_summary))
        self.app.add_handler(CommandHandler("alerts", self.manage_alerts))
        self.app.add_handler(CommandHandler("help", self.help))
        self.app.add_handler(CallbackQueryHandler(self.button_callback))
    
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command."""
        
        keyboard = [
            [InlineKeyboardButton("💰 Crypto Prices", callback_data="prices")],
            [InlineKeyboardButton("🔄 Arbitrage Opportunities", callback_data="arb")],
            [InlineKeyboardButton("📈 NGX Market", callback_data="ngx")],
            [InlineKeyboardButton("🔔 My Alerts", callback_data="alerts")],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        welcome_text = """
🇳🇬 *Welcome to NaijaTrade Bot!*

I help Nigerian traders find:
• Crypto arbitrage opportunities
• NGX stock market data

*Commands:*
/prices - Current crypto prices
/arb - Arbitrage opportunities
/ngx - NGX market summary
/alerts - Manage your alerts
/help - Get help

Let's make money! 💰
        """
        
        await update.message.reply_text(
            welcome_text,
            parse_mode="Markdown",
            reply_markup=reply_markup
        )
    
    async def prices(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show current crypto prices across exchanges."""
        
        # TODO: Fetch from price aggregator service
        
        message = """
💰 *USDT/NGN Prices*
_Updated just now_

*Exchange* | *Buy* | *Sell*
━━━━━━━━━━━━━━━━━━
Binance P2P | ₦1,580 | ₦1,595
Bybit P2P | ₦1,575 | ₦1,590
Quidax | ₦1,590 | ₦1,610
Luno | ₦1,585 | ₦1,605

Use /arb to see opportunities
        """
        
        await update.message.reply_text(message, parse_mode="Markdown")
    
    async def arbitrage(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show current arbitrage opportunities."""
        
        # TODO: Fetch from arbitrage calculator service
        
        message = """
🔄 *Arbitrage Opportunities*
_Updated just now_

🔥 *Best Opportunity*
━━━━━━━━━━━━━━━━━━
Buy USDT on *Bybit P2P* @ ₦1,575
Sell USDT on *Quidax* @ ₦1,610

📊 Analysis:
• Spread: ₦35 (2.22%)
• Est. Fees: ~₦8
• *Net Profit: ₦27 (1.71%)*

💡 On ₦100,000 trade:
Net profit ≈ ₦1,710

⚠️ Check liquidity before trading
        """
        
        await update.message.reply_text(message, parse_mode="Markdown")
    
    async def ngx_summary(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show NGX market summary."""
        
        # TODO: Fetch from NGX service
        
        message = """
📈 *NGX Market Summary*
_Jan 30, 2026_

*ASI:* 98,456.23 ▲ +1.2%
*Market Cap:* ₦54.2T
*Volume:* 342M shares
*Deals:* 5,234

🔥 *Top Gainers*
MTNN ▲ +9.8%
DANGCEM ▲ +5.2%
GTCO ▲ +4.1%

📉 *Top Losers*
OANDO ▼ -4.2%
PRESCO ▼ -3.1%

Use web app for full analysis
        """
        
        await update.message.reply_text(message, parse_mode="Markdown")
    
    async def manage_alerts(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Manage user alerts."""
        
        keyboard = [
            [InlineKeyboardButton("➕ New Arb Alert", callback_data="new_arb_alert")],
            [InlineKeyboardButton("➕ New Stock Alert", callback_data="new_stock_alert")],
            [InlineKeyboardButton("📋 View My Alerts", callback_data="view_alerts")],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            "🔔 *Alert Management*\n\nWhat would you like to do?",
            parse_mode="Markdown",
            reply_markup=reply_markup
        )
    
    async def help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show help message."""
        
        help_text = """
📖 *NaijaTrade Bot Help*

*Arbitrage Commands:*
/prices - View current prices
/arb - See arbitrage opportunities

*NGX Commands:*
/ngx - Market summary

*Alert Commands:*
/alerts - Manage your alerts

*Need more features?*
Visit our web app for:
• Full screening tools
• Historical data
• Portfolio tracking
• And more!

🌐 naijatradetools.com
        """
        
        await update.message.reply_text(help_text, parse_mode="Markdown")
    
    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle button callbacks."""
        
        query = update.callback_query
        await query.answer()
        
        if query.data == "prices":
            await self.prices(update, context)
        elif query.data == "arb":
            await self.arbitrage(update, context)
        elif query.data == "ngx":
            await self.ngx_summary(update, context)
        elif query.data == "alerts":
            await self.manage_alerts(update, context)
    
    async def send_arb_alert(self, chat_id: int, opportunity: dict):
        """Send arbitrage alert to user."""
        
        message = f"""
🚨 *ARBITRAGE ALERT* 🚨

💰 Opportunity Found!

Buy: {opportunity['crypto']} on *{opportunity['buy_exchange']}*
Price: ₦{opportunity['buy_price']:,.2f}

Sell: {opportunity['crypto']} on *{opportunity['sell_exchange']}*
Price: ₦{opportunity['sell_price']:,.2f}

📊 Analysis:
• Spread: ₦{opportunity['gross_spread']:,.2f} ({opportunity['gross_spread_percent']:.2f}%)
• Est. Fees: ₦{opportunity['fees']['total']:,.2f}
• *Net Profit: {opportunity['net_profit_percent']:.2f}%*

⏰ {datetime.now().strftime('%H:%M WAT')}
━━━━━━━━━━━━━━━━━━
🔗 Trade Now: naijatradetools.com
        """
        
        await self.app.bot.send_message(
            chat_id=chat_id,
            text=message,
            parse_mode="Markdown"
        )
    
    def run(self):
        """Run the bot."""
        self.app.run_polling()
```

### 7. Paystack Integration

```python
# backend/app/services/payment.py

import httpx
from typing import Dict, Optional
from app.config import settings

class PaystackService:
    """
    Paystack payment integration for subscriptions.
    Docs: https://paystack.com/docs/api/
    """
    
    BASE_URL = "https://api.paystack.co"
    
    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
    
    async def initialize_transaction(
        self,
        email: str,
        amount: int,  # Amount in kobo (NGN * 100)
        reference: str,
        callback_url: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Initialize a payment transaction.
        
        Args:
            email: Customer email
            amount: Amount in kobo
            reference: Unique transaction reference
            callback_url: URL to redirect after payment
            metadata: Additional data (plan, user_id, etc.)
        """
        
        url = f"{self.BASE_URL}/transaction/initialize"
        
        payload = {
            "email": email,
            "amount": amount,
            "reference": reference,
            "callback_url": callback_url,
            "metadata": metadata or {}
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=self.headers,
                timeout=30.0
            )
            
            data = response.json()
            
            if data.get("status"):
                return {
                    "success": True,
                    "authorization_url": data["data"]["authorization_url"],
                    "access_code": data["data"]["access_code"],
                    "reference": data["data"]["reference"]
                }
            else:
                return {
                    "success": False,
                    "message": data.get("message", "Payment initialization failed")
                }
    
    async def verify_transaction(self, reference: str) -> Dict:
        """Verify a transaction by reference."""
        
        url = f"{self.BASE_URL}/transaction/verify/{reference}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=self.headers,
                timeout=30.0
            )
            
            data = response.json()
            
            if data.get("status") and data["data"]["status"] == "success":
                return {
                    "success": True,
                    "amount": data["data"]["amount"] / 100,  # Convert from kobo
                    "currency": data["data"]["currency"],
                    "reference": data["data"]["reference"],
                    "customer_email": data["data"]["customer"]["email"],
                    "paid_at": data["data"]["paid_at"]
                }
            else:
                return {
                    "success": False,
                    "message": data.get("message", "Verification failed")
                }
    
    async def create_subscription(
        self,
        customer_email: str,
        plan_code: str,
        authorization_code: str
    ) -> Dict:
        """Create a recurring subscription."""
        
        url = f"{self.BASE_URL}/subscription"
        
        payload = {
            "customer": customer_email,
            "plan": plan_code,
            "authorization": authorization_code
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=self.headers,
                timeout=30.0
            )
            
            return response.json()
    
    async def create_plan(
        self,
        name: str,
        amount: int,  # in kobo
        interval: str  # monthly, quarterly, annually
    ) -> Dict:
        """Create a subscription plan."""
        
        url = f"{self.BASE_URL}/plan"
        
        payload = {
            "name": name,
            "amount": amount,
            "interval": interval
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=self.headers,
                timeout=30.0
            )
            
            return response.json()


# Subscription plans to create in Paystack
SUBSCRIPTION_PLANS = {
    "arbscanner": {
        "starter_monthly": {"name": "ArbScanner Starter", "amount": 300000, "interval": "monthly"},
        "starter_quarterly": {"name": "ArbScanner Starter Q", "amount": 750000, "interval": "quarterly"},
        "pro_monthly": {"name": "ArbScanner Pro", "amount": 1000000, "interval": "monthly"},
        "pro_quarterly": {"name": "ArbScanner Pro Q", "amount": 2500000, "interval": "quarterly"},
    },
    "ngxradar": {
        "basic_monthly": {"name": "NGX Radar Basic", "amount": 250000, "interval": "monthly"},
        "pro_monthly": {"name": "NGX Radar Pro", "amount": 750000, "interval": "monthly"},
    }
}
```

---

## FRONTEND COMPONENTS

### Price Grid Component

```tsx
// frontend/src/components/arbscanner/PriceGrid.tsx

import { useQuery } from '@tanstack/react-query';
import { fetchPrices } from '../../services/arbscanner';

interface ExchangePrice {
  exchange: string;
  displayName: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
}

export function PriceGrid() {
  const { data: prices, isLoading } = useQuery({
    queryKey: ['prices'],
    queryFn: fetchPrices,
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading prices...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">USDT/NGN Prices</h2>
        <span className="text-sm text-gray-500">
          Updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm">
              <th className="pb-3">Exchange</th>
              <th className="pb-3 text-right">Buy (₦)</th>
              <th className="pb-3 text-right">Sell (₦)</th>
              <th className="pb-3 text-right">Spread</th>
            </tr>
          </thead>
          <tbody>
            {prices?.map((price: ExchangePrice) => (
              <tr key={price.exchange} className="border-t">
                <td className="py-3 font-medium">{price.displayName}</td>
                <td className="py-3 text-right text-green-600">
                  ₦{price.buyPrice.toLocaleString()}
                </td>
                <td className="py-3 text-right text-red-600">
                  ₦{price.sellPrice.toLocaleString()}
                </td>
                <td className="py-3 text-right text-gray-600">
                  {price.spread.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Opportunity Card Component

```tsx
// frontend/src/components/arbscanner/OpportunityCard.tsx

interface Opportunity {
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  grossSpreadPercent: number;
  netProfitPercent: number;
  fees: {
    total: number;
  };
}

interface Props {
  opportunity: Opportunity;
  highlight?: boolean;
}

export function OpportunityCard({ opportunity, highlight }: Props) {
  const isProfitable = opportunity.netProfitPercent > 0;

  return (
    <div
      className={`rounded-xl p-6 ${
        highlight
          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
          : 'bg-white shadow-lg'
      }`}
    >
      {highlight && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🔥</span>
          <span className="font-bold">Best Opportunity</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className={`text-sm ${highlight ? 'text-green-100' : 'text-gray-500'}`}>
            Buy on
          </p>
          <p className="font-bold text-lg">{opportunity.buyExchange}</p>
          <p className={`text-xl font-bold ${highlight ? '' : 'text-green-600'}`}>
            ₦{opportunity.buyPrice.toLocaleString()}
          </p>
        </div>

        <div>
          <p className={`text-sm ${highlight ? 'text-green-100' : 'text-gray-500'}`}>
            Sell on
          </p>
          <p className="font-bold text-lg">{opportunity.sellExchange}</p>
          <p className={`text-xl font-bold ${highlight ? '' : 'text-red-600'}`}>
            ₦{opportunity.sellPrice.toLocaleString()}
          </p>
        </div>
      </div>

      <div className={`border-t ${highlight ? 'border-white/20' : 'border-gray-200'} pt-4`}>
        <div className="flex justify-between mb-2">
          <span className={highlight ? 'text-green-100' : 'text-gray-500'}>
            Gross Spread
          </span>
          <span className="font-bold">
            {opportunity.grossSpreadPercent.toFixed(2)}%
          </span>
        </div>

        <div className="flex justify-between mb-2">
          <span className={highlight ? 'text-green-100' : 'text-gray-500'}>
            Est. Fees
          </span>
          <span>₦{opportunity.fees.total.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-lg">
          <span className="font-bold">Net Profit</span>
          <span
            className={`font-bold ${
              isProfitable
                ? highlight
                  ? 'text-yellow-300'
                  : 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {opportunity.netProfitPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <button
        className={`w-full mt-4 py-3 rounded-lg font-bold transition ${
          highlight
            ? 'bg-white text-green-600 hover:bg-gray-100'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        Calculate Trade
      </button>
    </div>
  );
}
```

---

## CELERY TASKS

```python
# backend/app/tasks/crypto_tasks.py

from celery import shared_task
from app.scrapers.crypto.binance_p2p import BinanceP2PScraper
from app.scrapers.crypto.quidax import QuidaxAPI
from app.scrapers.crypto.luno import LunoAPI
from app.services.arbscanner.arbitrage_calculator import ArbitrageCalculator
from app.services.arbscanner.alert_service import AlertService
import asyncio

@shared_task
def fetch_all_prices():
    """Fetch prices from all exchanges (run every 60 seconds)."""
    
    async def _fetch():
        binance = BinanceP2PScraper()
        quidax = QuidaxAPI()
        luno = LunoAPI()
        
        results = await asyncio.gather(
            binance.get_best_prices("USDT", "NGN"),
            quidax.get_ticker("usdtngn"),
            luno.get_ticker("USDTNGN"),
            return_exceptions=True
        )
        
        prices = {}
        
        for result in results:
            if isinstance(result, dict):
                exchange = result.get("exchange")
                prices[exchange] = {
                    "buy": result.get("buy_price"),
                    "sell": result.get("sell_price")
                }
        
        # Save to Redis for fast access
        # Check for arbitrage opportunities
        # Trigger alerts if thresholds met
        
        return prices
    
    return asyncio.run(_fetch())

@shared_task
def check_arbitrage_opportunities():
    """Check for arbitrage opportunities and send alerts."""
    
    # Get latest prices from Redis
    # Calculate opportunities
    # Check user alert thresholds
    # Send notifications
    
    pass

@shared_task
def send_telegram_alert(chat_id: int, message: str):
    """Send Telegram notification."""
    pass
```

---

## DEPLOYMENT

### Docker Compose (Production)

```yaml
# docker-compose.prod.yml

version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/naijatools
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: always

  celery_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A app.tasks.celery_app worker -l info
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/naijatools
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: always

  celery_beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A app.tasks.celery_app beat -l info
    depends_on:
      - redis
    restart: always

  telegram_bot:
    build:
      context: ./telegram-bot
      dockerfile: Dockerfile
    environment:
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    depends_on:
      - backend
    restart: always

  db:
    image: timescale/timescaledb:latest-pg15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: naijatools
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certbot/www:/var/www/certbot
      - ./certbot/conf:/etc/letsencrypt
    depends_on:
      - backend
    restart: always

volumes:
  postgres_data:
```

---

## QUICK START COMMANDS

```bash
# Clone and setup
git clone <your-repo>
cd naija-trading-tools

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your keys

# Run migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload

# In another terminal - start Celery worker
celery -A app.tasks.celery_app worker -l info

# In another terminal - start Celery beat
celery -A app.tasks.celery_app beat -l info

# Frontend setup
cd ../frontend
npm install
npm run dev

# Telegram bot
cd ../telegram-bot
pip install -r requirements.txt
python bot.py
```

---

## SUCCESS CHECKLIST

### Week 1-2
- [ ] Project structure created
- [ ] Database models + migrations
- [ ] User auth working
- [ ] Basic API structure

### Week 3-4
- [ ] Binance P2P scraper working
- [ ] Quidax API working
- [ ] Luno API working
- [ ] Price aggregation service
- [ ] Arbitrage calculator

### Week 5-6
- [ ] ArbScanner frontend dashboard
- [ ] Telegram bot basic commands
- [ ] Alert system

### Week 7-8
- [ ] NGX scraper working
- [ ] Stock service
- [ ] Screener logic
- [ ] NGX frontend dashboard

### Week 9-10
- [ ] Paystack integration
- [ ] Subscription management
- [ ] Plan restrictions

### Week 11-12
- [ ] Landing pages
- [ ] Mobile responsive
- [ ] Testing
- [ ] Deploy to production
- [ ] LAUNCH! 🚀

---

Good luck building! Start with the foundation, then ArbScanner, then NGX Radar. Ship fast, iterate based on user feedback.
