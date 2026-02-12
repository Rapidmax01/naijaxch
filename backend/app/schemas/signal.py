from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SignalCreate(BaseModel):
    asset_type: str
    asset_symbol: str
    direction: str
    entry_price: float
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    reasoning: Optional[str] = None
    timeframe: Optional[str] = None
    is_premium: bool = False


class SignalUpdate(BaseModel):
    status: Optional[str] = None
    result: Optional[str] = None
    result_percent: Optional[float] = None
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    reasoning: Optional[str] = None


class SignalResponse(BaseModel):
    id: str
    asset_type: str
    asset_symbol: str
    direction: str
    entry_price: float
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    reasoning: Optional[str] = None
    timeframe: Optional[str] = None
    status: str
    result: Optional[str] = None
    result_percent: Optional[float] = None
    is_premium: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SignalListResponse(BaseModel):
    signals: List[SignalResponse]
    total: int


class SignalStatsResponse(BaseModel):
    total_signals: int = 0
    open_signals: int = 0
    closed_signals: int = 0
    win_rate: float = 0
    avg_return: float = 0
