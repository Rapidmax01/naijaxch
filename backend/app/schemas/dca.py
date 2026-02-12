from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


class DcaPlanCreate(BaseModel):
    name: str
    crypto: str
    target_amount_ngn: Optional[float] = None
    frequency: str = "weekly"
    start_date: Optional[date] = None


class DcaPlanUpdate(BaseModel):
    name: Optional[str] = None
    target_amount_ngn: Optional[float] = None
    frequency: Optional[str] = None
    is_active: Optional[bool] = None


class DcaEntryCreate(BaseModel):
    date: date
    amount_ngn: float = Field(gt=0)
    price_per_unit_ngn: float = Field(gt=0)
    crypto_amount: float = Field(gt=0)
    exchange: Optional[str] = None
    notes: Optional[str] = None


class DcaEntryResponse(BaseModel):
    id: str
    plan_id: str
    date: date
    amount_ngn: float
    price_per_unit_ngn: float
    crypto_amount: float
    exchange: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DcaPlanResponse(BaseModel):
    id: str
    user_id: str
    name: str
    crypto: str
    target_amount_ngn: Optional[float] = None
    frequency: str
    start_date: Optional[date] = None
    is_active: bool
    created_at: datetime
    entries: List[DcaEntryResponse] = []
    total_invested_ngn: Optional[float] = None
    total_crypto: Optional[float] = None
    avg_cost_ngn: Optional[float] = None
    current_price_ngn: Optional[float] = None
    current_value_ngn: Optional[float] = None
    pnl_ngn: Optional[float] = None
    pnl_percent: Optional[float] = None

    class Config:
        from_attributes = True
