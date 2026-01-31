import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, ForeignKey

from app.core.database import Base


class ArbitrageOpportunity(Base):
    """Detected arbitrage opportunity model."""

    __tablename__ = "arbitrage_opportunities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    crypto = Column(String(10), nullable=False)

    buy_exchange_id = Column(String(36), ForeignKey("exchanges.id"))
    sell_exchange_id = Column(String(36), ForeignKey("exchanges.id"))

    buy_price = Column(Numeric(20, 2), nullable=False)
    sell_price = Column(Numeric(20, 2), nullable=False)

    spread_percent = Column(Numeric(10, 4), nullable=False)
    estimated_fees = Column(Numeric(20, 2), nullable=True)
    net_profit_percent = Column(Numeric(10, 4), nullable=True)

    min_trade_amount = Column(Numeric(20, 2), nullable=True)
    max_trade_amount = Column(Numeric(20, 2), nullable=True)

    detected_at = Column(DateTime, default=datetime.utcnow)
    expired_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<ArbitrageOpportunity {self.crypto} {self.spread_percent}%>"
