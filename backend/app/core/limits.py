"""Plan limit checking utilities."""
from typing import Optional
from functools import wraps
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.payments.subscription_service import SubscriptionService


class PlanLimitError(HTTPException):
    """Raised when user exceeds their plan limits."""

    def __init__(self, limit_name: str, current_plan: str, required_plan: str = None):
        detail = {
            "error": "plan_limit_exceeded",
            "limit": limit_name,
            "current_plan": current_plan,
            "message": f"You have reached your {limit_name} limit on the {current_plan} plan.",
        }
        if required_plan:
            detail["required_plan"] = required_plan
            detail["message"] += f" Upgrade to {required_plan} or higher for more."

        super().__init__(status_code=403, detail=detail)


def check_limit(
    db: Session,
    user_id: str,
    product: str,
    limit_key: str,
    current_count: int,
) -> bool:
    """
    Check if user is within their plan limits.

    Returns True if within limits, raises PlanLimitError if exceeded.
    """
    service = SubscriptionService(db)
    limits = service.get_plan_limits(user_id, product)
    plan = service.get_active_plan(user_id, product)
    limit_value = limits.get(limit_key, 0)

    # -1 means unlimited
    if limit_value == -1:
        return True

    if current_count >= limit_value:
        raise PlanLimitError(limit_name=limit_key, current_plan=plan)

    return True


def get_user_limit(
    db: Session,
    user_id: str,
    product: str,
    limit_key: str,
) -> int:
    """Get a specific limit value for a user's plan."""
    service = SubscriptionService(db)
    limits = service.get_plan_limits(user_id, product)
    return limits.get(limit_key, 0)


def require_plan(product: str, allowed_plans: list[str]):
    """
    Dependency that checks if user has one of the allowed plans.

    Usage:
        @router.get("/premium-feature")
        async def premium_feature(
            _: None = Depends(require_plan("arbscanner", ["pro", "business"]))
        ):
            ...
    """
    async def check_plan(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        service = SubscriptionService(db)
        plan = service.get_active_plan(current_user.id, product)

        if plan not in allowed_plans:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "plan_required",
                    "current_plan": plan,
                    "required_plans": allowed_plans,
                    "message": f"This feature requires {' or '.join(allowed_plans)} plan.",
                }
            )

        return None

    return check_plan


class LimitChecker:
    """
    Helper class for checking multiple limits in an endpoint.

    Usage:
        limiter = LimitChecker(db, user_id, "arbscanner")
        limiter.check("alerts_per_day", current_alert_count)
    """

    def __init__(self, db: Session, user_id: str, product: str):
        self.db = db
        self.user_id = user_id
        self.product = product
        self.service = SubscriptionService(db)
        self._limits = None
        self._plan = None

    @property
    def limits(self):
        if self._limits is None:
            self._limits = self.service.get_plan_limits(self.user_id, self.product)
        return self._limits

    @property
    def plan(self):
        if self._plan is None:
            self._plan = self.service.get_active_plan(self.user_id, self.product)
        return self._plan

    def get(self, limit_key: str) -> int:
        """Get a specific limit value."""
        return self.limits.get(limit_key, 0)

    def is_unlimited(self, limit_key: str) -> bool:
        """Check if a limit is unlimited (-1)."""
        return self.get(limit_key) == -1

    def check(self, limit_key: str, current_count: int) -> bool:
        """
        Check if current count is within the limit.
        Raises PlanLimitError if exceeded.
        """
        limit_value = self.get(limit_key)

        if limit_value == -1:
            return True

        if current_count >= limit_value:
            raise PlanLimitError(limit_name=limit_key, current_plan=self.plan)

        return True

    def remaining(self, limit_key: str, current_count: int) -> int:
        """Get remaining quota for a limit."""
        limit_value = self.get(limit_key)

        if limit_value == -1:
            return -1  # Unlimited

        return max(0, limit_value - current_count)
