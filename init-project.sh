#!/bin/bash

# Naija Trading Tools - Project Initialization Script
# Run this to create the initial project structure

echo "🇳🇬 Creating Naija Trading Tools Project..."

# Create main directory
mkdir -p naija-trading-tools
cd naija-trading-tools

# Create README
cat > README.md << 'EOF'
# Naija Trading Tools 🇳🇬💰

Nigerian-focused trading SaaS platform with two products:

## Products

### 1. ArbScanner - Crypto Arbitrage Scanner
Find profitable arbitrage opportunities across Nigerian crypto exchanges.
- Real-time price monitoring
- Automatic profit calculation
- Telegram alerts
- Historical opportunity tracking

### 2. NGX Radar - Nigerian Stock Screener  
The TradingView for Nigerian stocks.
- All NGX listed stocks
- Screening and filtering
- Price alerts
- Dividend calendar
- Portfolio tracking

## Tech Stack
- **Frontend:** React + TypeScript + Tailwind
- **Backend:** Python FastAPI
- **Database:** PostgreSQL + TimescaleDB
- **Cache:** Redis
- **Queue:** Celery
- **Bot:** Telegram

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Telegram Bot
```bash
cd telegram-bot
pip install -r requirements.txt
python bot.py
```

## License
MIT
EOF

# ==================== BACKEND ====================
echo "📦 Creating Backend..."

mkdir -p backend/app/{api/v1/{arbscanner,ngxradar},core,models/{arbscanner,ngxradar},schemas,services/{arbscanner,ngxradar},scrapers/{crypto,stocks},tasks,data,telegram_bot/handlers}
mkdir -p backend/alembic/versions
mkdir -p backend/tests

# Requirements
cat > backend/requirements.txt << 'EOF'
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
alembic==1.13.1
psycopg2-binary==2.9.9
asyncpg==0.29.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.3
pydantic-settings==2.1.0
httpx==0.26.0
redis==5.0.1
celery==5.3.6
playwright==1.41.0
beautifulsoup4==4.12.3
python-telegram-bot==20.7
python-dotenv==1.0.0
pytest==7.4.4
pytest-asyncio==0.23.3
EOF

# Main app
cat > backend/app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.config import settings

app = FastAPI(
    title="Naija Trading Tools API",
    description="Crypto Arbitrage Scanner + NGX Stock Screener",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "Naija Trading Tools API 🇳🇬💰",
        "products": ["ArbScanner", "NGX Radar"],
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
EOF

# Config
cat > backend/app/config.py << 'EOF'
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "Naija Trading Tools"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production"
    
    # Database
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/naijatools"
    REDIS_URL: str = "redis://localhost:6379"
    
    # JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Paystack
    PAYSTACK_SECRET_KEY: str = ""
    PAYSTACK_PUBLIC_KEY: str = ""
    
    # Telegram
    TELEGRAM_BOT_TOKEN: str = ""
    
    # Exchange APIs
    QUIDAX_API_KEY: str = ""
    LUNO_API_KEY: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()
EOF

# Database
cat > backend/app/core/database.py << 'EOF'
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
EOF

# Security
cat > backend/app/core/security.py << 'EOF'
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
EOF

# User model
cat > backend/app/models/user.py << 'EOF'
from sqlalchemy import Column, String, Boolean, DateTime, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(20))
    telegram_chat_id = Column(BigInteger)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
EOF

# API Router
cat > backend/app/api/v1/router.py << 'EOF'
from fastapi import APIRouter
from app.api.v1 import auth
from app.api.v1.arbscanner import prices as arb_prices
from app.api.v1.ngxradar import stocks as ngx_stocks

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(arb_prices.router, prefix="/arb", tags=["ArbScanner"])
api_router.include_router(ngx_stocks.router, prefix="/ngx", tags=["NGX Radar"])
EOF

# Auth endpoints
cat > backend/app/api/v1/auth.py << 'EOF'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.models.user import User
from pydantic import BaseModel, EmailStr

router = APIRouter()

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str = None
    last_name: str = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return Token(access_token=access_token, refresh_token=refresh_token)
EOF

# ArbScanner prices endpoint
cat > backend/app/api/v1/arbscanner/prices.py << 'EOF'
from fastapi import APIRouter, HTTPException
from typing import List, Dict
from app.services.arbscanner.price_aggregator import PriceAggregator

router = APIRouter()
price_aggregator = PriceAggregator()

@router.get("/prices")
async def get_all_prices():
    """Get current prices from all exchanges."""
    try:
        prices = await price_aggregator.get_all_prices()
        return {"success": True, "data": prices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prices/{crypto}")
async def get_crypto_prices(crypto: str):
    """Get prices for specific cryptocurrency."""
    try:
        prices = await price_aggregator.get_prices_for_crypto(crypto.upper())
        return {"success": True, "data": prices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/opportunities")
async def get_opportunities(min_spread: float = 1.0):
    """Get current arbitrage opportunities."""
    try:
        opportunities = await price_aggregator.get_opportunities(min_spread)
        return {"success": True, "data": opportunities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calculate")
async def calculate_arbitrage(
    buy_exchange: str,
    sell_exchange: str,
    amount_ngn: float = 100000
):
    """Calculate arbitrage profit for specific trade."""
    try:
        result = await price_aggregator.calculate_trade(
            buy_exchange, sell_exchange, amount_ngn
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
EOF

# NGX stocks endpoint
cat > backend/app/api/v1/ngxradar/stocks.py << 'EOF'
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.services.ngxradar.stock_service import StockService

router = APIRouter()
stock_service = StockService()

@router.get("/market")
async def get_market_summary():
    """Get NGX market summary."""
    try:
        summary = await stock_service.get_market_summary()
        return {"success": True, "data": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stocks")
async def get_all_stocks(
    sector: Optional[str] = None,
    limit: int = Query(50, le=200)
):
    """Get all stocks with optional filtering."""
    try:
        stocks = await stock_service.get_stocks(sector=sector, limit=limit)
        return {"success": True, "data": stocks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stocks/{symbol}")
async def get_stock_detail(symbol: str):
    """Get detailed info for a specific stock."""
    try:
        stock = await stock_service.get_stock_detail(symbol.upper())
        if not stock:
            raise HTTPException(status_code=404, detail="Stock not found")
        return {"success": True, "data": stock}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/gainers")
async def get_top_gainers(limit: int = 10):
    """Get top gaining stocks."""
    try:
        gainers = await stock_service.get_gainers(limit)
        return {"success": True, "data": gainers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/losers")
async def get_top_losers(limit: int = 10):
    """Get top losing stocks."""
    try:
        losers = await stock_service.get_losers(limit)
        return {"success": True, "data": losers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/screener")
async def screen_stocks(
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_pe: Optional[float] = None,
    max_pe: Optional[float] = None,
    min_dividend_yield: Optional[float] = None,
    sector: Optional[str] = None
):
    """Screen stocks based on criteria."""
    try:
        results = await stock_service.screen_stocks(
            min_price=min_price,
            max_price=max_price,
            min_pe=min_pe,
            max_pe=max_pe,
            min_dividend_yield=min_dividend_yield,
            sector=sector
        )
        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
EOF

# Price aggregator service
cat > backend/app/services/arbscanner/price_aggregator.py << 'EOF'
from typing import Dict, List
import asyncio
from app.scrapers.crypto.binance_p2p import BinanceP2PScraper
from app.scrapers.crypto.quidax import QuidaxAPI
from app.scrapers.crypto.luno import LunoAPI
from app.services.arbscanner.arbitrage_calculator import ArbitrageCalculator

class PriceAggregator:
    def __init__(self):
        self.binance = BinanceP2PScraper()
        self.quidax = QuidaxAPI()
        self.luno = LunoAPI()
        self.calculator = ArbitrageCalculator()
    
    async def get_all_prices(self, crypto: str = "USDT") -> List[Dict]:
        """Fetch prices from all exchanges."""
        
        results = await asyncio.gather(
            self.binance.get_best_prices(crypto, "NGN"),
            self.quidax.get_ticker(f"{crypto.lower()}ngn"),
            self.luno.get_ticker(f"{crypto}NGN"),
            return_exceptions=True
        )
        
        prices = []
        
        for result in results:
            if isinstance(result, dict) and not isinstance(result, Exception):
                prices.append({
                    "exchange": result.get("exchange"),
                    "crypto": crypto,
                    "buy_price": result.get("buy_price"),
                    "sell_price": result.get("sell_price"),
                    "volume_24h": result.get("volume_24h", 0)
                })
        
        return prices
    
    async def get_prices_for_crypto(self, crypto: str) -> List[Dict]:
        """Get prices for specific crypto."""
        return await self.get_all_prices(crypto)
    
    async def get_opportunities(self, min_spread: float = 1.0) -> List[Dict]:
        """Find arbitrage opportunities."""
        
        prices = await self.get_all_prices()
        
        # Convert to format expected by calculator
        price_dict = {}
        for p in prices:
            price_dict[p["exchange"]] = {
                "buy": p["buy_price"],
                "sell": p["sell_price"]
            }
        
        opportunities = self.calculator.find_best_opportunities(
            price_dict, min_spread_percent=min_spread
        )
        
        return opportunities
    
    async def calculate_trade(
        self, 
        buy_exchange: str, 
        sell_exchange: str,
        amount_ngn: float
    ) -> Dict:
        """Calculate specific trade."""
        
        prices = await self.get_all_prices()
        
        buy_price = None
        sell_price = None
        
        for p in prices:
            if p["exchange"] == buy_exchange:
                buy_price = p["buy_price"]
            if p["exchange"] == sell_exchange:
                sell_price = p["sell_price"]
        
        if not buy_price or not sell_price:
            raise ValueError("Could not find prices for specified exchanges")
        
        return self.calculator.calculate_opportunity(
            buy_exchange=buy_exchange,
            sell_exchange=sell_exchange,
            buy_price=buy_price,
            sell_price=sell_price,
            trade_amount_ngn=amount_ngn
        )
EOF

# Stock service
cat > backend/app/services/ngxradar/stock_service.py << 'EOF'
from typing import Dict, List, Optional
from app.scrapers.stocks.ngx import NGXScraper

class StockService:
    def __init__(self):
        self.scraper = NGXScraper()
        self._cache = {}  # Simple in-memory cache
    
    async def get_market_summary(self) -> Dict:
        """Get market summary."""
        return await self.scraper.get_market_summary()
    
    async def get_stocks(
        self, 
        sector: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """Get all stocks."""
        stocks = await self.scraper.get_all_equities()
        
        if sector:
            stocks = [s for s in stocks if s.get("sector") == sector]
        
        return stocks[:limit]
    
    async def get_stock_detail(self, symbol: str) -> Optional[Dict]:
        """Get detailed stock info."""
        stocks = await self.scraper.get_all_equities()
        
        for stock in stocks:
            if stock["symbol"] == symbol:
                return stock
        
        return None
    
    async def get_gainers(self, limit: int = 10) -> List[Dict]:
        """Get top gainers."""
        stocks = await self.scraper.get_all_equities()
        sorted_stocks = sorted(stocks, key=lambda x: x.get("change_percent", 0), reverse=True)
        return sorted_stocks[:limit]
    
    async def get_losers(self, limit: int = 10) -> List[Dict]:
        """Get top losers."""
        stocks = await self.scraper.get_all_equities()
        sorted_stocks = sorted(stocks, key=lambda x: x.get("change_percent", 0))
        return sorted_stocks[:limit]
    
    async def screen_stocks(
        self,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_pe: Optional[float] = None,
        max_pe: Optional[float] = None,
        min_dividend_yield: Optional[float] = None,
        sector: Optional[str] = None
    ) -> List[Dict]:
        """Screen stocks based on criteria."""
        
        stocks = await self.scraper.get_all_equities()
        results = []
        
        for stock in stocks:
            price = stock.get("close", 0)
            pe = stock.get("pe_ratio", 0)
            div_yield = stock.get("dividend_yield", 0)
            stock_sector = stock.get("sector", "")
            
            # Apply filters
            if min_price and price < min_price:
                continue
            if max_price and price > max_price:
                continue
            if min_pe and pe < min_pe:
                continue
            if max_pe and pe > max_pe:
                continue
            if min_dividend_yield and div_yield < min_dividend_yield:
                continue
            if sector and stock_sector != sector:
                continue
            
            results.append(stock)
        
        return results
EOF

# Create init files
touch backend/app/__init__.py
touch backend/app/api/__init__.py
touch backend/app/api/v1/__init__.py
touch backend/app/api/v1/arbscanner/__init__.py
touch backend/app/api/v1/ngxradar/__init__.py
touch backend/app/core/__init__.py
touch backend/app/models/__init__.py
touch backend/app/models/arbscanner/__init__.py
touch backend/app/models/ngxradar/__init__.py
touch backend/app/schemas/__init__.py
touch backend/app/services/__init__.py
touch backend/app/services/arbscanner/__init__.py
touch backend/app/services/ngxradar/__init__.py
touch backend/app/scrapers/__init__.py
touch backend/app/scrapers/crypto/__init__.py
touch backend/app/scrapers/stocks/__init__.py
touch backend/app/tasks/__init__.py
touch backend/app/telegram_bot/__init__.py
touch backend/app/telegram_bot/handlers/__init__.py
touch backend/tests/__init__.py

# Create placeholder scraper files
cat > backend/app/scrapers/crypto/binance_p2p.py << 'EOF'
# See CLAUDE_CODE_INSTRUCTIONS.md for full implementation
import httpx
from typing import List, Dict

class BinanceP2PScraper:
    BASE_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
    
    async def get_best_prices(self, crypto: str = "USDT", fiat: str = "NGN") -> Dict:
        # TODO: Implement - see instructions
        return {
            "exchange": "binance_p2p",
            "buy_price": 1580,
            "sell_price": 1595
        }
EOF

cat > backend/app/scrapers/crypto/quidax.py << 'EOF'
# See CLAUDE_CODE_INSTRUCTIONS.md for full implementation
import httpx
from typing import Dict

class QuidaxAPI:
    BASE_URL = "https://www.quidax.com/api/v1"
    
    async def get_ticker(self, pair: str = "usdtngn") -> Dict:
        # TODO: Implement - see instructions
        return {
            "exchange": "quidax",
            "buy_price": 1590,
            "sell_price": 1610
        }
EOF

cat > backend/app/scrapers/crypto/luno.py << 'EOF'
# See CLAUDE_CODE_INSTRUCTIONS.md for full implementation
import httpx
from typing import Dict

class LunoAPI:
    BASE_URL = "https://api.luno.com/api/1"
    
    async def get_ticker(self, pair: str = "USDTNGN") -> Dict:
        # TODO: Implement - see instructions
        return {
            "exchange": "luno",
            "buy_price": 1585,
            "sell_price": 1605
        }
EOF

cat > backend/app/scrapers/stocks/ngx.py << 'EOF'
# See CLAUDE_CODE_INSTRUCTIONS.md for full implementation
import httpx
from typing import List, Dict

class NGXScraper:
    BASE_URL = "https://ngxgroup.com"
    
    async def get_all_equities(self) -> List[Dict]:
        # TODO: Implement - see instructions
        return [
            {"symbol": "GTCO", "name": "Guaranty Trust", "close": 45.20, "change_percent": 4.1},
            {"symbol": "ZENITH", "name": "Zenith Bank", "close": 38.50, "change_percent": 2.3},
        ]
    
    async def get_market_summary(self) -> Dict:
        return {"asi": 98456.23, "volume": 342000000}
EOF

cat > backend/app/services/arbscanner/arbitrage_calculator.py << 'EOF'
# See CLAUDE_CODE_INSTRUCTIONS.md for full implementation
from typing import Dict, List
from decimal import Decimal

class ArbitrageCalculator:
    FEES = {
        "binance_p2p": {"trading_fee": Decimal("0")},
        "quidax": {"trading_fee": Decimal("0.005")},
        "luno": {"trading_fee": Decimal("0.001")},
    }
    
    def calculate_opportunity(self, **kwargs) -> Dict:
        # TODO: Implement full calculation
        return {"net_profit_percent": 1.5}
    
    def find_best_opportunities(self, prices: Dict, min_spread_percent: float) -> List[Dict]:
        # TODO: Implement
        return []
EOF

# .env.example
cat > backend/.env.example << 'EOF'
APP_NAME=Naija Trading Tools
DEBUG=true
SECRET_KEY=change-this-to-random-secret

DATABASE_URL=postgresql://user:pass@localhost:5432/naijatools
REDIS_URL=redis://localhost:6379

PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx

TELEGRAM_BOT_TOKEN=123456:ABC-xxx

QUIDAX_API_KEY=
LUNO_API_KEY=
EOF

# ==================== FRONTEND ====================
echo "🎨 Creating Frontend..."

mkdir -p frontend/src/{components/{ui,layout,arbscanner,ngxradar,common},pages/{arbscanner,ngxradar},hooks,services,store,utils,types}
mkdir -p frontend/public/assets

# Package.json
cat > frontend/package.json << 'EOF'
{
  "name": "naija-trading-tools",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.3",
    "@tanstack/react-query": "^5.17.19",
    "zustand": "^4.5.0",
    "axios": "^1.6.7",
    "recharts": "^2.10.4",
    "lucide-react": "^0.323.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.12"
  }
}
EOF

# Main entry
cat > frontend/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
EOF

# App
cat > frontend/src/App.tsx << 'EOF'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import ArbDashboard from './pages/arbscanner/ArbDashboard'
import NGXDashboard from './pages/ngxradar/NGXDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/arb" element={<ArbDashboard />} />
      <Route path="/ngx" element={<NGXDashboard />} />
    </Routes>
  )
}

export default App
EOF

# Index CSS
cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #10B981;
  --secondary: #3B82F6;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #f9fafb;
}
EOF

# Tailwind config
cat > frontend/tailwind.config.js << 'EOF'
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#10B981',
          600: '#059669',
        }
      }
    },
  },
  plugins: [],
}
EOF

# Home page
cat > frontend/src/pages/Home.tsx << 'EOF'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            Naija Trading Tools 🇳🇬💰
          </h1>
          <p className="text-xl text-gray-300">
            Your edge in Nigerian markets
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* ArbScanner */}
          <Link 
            to="/arb"
            className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-8 hover:scale-105 transition"
          >
            <div className="text-4xl mb-4">🔄</div>
            <h2 className="text-2xl font-bold mb-2">ArbScanner</h2>
            <p className="text-green-100 mb-4">
              Find crypto arbitrage opportunities across Nigerian exchanges
            </p>
            <ul className="text-sm text-green-200 space-y-1">
              <li>✓ Real-time price monitoring</li>
              <li>✓ Automatic profit calculation</li>
              <li>✓ Telegram alerts</li>
            </ul>
          </Link>
          
          {/* NGX Radar */}
          <Link 
            to="/ngx"
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 hover:scale-105 transition"
          >
            <div className="text-4xl mb-4">📈</div>
            <h2 className="text-2xl font-bold mb-2">NGX Radar</h2>
            <p className="text-blue-100 mb-4">
              Nigerian stock market screener and analysis
            </p>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>✓ All NGX stocks</li>
              <li>✓ Screening & filtering</li>
              <li>✓ Price alerts</li>
            </ul>
          </Link>
        </div>
        
        <div className="text-center mt-16">
          <Link 
            to="/login"
            className="bg-white text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  )
}
EOF

# Login page
cat > frontend/src/pages/Login.tsx << 'EOF'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement login
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          
          <button className="w-full bg-primary-500 text-white py-3 rounded-lg font-bold hover:bg-primary-600">
            Login
          </button>
        </form>
        
        <p className="text-center mt-4 text-gray-600">
          Don't have an account? <Link to="/register" className="text-primary-500">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
EOF

# ArbScanner Dashboard
cat > frontend/src/pages/arbscanner/ArbDashboard.tsx << 'EOF'
import { useQuery } from '@tanstack/react-query'

export default function ArbDashboard() {
  const { data: prices, isLoading } = useQuery({
    queryKey: ['prices'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/api/v1/arb/prices')
      return res.json()
    },
    refetchInterval: 30000
  })

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-green-600">🔄 ArbScanner</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Price Grid */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold mb-4">USDT/NGN Prices</h2>
            
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm">
                    <th className="pb-2">Exchange</th>
                    <th className="pb-2 text-right">Buy</th>
                    <th className="pb-2 text-right">Sell</th>
                  </tr>
                </thead>
                <tbody>
                  {prices?.data?.map((p: any) => (
                    <tr key={p.exchange} className="border-t">
                      <td className="py-2">{p.exchange}</td>
                      <td className="py-2 text-right text-green-600">₦{p.buy_price?.toLocaleString()}</td>
                      <td className="py-2 text-right text-red-600">₦{p.sell_price?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Opportunities */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow p-6 text-white">
            <h2 className="text-lg font-bold mb-4">🔥 Best Opportunity</h2>
            <div className="space-y-4">
              <div>
                <p className="text-green-100 text-sm">Buy on</p>
                <p className="font-bold text-lg">Bybit P2P @ ₦1,575</p>
              </div>
              <div>
                <p className="text-green-100 text-sm">Sell on</p>
                <p className="font-bold text-lg">Quidax @ ₦1,610</p>
              </div>
              <div className="border-t border-white/20 pt-4">
                <p className="text-green-100">Net Profit</p>
                <p className="text-3xl font-bold">1.71%</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
EOF

# NGX Dashboard
cat > frontend/src/pages/ngxradar/NGXDashboard.tsx << 'EOF'
import { useQuery } from '@tanstack/react-query'

export default function NGXDashboard() {
  const { data: stocks, isLoading } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/api/v1/ngx/stocks')
      return res.json()
    }
  })

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-blue-600">📈 NGX Radar</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Market Summary */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Market Summary</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-gray-500 text-sm">ASI</p>
              <p className="text-xl font-bold">98,456.23</p>
              <p className="text-green-500 text-sm">+1.2%</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Volume</p>
              <p className="text-xl font-bold">342M</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Deals</p>
              <p className="text-xl font-bold">5,234</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Market Cap</p>
              <p className="text-xl font-bold">₦54.2T</p>
            </div>
          </div>
        </div>
        
        {/* Stock Table */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-4">All Stocks</h2>
          
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm">
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {stocks?.data?.map((s: any) => (
                  <tr key={s.symbol} className="border-t">
                    <td className="py-2 font-bold">{s.symbol}</td>
                    <td className="py-2 text-gray-600">{s.name}</td>
                    <td className="py-2 text-right">₦{s.close?.toLocaleString()}</td>
                    <td className={`py-2 text-right ${s.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {s.change_percent >= 0 ? '+' : ''}{s.change_percent?.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
EOF

# Vite config
cat > frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
EOF

# Index HTML
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Naija Trading Tools</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# ==================== DOCKER ====================
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/naijatools
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: naijatools
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
EOF

# ==================== GIT ====================
cat > .gitignore << 'EOF'
node_modules/
venv/
__pycache__/
*.pyc
.env
.env.local
dist/
build/
.DS_Store
*.log
EOF

echo ""
echo "✅ Naija Trading Tools project created!"
echo ""
echo "📁 Structure:"
echo "   naija-trading-tools/"
echo "   ├── backend/     (FastAPI)"
echo "   ├── frontend/    (React)"
echo "   └── docker-compose.yml"
echo ""
echo "🚀 Next steps:"
echo "   cd naija-trading-tools"
echo "   # Backend: cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload"
echo "   # Frontend: cd frontend && npm install && npm run dev"
echo ""
echo "💰 Build the future of Nigerian trading!"
