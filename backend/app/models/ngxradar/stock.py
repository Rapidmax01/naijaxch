import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, Numeric, BigInteger, ForeignKey

from app.core.database import Base


class Stock(Base):
    """NGX listed stock model."""

    __tablename__ = "stocks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    sector = Column(String(100), nullable=True)
    industry = Column(String(100), nullable=True)

    # Current price data
    current_price = Column(Numeric(20, 2), nullable=True)
    change = Column(Numeric(20, 2), nullable=True)
    change_percent = Column(Numeric(10, 4), nullable=True)
    volume = Column(BigInteger, nullable=True)

    # Fundamentals
    market_cap = Column(Numeric(20, 2), nullable=True)
    shares_outstanding = Column(BigInteger, nullable=True)
    pe_ratio = Column(Numeric(10, 4), nullable=True)
    eps = Column(Numeric(10, 4), nullable=True)
    dividend_yield = Column(Numeric(10, 4), nullable=True)

    # 52 week range
    high_52w = Column(Numeric(20, 2), nullable=True)
    low_52w = Column(Numeric(20, 2), nullable=True)

    listing_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Stock {self.symbol}>"


class StockPrice(Base):
    """Historical stock price model."""

    __tablename__ = "stock_prices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    stock_id = Column(String(36), ForeignKey("stocks.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)

    open_price = Column(Numeric(20, 2), nullable=True)
    high_price = Column(Numeric(20, 2), nullable=True)
    low_price = Column(Numeric(20, 2), nullable=True)
    close_price = Column(Numeric(20, 2), nullable=False)
    volume = Column(BigInteger, nullable=True)
    trades = Column(BigInteger, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<StockPrice {self.stock_id} {self.date}>"
