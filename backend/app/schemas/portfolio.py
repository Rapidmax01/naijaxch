from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class HoldingCreate(BaseModel):
    crypto: str
    amount: float = Field(gt=0)
    buy_price_ngn: float = Field(gt=0)
    notes: Optional[str] = None


class HoldingUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    buy_price_ngn: Optional[float] = Field(default=None, gt=0)
    notes: Optional[str] = None


class HoldingResponse(BaseModel):
    id: str
    portfolio_id: str
    crypto: str
    amount: float
    buy_price_ngn: float
    notes: Optional[str] = None
    added_at: datetime
    current_price_ngn: Optional[float] = None
    current_value_ngn: Optional[float] = None
    cost_basis_ngn: Optional[float] = None
    pnl_ngn: Optional[float] = None
    pnl_percent: Optional[float] = None

    class Config:
        from_attributes = True


class PortfolioResponse(BaseModel):
    id: str
    user_id: str
    name: str
    created_at: datetime
    holdings: List[HoldingResponse] = []

    class Config:
        from_attributes = True


class PortfolioSummaryResponse(BaseModel):
    portfolio: PortfolioResponse
    total_value_ngn: float = 0
    total_cost_ngn: float = 0
    total_pnl_ngn: float = 0
    total_pnl_percent: float = 0
    allocation: List[dict] = []
