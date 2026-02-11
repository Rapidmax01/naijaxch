from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class ExchangeInfo(BaseModel):
    """Exchange information."""
    id: UUID
    name: str
    display_name: str
    type: str
    logo_url: Optional[str] = None
    is_active: bool = True


class ExchangePriceResponse(BaseModel):
    """Response for exchange price."""
    exchange: str
    display_name: str
    crypto: str
    fiat: str = "NGN"
    buy_price: float
    sell_price: float
    spread: float
    spread_percent: float
    volume_24h: Optional[float] = None
    data_source: str = "live"
    updated_at: datetime


class AllPricesResponse(BaseModel):
    """Response for all exchange prices."""
    crypto: str
    fiat: str = "NGN"
    exchanges: List[ExchangePriceResponse]
    best_buy: Optional[ExchangePriceResponse] = None
    best_sell: Optional[ExchangePriceResponse] = None
    exchange_statuses: Optional[Dict[str, str]] = None
    updated_at: datetime


class FeesBreakdown(BaseModel):
    """Fee breakdown for arbitrage."""
    buy_fee: float
    sell_fee: float
    withdrawal_fee: float
    total: float


class ArbitrageOpportunityResponse(BaseModel):
    """Response for an arbitrage opportunity."""
    id: Optional[UUID] = None
    crypto: str
    buy_exchange: str
    sell_exchange: str
    buy_price: float
    sell_price: float
    gross_spread: float
    gross_spread_percent: float
    fees: FeesBreakdown
    net_profit: float
    net_profit_percent: float
    is_profitable: bool
    min_trade_amount: Optional[float] = None
    max_trade_amount: Optional[float] = None
    detected_at: Optional[datetime] = None


class OpportunitiesListResponse(BaseModel):
    """Response for list of opportunities."""
    opportunities: List[ArbitrageOpportunityResponse]
    total: int
    updated_at: datetime


class ArbitrageCalculateRequest(BaseModel):
    """Request for calculating arbitrage."""
    buy_exchange: str
    sell_exchange: str
    crypto: str = "USDT"
    trade_amount_ngn: float = Field(default=100000, gt=0)


class ArbitrageCalculateResponse(ArbitrageOpportunityResponse):
    """Response for arbitrage calculation."""
    trade_amount_ngn: float
    crypto_amount: float
    roi: float


class AlertCreate(BaseModel):
    """Schema for creating an alert."""
    crypto: Optional[str] = None  # None = all cryptos
    min_spread_percent: float = Field(default=1.0, ge=0)
    buy_exchanges: Optional[List[UUID]] = None
    sell_exchanges: Optional[List[UUID]] = None
    notify_telegram: bool = True
    notify_email: bool = False


class AlertUpdate(BaseModel):
    """Schema for updating an alert."""
    crypto: Optional[str] = None
    min_spread_percent: Optional[float] = None
    buy_exchanges: Optional[List[UUID]] = None
    sell_exchanges: Optional[List[UUID]] = None
    is_active: Optional[bool] = None
    notify_telegram: Optional[bool] = None
    notify_email: Optional[bool] = None


class AlertResponse(BaseModel):
    """Response for an alert."""
    id: UUID
    user_id: UUID
    crypto: Optional[str]
    min_spread_percent: float
    buy_exchanges: Optional[List[UUID]]
    sell_exchanges: Optional[List[UUID]]
    is_active: bool
    notify_telegram: bool
    notify_email: bool
    created_at: datetime

    class Config:
        from_attributes = True


class HistoryFilter(BaseModel):
    """Filter for historical opportunities."""
    crypto: Optional[str] = None
    min_spread_percent: Optional[float] = None
    buy_exchange: Optional[str] = None
    sell_exchange: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = Field(default=50, le=200)
    offset: int = Field(default=0, ge=0)
