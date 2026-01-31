from datetime import datetime
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey

from app.core.database import Base


class CryptoPrice(Base):
    """
    Crypto price model for storing historical prices.
    Note: In production with TimescaleDB, this would be a hypertable.
    """

    __tablename__ = "crypto_prices"

    time = Column(DateTime, primary_key=True, default=datetime.utcnow)
    exchange_id = Column(String(36), ForeignKey("exchanges.id"), primary_key=True)
    crypto = Column(String(10), nullable=False, primary_key=True)
    fiat = Column(String(10), default="NGN")

    buy_price = Column(Numeric(20, 2), nullable=True)
    sell_price = Column(Numeric(20, 2), nullable=True)
    volume_24h = Column(Numeric(20, 2), nullable=True)

    def __repr__(self):
        return f"<CryptoPrice {self.crypto} @ {self.time}>"
