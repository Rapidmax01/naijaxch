import logging
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.dca import DcaPlan, DcaEntry
from app.core.redis import redis_client

logger = logging.getLogger(__name__)


class DcaService:
    def __init__(self, db: Session):
        self.db = db

    def get_plans(self, user_id: str) -> List[DcaPlan]:
        return self.db.query(DcaPlan).filter(DcaPlan.user_id == user_id).order_by(DcaPlan.created_at.desc()).all()

    def get_plan(self, plan_id: str, user_id: str) -> Optional[DcaPlan]:
        return self.db.query(DcaPlan).filter(DcaPlan.id == plan_id, DcaPlan.user_id == user_id).first()

    def create_plan(self, user_id: str, **kwargs) -> DcaPlan:
        plan = DcaPlan(user_id=user_id, **kwargs)
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        return plan

    def update_plan(self, plan_id: str, user_id: str, **kwargs) -> Optional[DcaPlan]:
        plan = self.get_plan(plan_id, user_id)
        if not plan:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(plan, key):
                setattr(plan, key, value)
        self.db.commit()
        self.db.refresh(plan)
        return plan

    def delete_plan(self, plan_id: str, user_id: str) -> bool:
        plan = self.get_plan(plan_id, user_id)
        if not plan:
            return False
        self.db.delete(plan)
        self.db.commit()
        return True

    def add_entry(self, plan_id: str, user_id: str, **kwargs) -> Optional[DcaEntry]:
        plan = self.get_plan(plan_id, user_id)
        if not plan:
            return None
        entry = DcaEntry(plan_id=plan_id, **kwargs)
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def delete_entry(self, entry_id: str, user_id: str) -> bool:
        entry = (
            self.db.query(DcaEntry)
            .join(DcaPlan)
            .filter(DcaEntry.id == entry_id, DcaPlan.user_id == user_id)
            .first()
        )
        if not entry:
            return False
        self.db.delete(entry)
        self.db.commit()
        return True

    def _get_live_price(self, crypto: str) -> Optional[float]:
        cached = redis_client.get_json(f"prices:{crypto}:NGN")
        if cached and cached.get("best_buy"):
            return cached["best_buy"].get("buy_price")
        return None

    def get_plan_summary(self, plan_id: str, user_id: str) -> Optional[dict]:
        plan = self.get_plan(plan_id, user_id)
        if not plan:
            return None

        entries = plan.entries
        total_invested = sum(e.amount_ngn for e in entries)
        total_crypto = sum(e.crypto_amount for e in entries)
        avg_cost = total_invested / total_crypto if total_crypto > 0 else 0
        current_price = self._get_live_price(plan.crypto)
        current_value = total_crypto * current_price if current_price else None
        pnl = current_value - total_invested if current_value is not None else None
        pnl_pct = (pnl / total_invested * 100) if pnl is not None and total_invested > 0 else None

        return {
            "id": plan.id,
            "user_id": plan.user_id,
            "name": plan.name,
            "crypto": plan.crypto,
            "target_amount_ngn": plan.target_amount_ngn,
            "frequency": plan.frequency,
            "start_date": plan.start_date,
            "is_active": plan.is_active,
            "created_at": plan.created_at,
            "entries": [
                {
                    "id": e.id,
                    "plan_id": e.plan_id,
                    "date": e.date,
                    "amount_ngn": e.amount_ngn,
                    "price_per_unit_ngn": e.price_per_unit_ngn,
                    "crypto_amount": e.crypto_amount,
                    "exchange": e.exchange,
                    "notes": e.notes,
                    "created_at": e.created_at,
                }
                for e in entries
            ],
            "total_invested_ngn": total_invested,
            "total_crypto": total_crypto,
            "avg_cost_ngn": avg_cost,
            "current_price_ngn": current_price,
            "current_value_ngn": current_value,
            "pnl_ngn": pnl,
            "pnl_percent": pnl_pct,
        }
