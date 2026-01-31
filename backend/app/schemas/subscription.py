"""Subscription and payment schemas."""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime


class PlanInfo(BaseModel):
    """Plan information."""
    name: str
    prices: Dict[str, int]
    limits: Dict[str, Any]


class SubscriptionResponse(BaseModel):
    """Subscription response."""
    id: str
    product: str
    plan: str
    status: str
    price_ngn: Optional[float] = None
    billing_cycle: Optional[str] = None
    started_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True


class InitializePaymentRequest(BaseModel):
    """Request to initialize a payment."""
    product: str = Field(..., description="arbscanner or ngxradar")
    plan: str = Field(..., description="Plan name (starter, pro, etc)")
    billing_cycle: str = Field(default="monthly", description="monthly, quarterly, yearly")


class InitializePaymentResponse(BaseModel):
    """Response from payment initialization."""
    reference: str
    authorization_url: str
    access_code: str


class VerifyPaymentRequest(BaseModel):
    """Request to verify a payment."""
    reference: str


class PaymentResponse(BaseModel):
    """Payment response."""
    id: str
    amount_ngn: float
    status: str
    reference: str
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WebhookEvent(BaseModel):
    """Paystack webhook event."""
    event: str
    data: Dict[str, Any]


class PlansResponse(BaseModel):
    """Available plans response."""
    product: str
    plans: List[PlanInfo]


class UserLimitsResponse(BaseModel):
    """User's current plan limits."""
    product: str
    plan: str
    limits: Dict[str, Any]
