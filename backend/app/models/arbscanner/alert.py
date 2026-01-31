import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, ForeignKey, Text

from app.core.database import Base


class ArbAlert(Base):
    """User arbitrage alert configuration model."""

    __tablename__ = "arb_alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"))

    crypto = Column(String(10), nullable=True)  # Null = all cryptos
    min_spread_percent = Column(Numeric(5, 2), default=1.0)

    # Store as JSON string for SQLite compatibility
    buy_exchanges = Column(Text, nullable=True)
    sell_exchanges = Column(Text, nullable=True)

    is_active = Column(Boolean, default=True)
    notify_telegram = Column(Boolean, default=True)
    notify_email = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ArbAlert {self.user_id}:{self.crypto}>"
