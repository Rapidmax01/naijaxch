import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False, default="My Portfolio")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    holdings = relationship("PortfolioHolding", back_populates="portfolio", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Portfolio {self.name}>"


class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = Column(String(36), ForeignKey("portfolios.id"), nullable=False, index=True)
    crypto = Column(String(10), nullable=False)
    amount = Column(Float, nullable=False)
    buy_price_ngn = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)

    portfolio = relationship("Portfolio", back_populates="holdings")

    def __repr__(self):
        return f"<PortfolioHolding {self.crypto} {self.amount}>"
