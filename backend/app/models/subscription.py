import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ProductType(str, enum.Enum):
    ARBSCANNER = "arbscanner"
    NGXRADAR = "ngxradar"
    BUNDLE = "bundle"


class PlanType(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    BASIC = "basic"
    PRO = "pro"
    BUSINESS = "business"
    INVESTOR = "investor"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    TRIAL = "trial"


class BillingCycle(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class Subscription(Base):
    """User subscription model."""

    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"))

    product = Column(String(20), nullable=False)
    plan = Column(String(20), nullable=False, default=PlanType.FREE.value)
    status = Column(String(20), default=SubscriptionStatus.ACTIVE.value)

    price_ngn = Column(Numeric(10, 2), nullable=True)
    billing_cycle = Column(String(20), nullable=True)

    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    paystack_subscription_code = Column(String(100), nullable=True)
    paystack_customer_code = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="subscriptions")

    @property
    def is_active(self) -> bool:
        """Check if subscription is currently active."""
        if self.status != SubscriptionStatus.ACTIVE.value:
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return True

    def __repr__(self):
        return f"<Subscription {self.product}:{self.plan}>"


class Payment(Base):
    """Payment transaction model."""

    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"))
    subscription_id = Column(String(36), ForeignKey("subscriptions.id"), nullable=True)

    amount_ngn = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default="pending")
    paystack_reference = Column(String(100), unique=True)

    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Payment {self.paystack_reference}>"
