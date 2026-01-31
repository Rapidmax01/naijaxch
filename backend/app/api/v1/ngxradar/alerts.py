"""NGX Stock Alert endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.limits import LimitChecker
from app.services.ngxradar.alert_service import AlertService
from app.services.ngxradar.stock_service import StockService
from app.schemas.ngxradar import StockAlertCreate, StockAlertResponse

router = APIRouter()


def alert_to_response(alert, stock) -> StockAlertResponse:
    """Convert StockAlert model to response."""
    return StockAlertResponse(
        id=alert.id,
        stock_symbol=stock.symbol if stock else "",
        stock_name=stock.name if stock else "",
        alert_type=alert.alert_type,
        target_value=float(alert.target_value),
        current_price=float(stock.current_price) if stock and stock.current_price else None,
        is_active=alert.is_active,
        is_triggered=alert.is_triggered,
        triggered_at=alert.triggered_at,
        notify_telegram=alert.notify_telegram,
        notify_email=alert.notify_email,
        created_at=alert.created_at
    )


@router.get("/alerts", response_model=List[StockAlertResponse])
async def get_alerts(
    active_only: bool = True,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all alerts for the current user."""
    alert_service = AlertService(db)
    stock_service = StockService(db)

    alerts = alert_service.get_user_alerts(current_user.id, active_only)

    result = []
    for alert in alerts:
        stock = stock_service.get_stock_by_id(alert.stock_id)
        result.append(alert_to_response(alert, stock))

    return result


@router.post("/alerts", response_model=StockAlertResponse)
async def create_alert(
    data: StockAlertCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new stock price alert.

    Alert types:
    - price_above: Trigger when price rises above target
    - price_below: Trigger when price falls below target
    - percent_change: Trigger when daily % change exceeds target
    """
    alert_service = AlertService(db)
    stock_service = StockService(db)

    # Check plan limits
    limiter = LimitChecker(db, current_user.id, "ngxradar")
    current_alerts = len(alert_service.get_user_alerts(current_user.id, active_only=True))
    limiter.check("alerts", current_alerts)

    alert = alert_service.create_alert(
        user_id=current_user.id,
        stock_symbol=data.symbol,
        alert_type=data.alert_type,
        target_value=data.target_value,
        notify_telegram=data.notify_telegram,
        notify_email=data.notify_email
    )

    if not alert:
        raise HTTPException(
            status_code=400,
            detail="Could not create alert. Check symbol and alert type."
        )

    stock = stock_service.get_stock_by_id(alert.stock_id)
    return alert_to_response(alert, stock)


@router.get("/alerts/{alert_id}", response_model=StockAlertResponse)
async def get_alert(
    alert_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific alert."""
    alert_service = AlertService(db)
    stock_service = StockService(db)

    alert = alert_service.get_alert(alert_id, current_user.id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    stock = stock_service.get_stock_by_id(alert.stock_id)
    return alert_to_response(alert, stock)


@router.delete("/alerts/{alert_id}")
async def delete_alert(
    alert_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an alert."""
    alert_service = AlertService(db)

    if not alert_service.delete_alert(alert_id, current_user.id):
        raise HTTPException(status_code=404, detail="Alert not found")

    return {"message": "Alert deleted"}


@router.post("/alerts/{alert_id}/toggle", response_model=StockAlertResponse)
async def toggle_alert(
    alert_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle alert active status."""
    alert_service = AlertService(db)
    stock_service = StockService(db)

    alert = alert_service.toggle_alert(alert_id, current_user.id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    stock = stock_service.get_stock_by_id(alert.stock_id)
    return alert_to_response(alert, stock)
