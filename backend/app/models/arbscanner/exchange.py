import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Exchange(Base):
    """Crypto exchange model."""

    __tablename__ = "exchanges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    type = Column(String(20))  # p2p or exchange
    logo_url = Column(String(500), nullable=True)
    website_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    fees = relationship("ExchangeFee", back_populates="exchange")

    def __repr__(self):
        return f"<Exchange {self.name}>"


class ExchangeFee(Base):
    """Exchange fee structure model."""

    __tablename__ = "exchange_fees"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exchange_id = Column(String(36), ForeignKey("exchanges.id"))

    crypto = Column(String(10), nullable=False)
    network = Column(String(20), nullable=True)  # TRC20, BEP20, ERC20, etc.

    trading_fee_percent = Column(Numeric(5, 4), default=0)
    withdrawal_fee = Column(Numeric(20, 8), default=0)
    deposit_fee = Column(Numeric(20, 8), default=0)
    min_withdrawal = Column(Numeric(20, 8), nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    exchange = relationship("Exchange", back_populates="fees")

    def __repr__(self):
        return f"<ExchangeFee {self.exchange_id}:{self.crypto}>"
