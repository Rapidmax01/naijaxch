import logging
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.portfolio import Portfolio, PortfolioHolding
from app.core.redis import redis_client

logger = logging.getLogger(__name__)


class PortfolioService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_portfolio(self, user_id: str, name: str = "My Portfolio") -> Portfolio:
        portfolio = self.db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
        if not portfolio:
            portfolio = Portfolio(user_id=user_id, name=name)
            self.db.add(portfolio)
            self.db.commit()
            self.db.refresh(portfolio)
        return portfolio

    def get_portfolio(self, user_id: str) -> Optional[Portfolio]:
        return self.db.query(Portfolio).filter(Portfolio.user_id == user_id).first()

    def add_holding(self, portfolio_id: str, crypto: str, amount: float, buy_price_ngn: float, notes: Optional[str] = None) -> PortfolioHolding:
        holding = PortfolioHolding(
            portfolio_id=portfolio_id,
            crypto=crypto.upper(),
            amount=amount,
            buy_price_ngn=buy_price_ngn,
            notes=notes,
        )
        self.db.add(holding)
        self.db.commit()
        self.db.refresh(holding)
        return holding

    def update_holding(self, holding_id: str, user_id: str, **kwargs) -> Optional[PortfolioHolding]:
        holding = (
            self.db.query(PortfolioHolding)
            .join(Portfolio)
            .filter(PortfolioHolding.id == holding_id, Portfolio.user_id == user_id)
            .first()
        )
        if not holding:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(holding, key):
                setattr(holding, key, value)
        self.db.commit()
        self.db.refresh(holding)
        return holding

    def delete_holding(self, holding_id: str, user_id: str) -> bool:
        holding = (
            self.db.query(PortfolioHolding)
            .join(Portfolio)
            .filter(PortfolioHolding.id == holding_id, Portfolio.user_id == user_id)
            .first()
        )
        if not holding:
            return False
        self.db.delete(holding)
        self.db.commit()
        return True

    def _get_live_price(self, crypto: str) -> Optional[float]:
        cached = redis_client.get_json(f"prices:{crypto}:NGN")
        if cached and cached.get("best_buy"):
            return cached["best_buy"].get("buy_price")
        return None

    def get_portfolio_summary(self, user_id: str) -> dict:
        portfolio = self.get_or_create_portfolio(user_id)
        holdings_data = []
        total_value = 0.0
        total_cost = 0.0

        for h in portfolio.holdings:
            current_price = self._get_live_price(h.crypto)
            cost_basis = h.amount * h.buy_price_ngn
            current_value = h.amount * current_price if current_price else None
            pnl = current_value - cost_basis if current_value is not None else None
            pnl_pct = (pnl / cost_basis * 100) if pnl is not None and cost_basis > 0 else None

            total_cost += cost_basis
            if current_value is not None:
                total_value += current_value

            holdings_data.append({
                "id": h.id,
                "portfolio_id": h.portfolio_id,
                "crypto": h.crypto,
                "amount": h.amount,
                "buy_price_ngn": h.buy_price_ngn,
                "notes": h.notes,
                "added_at": h.added_at,
                "current_price_ngn": current_price,
                "current_value_ngn": current_value,
                "cost_basis_ngn": cost_basis,
                "pnl_ngn": pnl,
                "pnl_percent": pnl_pct,
            })

        total_pnl = total_value - total_cost
        total_pnl_pct = (total_pnl / total_cost * 100) if total_cost > 0 else 0

        allocation = []
        for hd in holdings_data:
            val = hd.get("current_value_ngn") or hd.get("cost_basis_ngn", 0)
            allocation.append({
                "crypto": hd["crypto"],
                "value": val,
                "percent": (val / total_value * 100) if total_value > 0 else 0,
            })

        return {
            "portfolio": {
                "id": portfolio.id,
                "user_id": portfolio.user_id,
                "name": portfolio.name,
                "created_at": portfolio.created_at,
                "holdings": holdings_data,
            },
            "total_value_ngn": total_value,
            "total_cost_ngn": total_cost,
            "total_pnl_ngn": total_pnl,
            "total_pnl_percent": total_pnl_pct,
            "allocation": allocation,
        }
