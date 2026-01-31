"""NGX Watchlist service."""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.ngxradar.watchlist import Watchlist, WatchlistItem
from app.models.ngxradar.stock import Stock


class WatchlistService:
    """Service for watchlist operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_user_watchlists(self, user_id: str) -> List[Watchlist]:
        """Get all watchlists for a user."""
        return self.db.query(Watchlist).filter(
            Watchlist.user_id == user_id
        ).all()

    def get_watchlist(self, watchlist_id: str, user_id: str) -> Optional[Watchlist]:
        """Get a specific watchlist."""
        return self.db.query(Watchlist).filter(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id
        ).first()

    def create_watchlist(self, user_id: str, name: str = "My Watchlist") -> Watchlist:
        """Create a new watchlist."""
        watchlist = Watchlist(
            user_id=user_id,
            name=name
        )
        self.db.add(watchlist)
        self.db.commit()
        self.db.refresh(watchlist)
        return watchlist

    def delete_watchlist(self, watchlist_id: str, user_id: str) -> bool:
        """Delete a watchlist."""
        watchlist = self.get_watchlist(watchlist_id, user_id)
        if watchlist:
            self.db.delete(watchlist)
            self.db.commit()
            return True
        return False

    def add_stock_to_watchlist(
        self,
        watchlist_id: str,
        stock_symbol: str,
        user_id: str
    ) -> Optional[WatchlistItem]:
        """Add a stock to a watchlist."""
        watchlist = self.get_watchlist(watchlist_id, user_id)
        if not watchlist:
            return None

        # Find stock by symbol
        stock = self.db.query(Stock).filter(
            Stock.symbol == stock_symbol.upper()
        ).first()
        if not stock:
            return None

        # Check if already in watchlist
        existing = self.db.query(WatchlistItem).filter(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.stock_id == stock.id
        ).first()
        if existing:
            return existing

        item = WatchlistItem(
            watchlist_id=watchlist_id,
            stock_id=stock.id
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def remove_stock_from_watchlist(
        self,
        watchlist_id: str,
        stock_symbol: str,
        user_id: str
    ) -> bool:
        """Remove a stock from a watchlist."""
        watchlist = self.get_watchlist(watchlist_id, user_id)
        if not watchlist:
            return False

        stock = self.db.query(Stock).filter(
            Stock.symbol == stock_symbol.upper()
        ).first()
        if not stock:
            return False

        item = self.db.query(WatchlistItem).filter(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.stock_id == stock.id
        ).first()

        if item:
            self.db.delete(item)
            self.db.commit()
            return True
        return False

    def get_watchlist_stocks(self, watchlist_id: str, user_id: str) -> List[Stock]:
        """Get all stocks in a watchlist."""
        watchlist = self.get_watchlist(watchlist_id, user_id)
        if not watchlist:
            return []

        items = self.db.query(WatchlistItem).filter(
            WatchlistItem.watchlist_id == watchlist_id
        ).all()

        stock_ids = [item.stock_id for item in items]
        return self.db.query(Stock).filter(Stock.id.in_(stock_ids)).all()
