import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean, Text, Date

from app.core.database import Base
from sqlalchemy.orm import relationship


class DcaPlan(Base):
    __tablename__ = "dca_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    crypto = Column(String(10), nullable=False)
    target_amount_ngn = Column(Float, nullable=True)
    frequency = Column(String(20), nullable=False, default="weekly")
    start_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entries = relationship("DcaEntry", back_populates="plan", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DcaPlan {self.name} {self.crypto}>"


class DcaEntry(Base):
    __tablename__ = "dca_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_id = Column(String(36), ForeignKey("dca_plans.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    amount_ngn = Column(Float, nullable=False)
    price_per_unit_ngn = Column(Float, nullable=False)
    crypto_amount = Column(Float, nullable=False)
    exchange = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    plan = relationship("DcaPlan", back_populates="entries")

    def __repr__(self):
        return f"<DcaEntry {self.date} {self.amount_ngn} NGN>"
