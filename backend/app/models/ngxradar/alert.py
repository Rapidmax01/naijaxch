import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, ForeignKey

from app.core.database import Base


class StockAlert(Base):
    """Stock price alert model."""

    __tablename__ = "stock_alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    stock_id = Column(String(36), ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)

    alert_type = Column(String(20), nullable=False)  # price_above, price_below, percent_change
    target_value = Column(Numeric(20, 4), nullable=False)

    is_active = Column(Boolean, default=True)
    is_triggered = Column(Boolean, default=False)
    triggered_at = Column(DateTime, nullable=True)

    notify_telegram = Column(Boolean, default=True)
    notify_email = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<StockAlert {self.stock_id} {self.alert_type}>"
