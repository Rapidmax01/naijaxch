from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID


# Stock Schemas
class StockBase(BaseModel):
    """Base stock schema."""
    symbol: str
    name: str
    sector: Optional[str] = None


class StockResponse(StockBase):
    """Stock response with current data."""
    id: str
    current_price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[int] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    high_52w: Optional[float] = None
    low_52w: Optional[float] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class StockPriceResponse(BaseModel):
    """Stock price for a specific date."""
    date: date
    open_price: Optional[float] = None
    high_price: Optional[float] = None
    low_price: Optional[float] = None
    close_price: float
    volume: Optional[int] = None


class StockDetailResponse(StockResponse):
    """Detailed stock response with history."""
    prices: List[StockPriceResponse] = []


# Market Summary
class MarketSummaryResponse(BaseModel):
    """NGX market summary."""
    asi: float = Field(description="All Share Index")
    asi_change: float = 0
    asi_change_percent: float = 0
    market_cap: float = 0
    volume: int = 0
    value: float = 0
    deals: int = 0
    date: date
    top_gainers: List[StockResponse] = []
    top_losers: List[StockResponse] = []
    most_active: List[StockResponse] = []


# Screener
class ScreenerFilters(BaseModel):
    """Stock screener filters."""
    sector: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_change_percent: Optional[float] = None
    max_change_percent: Optional[float] = None
    min_volume: Optional[int] = None
    min_market_cap: Optional[float] = None
    max_pe_ratio: Optional[float] = None
    min_dividend_yield: Optional[float] = None
    sort_by: str = "symbol"
    sort_order: str = "asc"
    limit: int = Field(default=50, le=200)
    offset: int = Field(default=0, ge=0)


class ScreenerResponse(BaseModel):
    """Screener results."""
    stocks: List[StockResponse]
    total: int
    filters_applied: ScreenerFilters


# Watchlist
class WatchlistCreate(BaseModel):
    """Create watchlist."""
    name: str = "My Watchlist"


class WatchlistResponse(BaseModel):
    """Watchlist response."""
    id: str
    name: str
    stocks: List[StockResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class WatchlistAddStock(BaseModel):
    """Add stock to watchlist."""
    symbol: str


# Alerts
class StockAlertCreate(BaseModel):
    """Create stock alert."""
    symbol: str
    alert_type: str = Field(description="price_above, price_below, percent_change")
    target_value: float
    notify_telegram: bool = True
    notify_email: bool = False


class StockAlertResponse(BaseModel):
    """Stock alert response."""
    id: str
    stock_symbol: str
    stock_name: str
    alert_type: str
    target_value: float
    current_price: Optional[float] = None
    is_active: bool
    is_triggered: bool
    triggered_at: Optional[datetime] = None
    notify_telegram: bool
    notify_email: bool
    created_at: datetime


# Dividends
class DividendResponse(BaseModel):
    """Dividend response."""
    id: str
    stock_symbol: str
    stock_name: str
    dividend_type: str
    amount_per_share: float
    qualification_date: Optional[date] = None
    payment_date: Optional[date] = None
    year: Optional[int] = None


class DividendCalendarResponse(BaseModel):
    """Dividend calendar response."""
    upcoming: List[DividendResponse]
    recent: List[DividendResponse]
