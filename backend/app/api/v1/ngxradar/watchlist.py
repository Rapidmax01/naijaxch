"""NGX Watchlist endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.limits import LimitChecker
from app.services.ngxradar.watchlist_service import WatchlistService
from app.schemas.ngxradar import (
    WatchlistCreate,
    WatchlistResponse,
    WatchlistAddStock,
    StockResponse
)

router = APIRouter()


def stock_to_response(stock) -> StockResponse:
    """Convert Stock model to response."""
    return StockResponse(
        id=stock.id,
        symbol=stock.symbol,
        name=stock.name,
        sector=stock.sector,
        current_price=float(stock.current_price) if stock.current_price else None,
        change=float(stock.change) if stock.change else None,
        change_percent=float(stock.change_percent) if stock.change_percent else None,
        volume=stock.volume,
        market_cap=float(stock.market_cap) if stock.market_cap else None,
        pe_ratio=float(stock.pe_ratio) if stock.pe_ratio else None,
        dividend_yield=float(stock.dividend_yield) if stock.dividend_yield else None,
        high_52w=float(stock.high_52w) if stock.high_52w else None,
        low_52w=float(stock.low_52w) if stock.low_52w else None,
        is_active=stock.is_active
    )


@router.get("/watchlists", response_model=List[WatchlistResponse])
async def get_watchlists(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all watchlists for the current user."""
    service = WatchlistService(db)
    watchlists = service.get_user_watchlists(current_user.id)

    return [
        WatchlistResponse(
            id=w.id,
            name=w.name,
            stocks=[stock_to_response(s) for s in service.get_watchlist_stocks(w.id, current_user.id)],
            created_at=w.created_at
        ) for w in watchlists
    ]


@router.post("/watchlists", response_model=WatchlistResponse)
async def create_watchlist(
    data: WatchlistCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new watchlist."""
    service = WatchlistService(db)
    watchlist = service.create_watchlist(current_user.id, data.name)

    return WatchlistResponse(
        id=watchlist.id,
        name=watchlist.name,
        stocks=[],
        created_at=watchlist.created_at
    )


@router.get("/watchlists/{watchlist_id}", response_model=WatchlistResponse)
async def get_watchlist(
    watchlist_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific watchlist with stocks."""
    service = WatchlistService(db)
    watchlist = service.get_watchlist(watchlist_id, current_user.id)

    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    stocks = service.get_watchlist_stocks(watchlist_id, current_user.id)

    return WatchlistResponse(
        id=watchlist.id,
        name=watchlist.name,
        stocks=[stock_to_response(s) for s in stocks],
        created_at=watchlist.created_at
    )


@router.delete("/watchlists/{watchlist_id}")
async def delete_watchlist(
    watchlist_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a watchlist."""
    service = WatchlistService(db)

    if not service.delete_watchlist(watchlist_id, current_user.id):
        raise HTTPException(status_code=404, detail="Watchlist not found")

    return {"message": "Watchlist deleted"}


@router.post("/watchlists/{watchlist_id}/stocks")
async def add_stock_to_watchlist(
    watchlist_id: str,
    data: WatchlistAddStock,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a stock to a watchlist."""
    service = WatchlistService(db)

    # Check plan limits
    limiter = LimitChecker(db, current_user.id, "ngxradar")

    # Count total stocks across all watchlists
    watchlists = service.get_user_watchlists(current_user.id)
    total_stocks = sum(
        len(service.get_watchlist_stocks(w.id, current_user.id))
        for w in watchlists
    )

    limiter.check("watchlist_stocks", total_stocks)

    item = service.add_stock_to_watchlist(
        watchlist_id,
        data.symbol,
        current_user.id
    )

    if not item:
        raise HTTPException(
            status_code=400,
            detail="Could not add stock. Check watchlist and symbol."
        )

    return {"message": f"Added {data.symbol} to watchlist"}


@router.delete("/watchlists/{watchlist_id}/stocks/{symbol}")
async def remove_stock_from_watchlist(
    watchlist_id: str,
    symbol: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a stock from a watchlist."""
    service = WatchlistService(db)

    if not service.remove_stock_from_watchlist(watchlist_id, symbol, current_user.id):
        raise HTTPException(status_code=404, detail="Stock not found in watchlist")

    return {"message": f"Removed {symbol} from watchlist"}
