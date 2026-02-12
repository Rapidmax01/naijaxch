import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Boolean, Text

from app.core.database import Base


class TradingSignal(Base):
    __tablename__ = "trading_signals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_type = Column(String(20), nullable=False)  # crypto, stock
    asset_symbol = Column(String(20), nullable=False)
    direction = Column(String(10), nullable=False)  # buy, sell
    entry_price = Column(Float, nullable=False)
    target_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    reasoning = Column(Text, nullable=True)
    timeframe = Column(String(20), nullable=True)  # short, medium, long
    status = Column(String(20), nullable=False, default="open")  # open, closed, cancelled
    result = Column(String(20), nullable=True)  # win, loss, breakeven
    result_percent = Column(Float, nullable=True)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<TradingSignal {self.direction} {self.asset_symbol}>"
