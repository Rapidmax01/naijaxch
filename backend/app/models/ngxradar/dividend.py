import uuid
from datetime import datetime
from sqlalchemy import Column, String, Date, DateTime, Numeric, Integer, ForeignKey

from app.core.database import Base


class Dividend(Base):
    """Stock dividend model."""

    __tablename__ = "dividends"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    stock_id = Column(String(36), ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)

    dividend_type = Column(String(20), nullable=False)  # interim, final, special
    amount_per_share = Column(Numeric(10, 4), nullable=False)

    declaration_date = Column(Date, nullable=True)
    qualification_date = Column(Date, nullable=True)
    closure_date = Column(Date, nullable=True)
    payment_date = Column(Date, nullable=True)

    year = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Dividend {self.stock_id} {self.amount_per_share}>"
