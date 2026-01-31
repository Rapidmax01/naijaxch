from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.limits import LimitChecker
from app.models.user import User
from app.models.arbscanner.alert import ArbAlert
from app.schemas.arbscanner import AlertCreate, AlertUpdate, AlertResponse

router = APIRouter()


@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all alerts for the current user."""
    alerts = db.query(ArbAlert).filter(
        ArbAlert.user_id == current_user.id
    ).all()
    return alerts


@router.post("/alerts", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_data: AlertCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new arbitrage alert.

    You will be notified when an arbitrage opportunity matches
    your criteria (minimum spread, specific exchanges, etc.)
    """
    # Check plan limits
    limiter = LimitChecker(db, current_user.id, "arbscanner")

    # Count alerts created today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_alerts = db.query(ArbAlert).filter(
        ArbAlert.user_id == current_user.id,
        ArbAlert.created_at >= today_start
    ).count()

    limiter.check("alerts_per_day", today_alerts)

    # Check if user can use the specified crypto
    allowed_cryptos = limiter.get("cryptos")
    if allowed_cryptos != "all" and isinstance(allowed_cryptos, list):
        if alert_data.crypto not in allowed_cryptos:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "crypto_not_allowed",
                    "crypto": alert_data.crypto,
                    "allowed": allowed_cryptos,
                    "message": f"Your plan only supports: {', '.join(allowed_cryptos)}. Upgrade for more crypto pairs."
                }
            )

    alert = ArbAlert(
        user_id=current_user.id,
        crypto=alert_data.crypto,
        min_spread_percent=alert_data.min_spread_percent,
        buy_exchanges=alert_data.buy_exchanges,
        sell_exchanges=alert_data.sell_exchanges,
        notify_telegram=alert_data.notify_telegram,
        notify_email=alert_data.notify_email
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return alert


@router.get("/alerts/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific alert."""
    alert = db.query(ArbAlert).filter(
        ArbAlert.id == alert_id,
        ArbAlert.user_id == current_user.id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )

    return alert


@router.put("/alerts/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: UUID,
    alert_data: AlertUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing alert."""
    alert = db.query(ArbAlert).filter(
        ArbAlert.id == alert_id,
        ArbAlert.user_id == current_user.id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )

    update_data = alert_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(alert, field, value)

    db.commit()
    db.refresh(alert)

    return alert


@router.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an alert."""
    alert = db.query(ArbAlert).filter(
        ArbAlert.id == alert_id,
        ArbAlert.user_id == current_user.id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )

    db.delete(alert)
    db.commit()

    return None
