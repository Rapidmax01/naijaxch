"""NGX Stock Alert service."""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.ngxradar.alert import StockAlert
from app.models.ngxradar.stock import Stock


class AlertService:
    """Service for stock alert operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_user_alerts(
        self,
        user_id: str,
        active_only: bool = True
    ) -> List[StockAlert]:
        """Get all alerts for a user."""
        query = self.db.query(StockAlert).filter(
            StockAlert.user_id == user_id
        )
        if active_only:
            query = query.filter(StockAlert.is_active == True)
        return query.all()

    def get_alert(self, alert_id: str, user_id: str) -> Optional[StockAlert]:
        """Get a specific alert."""
        return self.db.query(StockAlert).filter(
            StockAlert.id == alert_id,
            StockAlert.user_id == user_id
        ).first()

    def create_alert(
        self,
        user_id: str,
        stock_symbol: str,
        alert_type: str,
        target_value: float,
        notify_telegram: bool = True,
        notify_email: bool = False
    ) -> Optional[StockAlert]:
        """Create a new stock alert."""
        # Validate alert type
        valid_types = ["price_above", "price_below", "percent_change"]
        if alert_type not in valid_types:
            return None

        # Find stock
        stock = self.db.query(Stock).filter(
            Stock.symbol == stock_symbol.upper()
        ).first()
        if not stock:
            return None

        alert = StockAlert(
            user_id=user_id,
            stock_id=stock.id,
            alert_type=alert_type,
            target_value=target_value,
            notify_telegram=notify_telegram,
            notify_email=notify_email
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def delete_alert(self, alert_id: str, user_id: str) -> bool:
        """Delete an alert."""
        alert = self.get_alert(alert_id, user_id)
        if alert:
            self.db.delete(alert)
            self.db.commit()
            return True
        return False

    def toggle_alert(self, alert_id: str, user_id: str) -> Optional[StockAlert]:
        """Toggle alert active status."""
        alert = self.get_alert(alert_id, user_id)
        if alert:
            alert.is_active = not alert.is_active
            self.db.commit()
            self.db.refresh(alert)
            return alert
        return None

    def trigger_alert(self, alert_id: str) -> Optional[StockAlert]:
        """Mark an alert as triggered."""
        alert = self.db.query(StockAlert).filter(
            StockAlert.id == alert_id
        ).first()
        if alert:
            alert.is_triggered = True
            alert.triggered_at = datetime.utcnow()
            alert.is_active = False
            self.db.commit()
            self.db.refresh(alert)
            return alert
        return None

    def check_alerts(self) -> List[StockAlert]:
        """Check all active alerts against current prices."""
        triggered = []

        active_alerts = self.db.query(StockAlert).filter(
            StockAlert.is_active == True,
            StockAlert.is_triggered == False
        ).all()

        for alert in active_alerts:
            stock = self.db.query(Stock).filter(
                Stock.id == alert.stock_id
            ).first()

            if not stock or not stock.current_price:
                continue

            should_trigger = False
            current_price = float(stock.current_price)
            target = float(alert.target_value)

            if alert.alert_type == "price_above":
                should_trigger = current_price >= target
            elif alert.alert_type == "price_below":
                should_trigger = current_price <= target
            elif alert.alert_type == "percent_change":
                if stock.change_percent:
                    should_trigger = abs(float(stock.change_percent)) >= target

            if should_trigger:
                self.trigger_alert(alert.id)
                triggered.append(alert)

        return triggered
