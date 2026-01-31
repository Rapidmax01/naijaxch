"""Subscription and payment endpoints."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, Header, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.subscription import ProductType
from app.services.payments.paystack import PaystackService, PaystackError
from app.services.payments.subscription_service import SubscriptionService
from app.services.email import email_service
from app.schemas.subscription import (
    SubscriptionResponse,
    InitializePaymentRequest,
    InitializePaymentResponse,
    VerifyPaymentRequest,
    PaymentResponse,
    PlansResponse,
    UserLimitsResponse,
)
from app.config import settings

router = APIRouter()


@router.get("/subscriptions", response_model=List[SubscriptionResponse])
async def get_my_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's subscriptions."""
    service = SubscriptionService(db)
    subscriptions = service.get_user_subscriptions(current_user.id)

    return [
        SubscriptionResponse(
            id=sub.id,
            product=sub.product,
            plan=sub.plan,
            status=sub.status,
            price_ngn=float(sub.price_ngn) if sub.price_ngn else None,
            billing_cycle=sub.billing_cycle,
            started_at=sub.started_at,
            expires_at=sub.expires_at,
            is_active=sub.is_active,
        )
        for sub in subscriptions
    ]


@router.get("/subscriptions/{product}", response_model=SubscriptionResponse)
async def get_subscription(
    product: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get subscription for a specific product."""
    if product not in [p.value for p in ProductType]:
        raise HTTPException(status_code=400, detail="Invalid product")

    service = SubscriptionService(db)
    sub = service.get_subscription(current_user.id, product)

    if not sub:
        # Return free tier info
        return SubscriptionResponse(
            id="",
            product=product,
            plan="free",
            status="active",
            is_active=True,
        )

    return SubscriptionResponse(
        id=sub.id,
        product=sub.product,
        plan=sub.plan,
        status=sub.status,
        price_ngn=float(sub.price_ngn) if sub.price_ngn else None,
        billing_cycle=sub.billing_cycle,
        started_at=sub.started_at,
        expires_at=sub.expires_at,
        is_active=sub.is_active,
    )


@router.get("/subscriptions/{product}/limits", response_model=UserLimitsResponse)
async def get_my_limits(
    product: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's plan limits for a product."""
    if product not in [p.value for p in ProductType]:
        raise HTTPException(status_code=400, detail="Invalid product")

    service = SubscriptionService(db)
    plan = service.get_active_plan(current_user.id, product)
    limits = service.get_plan_limits(current_user.id, product)

    return UserLimitsResponse(
        product=product,
        plan=plan,
        limits=limits,
    )


@router.get("/plans/{product}", response_model=PlansResponse)
async def get_plans(product: str, db: Session = Depends(get_db)):
    """Get available plans for a product."""
    if product not in [p.value for p in ProductType]:
        raise HTTPException(status_code=400, detail="Invalid product")

    service = SubscriptionService(db)
    plans = service.get_all_plans(product)

    return PlansResponse(product=product, plans=plans)


@router.post("/payments/initialize", response_model=InitializePaymentResponse)
async def initialize_payment(
    request: InitializePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Initialize a payment for subscription upgrade."""
    if request.product not in [p.value for p in ProductType]:
        raise HTTPException(status_code=400, detail="Invalid product")

    sub_service = SubscriptionService(db)
    price = sub_service.get_pricing(request.product, request.plan, request.billing_cycle)

    if price == 0:
        raise HTTPException(status_code=400, detail="Cannot pay for free plan")

    # Generate unique reference
    reference = f"NTT-{uuid.uuid4().hex[:12].upper()}"

    # Create payment record
    sub_service.create_payment(
        user_id=current_user.id,
        amount_ngn=price,
        reference=reference,
    )

    # Initialize Paystack transaction
    paystack = PaystackService()

    try:
        result = await paystack.initialize_transaction(
            email=current_user.email,
            amount_ngn=price,
            reference=reference,
            callback_url=f"{settings.FRONTEND_URL}/payment/verify?reference={reference}",
            metadata={
                "user_id": current_user.id,
                "product": request.product,
                "plan": request.plan,
                "billing_cycle": request.billing_cycle,
            },
        )

        return InitializePaymentResponse(
            reference=reference,
            authorization_url=result["authorization_url"],
            access_code=result["access_code"],
        )

    except PaystackError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payments/verify", response_model=PaymentResponse)
async def verify_payment(
    request: VerifyPaymentRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verify a payment and activate subscription."""
    paystack = PaystackService()
    sub_service = SubscriptionService(db)

    try:
        result = await paystack.verify_transaction(request.reference)

        if result["status"] != "success":
            raise HTTPException(status_code=400, detail="Payment was not successful")

        # Confirm payment
        payment = sub_service.confirm_payment(
            reference=request.reference,
            paid_at=result.get("paid_at"),
        )

        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")

        # Extract metadata
        metadata = result.get("metadata", {})
        product = metadata.get("product")
        plan = metadata.get("plan")
        billing_cycle = metadata.get("billing_cycle", "monthly")

        if product and plan:
            # Upgrade subscription
            sub_service.upgrade_subscription(
                user_id=current_user.id,
                product=product,
                plan=plan,
                cycle=billing_cycle,
                payment_reference=request.reference,
            )

            # Send payment receipt email
            background_tasks.add_task(
                email_service.send_payment_receipt,
                to=current_user.email,
                amount=float(payment.amount_ngn),
                reference=request.reference,
                product=product,
                plan=plan,
                paid_at=payment.paid_at,
            )

        return PaymentResponse(
            id=payment.id,
            amount_ngn=float(payment.amount_ngn),
            status=payment.status,
            reference=payment.paystack_reference,
            paid_at=payment.paid_at,
        )

    except PaystackError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/subscriptions/{product}/cancel")
async def cancel_subscription(
    product: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel a subscription (will downgrade to free at period end)."""
    if product not in [p.value for p in ProductType]:
        raise HTTPException(status_code=400, detail="Invalid product")

    service = SubscriptionService(db)
    success = service.cancel_subscription(current_user.id, product)

    if not success:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return {"message": "Subscription cancelled. You'll have access until the end of your billing period."}


@router.post("/webhooks/paystack")
async def paystack_webhook(
    request: Request,
    x_paystack_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Handle Paystack webhook events."""
    body = await request.body()

    # Verify signature
    paystack = PaystackService()
    if x_paystack_signature and not paystack.verify_webhook_signature(body, x_paystack_signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    data = await request.json()
    event = data.get("event")
    event_data = data.get("data", {})

    sub_service = SubscriptionService(db)

    if event == "charge.success":
        reference = event_data.get("reference")
        if reference:
            # Confirm payment
            sub_service.confirm_payment(reference)

            # Get metadata and upgrade subscription
            metadata = event_data.get("metadata", {})
            user_id = metadata.get("user_id")
            product = metadata.get("product")
            plan = metadata.get("plan")
            billing_cycle = metadata.get("billing_cycle", "monthly")

            if user_id and product and plan:
                sub_service.upgrade_subscription(
                    user_id=user_id,
                    product=product,
                    plan=plan,
                    cycle=billing_cycle,
                    payment_reference=reference,
                )

    elif event == "subscription.create":
        # Handle subscription created
        pass

    elif event == "subscription.disable":
        # Handle subscription cancelled
        pass

    elif event == "invoice.payment_failed":
        # Handle failed payment - could send notification
        pass

    return {"status": "ok"}
