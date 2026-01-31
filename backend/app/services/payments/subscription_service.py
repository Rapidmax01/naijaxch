"""Subscription management service."""
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from sqlalchemy.orm import Session

from app.models.subscription import (
    Subscription,
    Payment,
    ProductType,
    PlanType,
    SubscriptionStatus,
    BillingCycle,
)
from app.models.user import User


# Pricing configuration (in NGN)
PRICING = {
    ProductType.ARBSCANNER.value: {
        PlanType.FREE.value: {"monthly": 0, "quarterly": 0, "yearly": 0},
        PlanType.STARTER.value: {"monthly": 3000, "quarterly": 7500, "yearly": 27000},
        PlanType.PRO.value: {"monthly": 10000, "quarterly": 25000, "yearly": 90000},
        PlanType.BUSINESS.value: {"monthly": 30000, "quarterly": 75000, "yearly": 270000},
    },
    ProductType.NGXRADAR.value: {
        PlanType.FREE.value: {"monthly": 0, "quarterly": 0, "yearly": 0},
        PlanType.BASIC.value: {"monthly": 2500, "quarterly": 6000, "yearly": 22500},
        PlanType.PRO.value: {"monthly": 7500, "quarterly": 18000, "yearly": 67500},
        PlanType.INVESTOR.value: {"monthly": 15000, "quarterly": 36000, "yearly": 135000},
    },
}

# Plan limits
PLAN_LIMITS = {
    ProductType.ARBSCANNER.value: {
        PlanType.FREE.value: {
            "refresh_minutes": 15,
            "alerts_per_day": 3,
            "exchanges": 3,
            "cryptos": ["USDT"],
            "history_hours": 24,
        },
        PlanType.STARTER.value: {
            "refresh_minutes": 5,
            "alerts_per_day": 20,
            "exchanges": 5,
            "cryptos": ["USDT", "BTC"],
            "history_days": 7,
        },
        PlanType.PRO.value: {
            "refresh_minutes": 1,
            "alerts_per_day": -1,  # Unlimited
            "exchanges": -1,
            "cryptos": "all",
            "history_days": 30,
        },
        PlanType.BUSINESS.value: {
            "refresh_minutes": 1,
            "alerts_per_day": -1,
            "exchanges": -1,
            "cryptos": "all",
            "history_days": -1,
        },
    },
    ProductType.NGXRADAR.value: {
        PlanType.FREE.value: {
            "watchlist_stocks": 5,
            "alerts": 2,
            "history_months": 1,
            "screener": "basic",
        },
        PlanType.BASIC.value: {
            "watchlist_stocks": 20,
            "alerts": 10,
            "history_months": 12,
            "screener": "full",
        },
        PlanType.PRO.value: {
            "watchlist_stocks": -1,
            "alerts": -1,
            "history_months": 60,
            "screener": "full",
            "portfolio": True,
        },
        PlanType.INVESTOR.value: {
            "watchlist_stocks": -1,
            "alerts": -1,
            "history_months": 120,
            "screener": "full",
            "portfolio": True,
            "api_access": True,
        },
    },
}


class SubscriptionService:
    """Service for subscription management."""

    def __init__(self, db: Session):
        self.db = db

    def get_user_subscriptions(self, user_id: str) -> List[Subscription]:
        """Get all subscriptions for a user."""
        return self.db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).all()

    def get_subscription(self, user_id: str, product: str) -> Optional[Subscription]:
        """Get user's subscription for a specific product."""
        return self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.product == product,
        ).first()

    def get_active_plan(self, user_id: str, product: str) -> str:
        """Get user's active plan for a product."""
        sub = self.get_subscription(user_id, product)
        if sub and sub.is_active:
            return sub.plan
        return PlanType.FREE.value

    def get_plan_limits(self, user_id: str, product: str) -> Dict:
        """Get plan limits for user's subscription."""
        plan = self.get_active_plan(user_id, product)
        return PLAN_LIMITS.get(product, {}).get(plan, PLAN_LIMITS[product][PlanType.FREE.value])

    def get_pricing(self, product: str, plan: str, cycle: str) -> int:
        """Get price for a plan."""
        return PRICING.get(product, {}).get(plan, {}).get(cycle, 0)

    def calculate_expiry(self, cycle: str) -> datetime:
        """Calculate subscription expiry date."""
        now = datetime.utcnow()
        if cycle == BillingCycle.MONTHLY.value:
            return now + timedelta(days=30)
        elif cycle == BillingCycle.QUARTERLY.value:
            return now + timedelta(days=90)
        elif cycle == BillingCycle.YEARLY.value:
            return now + timedelta(days=365)
        return now + timedelta(days=30)

    def create_payment(
        self,
        user_id: str,
        amount_ngn: float,
        reference: str,
        subscription_id: Optional[str] = None,
    ) -> Payment:
        """Create a payment record."""
        payment = Payment(
            user_id=user_id,
            subscription_id=subscription_id,
            amount_ngn=Decimal(str(amount_ngn)),
            paystack_reference=reference,
            status="pending",
        )
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def confirm_payment(self, reference: str, paid_at: datetime = None) -> Optional[Payment]:
        """Confirm a payment was successful."""
        payment = self.db.query(Payment).filter(
            Payment.paystack_reference == reference
        ).first()

        if payment:
            payment.status = "success"
            payment.paid_at = paid_at or datetime.utcnow()
            self.db.commit()
            self.db.refresh(payment)

        return payment

    def upgrade_subscription(
        self,
        user_id: str,
        product: str,
        plan: str,
        cycle: str,
        payment_reference: str,
    ) -> Subscription:
        """Upgrade or create a subscription after successful payment."""
        price = self.get_pricing(product, plan, cycle)
        expires_at = self.calculate_expiry(cycle)

        subscription = self.get_subscription(user_id, product)

        if subscription:
            # Upgrade existing
            subscription.plan = plan
            subscription.status = SubscriptionStatus.ACTIVE.value
            subscription.price_ngn = Decimal(str(price))
            subscription.billing_cycle = cycle
            subscription.started_at = datetime.utcnow()
            subscription.expires_at = expires_at
        else:
            # Create new
            subscription = Subscription(
                user_id=user_id,
                product=product,
                plan=plan,
                status=SubscriptionStatus.ACTIVE.value,
                price_ngn=Decimal(str(price)),
                billing_cycle=cycle,
                started_at=datetime.utcnow(),
                expires_at=expires_at,
            )
            self.db.add(subscription)

        # Update payment with subscription ID
        payment = self.db.query(Payment).filter(
            Payment.paystack_reference == payment_reference
        ).first()
        if payment:
            payment.subscription_id = subscription.id

        self.db.commit()
        self.db.refresh(subscription)
        return subscription

    def cancel_subscription(self, user_id: str, product: str) -> bool:
        """Cancel a subscription (downgrade to free at period end)."""
        subscription = self.get_subscription(user_id, product)
        if subscription:
            subscription.status = SubscriptionStatus.CANCELLED.value
            self.db.commit()
            return True
        return False

    def check_limit(self, user_id: str, product: str, limit_key: str, current_count: int) -> bool:
        """Check if user is within their plan limits."""
        limits = self.get_plan_limits(user_id, product)
        limit_value = limits.get(limit_key, 0)

        if limit_value == -1:  # Unlimited
            return True

        return current_count < limit_value

    def get_all_plans(self, product: str) -> List[Dict]:
        """Get all available plans for a product with pricing."""
        product_pricing = PRICING.get(product, {})
        product_limits = PLAN_LIMITS.get(product, {})

        plans = []
        for plan_name, prices in product_pricing.items():
            plans.append({
                "name": plan_name,
                "prices": prices,
                "limits": product_limits.get(plan_name, {}),
            })

        return plans
