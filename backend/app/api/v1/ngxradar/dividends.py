"""NGX Dividend endpoints."""
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.ngxradar.stock_service import StockService
from app.schemas.ngxradar import DividendResponse, DividendCalendarResponse

router = APIRouter()


def dividend_to_response(dividend, stock) -> DividendResponse:
    """Convert Dividend model to response."""
    return DividendResponse(
        id=dividend.id,
        stock_symbol=stock.symbol if stock else "",
        stock_name=stock.name if stock else "",
        dividend_type=dividend.dividend_type,
        amount_per_share=float(dividend.amount_per_share),
        qualification_date=dividend.qualification_date,
        payment_date=dividend.payment_date,
        year=dividend.year
    )


@router.get("/dividends", response_model=List[DividendResponse])
async def get_dividends(
    symbol: Optional[str] = Query(None, description="Filter by stock symbol"),
    upcoming: bool = Query(False, description="Only upcoming dividends"),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db)
):
    """
    Get dividend information.

    Filter by stock symbol or get upcoming dividends.
    """
    service = StockService(db)

    stock_id = None
    if symbol:
        stock = service.get_stock_by_symbol(symbol)
        if stock:
            stock_id = stock.id

    dividends = service.get_dividends(
        stock_id=stock_id,
        upcoming_only=upcoming,
        limit=limit
    )

    result = []
    for div in dividends:
        stock = service.get_stock_by_id(div.stock_id)
        result.append(dividend_to_response(div, stock))

    return result


@router.get("/dividends/calendar", response_model=DividendCalendarResponse)
async def get_dividend_calendar(
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db)
):
    """
    Get dividend calendar with upcoming and recent dividends.
    """
    service = StockService(db)

    upcoming = service.get_dividends(upcoming_only=True, limit=limit)
    recent = service.get_dividends(upcoming_only=False, limit=limit)

    upcoming_response = []
    for div in upcoming:
        stock = service.get_stock_by_id(div.stock_id)
        upcoming_response.append(dividend_to_response(div, stock))

    recent_response = []
    for div in recent:
        stock = service.get_stock_by_id(div.stock_id)
        recent_response.append(dividend_to_response(div, stock))

    return DividendCalendarResponse(
        upcoming=upcoming_response,
        recent=recent_response
    )
