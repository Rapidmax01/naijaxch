"""NGX Stock endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.ngxradar.stock_service import StockService
from app.schemas.ngxradar import (
    StockResponse,
    StockDetailResponse,
    StockPriceResponse,
    MarketSummaryResponse
)

router = APIRouter()


def stock_to_response(stock) -> StockResponse:
    """Convert Stock model to response schema."""
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


def dict_to_stock_response(data: dict) -> StockResponse:
    """Convert dict to StockResponse for sample data."""
    return StockResponse(
        id=data.get("symbol", ""),
        symbol=data.get("symbol", ""),
        name=data.get("name", ""),
        sector=data.get("sector"),
        current_price=data.get("close"),
        change=data.get("change"),
        change_percent=data.get("change_percent"),
        volume=data.get("volume"),
        market_cap=data.get("market_cap"),
        pe_ratio=data.get("pe_ratio"),
        dividend_yield=data.get("dividend_yield"),
        high_52w=data.get("high_52w"),
        low_52w=data.get("low_52w"),
        is_active=True
    )


@router.get("/summary", response_model=MarketSummaryResponse)
async def get_market_summary(db: Session = Depends(get_db)):
    """
    Get NGX market summary.

    Returns ASI (All Share Index), market cap, volume, and top movers.
    """
    service = StockService(db)

    summary = await service.get_market_summary()
    gainers = await service.get_top_gainers(5)
    losers = await service.get_top_losers(5)
    active = await service.get_most_active(5)

    return MarketSummaryResponse(
        asi=summary.get("asi", 0),
        asi_change=summary.get("asi_change", 0),
        asi_change_percent=summary.get("asi_change_percent", 0),
        market_cap=summary.get("market_cap", 0),
        volume=summary.get("volume", 0),
        value=summary.get("value", 0),
        deals=summary.get("deals", 0),
        date=date.fromisoformat(summary.get("date", date.today().isoformat())),
        top_gainers=[dict_to_stock_response(g) for g in gainers],
        top_losers=[dict_to_stock_response(l) for l in losers],
        most_active=[dict_to_stock_response(a) for a in active]
    )


@router.get("/stocks", response_model=List[StockResponse])
async def get_stocks(
    sector: Optional[str] = Query(None, description="Filter by sector"),
    limit: int = Query(100, le=500, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """
    Get all NGX listed stocks.

    Supports filtering by sector and pagination.
    """
    service = StockService(db)

    # Try to get from database first
    stocks = service.get_all_stocks(sector=sector, limit=limit, offset=offset)

    if stocks:
        return [stock_to_response(s) for s in stocks]

    # Fallback to sample data
    all_stocks = await service.data_provider.get_all_stocks()

    if sector:
        all_stocks = [s for s in all_stocks if s.get("sector") == sector]

    return [dict_to_stock_response(s) for s in all_stocks[offset:offset + limit]]


@router.get("/stocks/{symbol}", response_model=StockDetailResponse)
async def get_stock(symbol: str, db: Session = Depends(get_db)):
    """
    Get detailed information for a specific stock.

    Includes price history.
    """
    service = StockService(db)

    stock = service.get_stock_by_symbol(symbol)

    if stock:
        prices = service.get_stock_prices(stock.id, limit=30)
        return StockDetailResponse(
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
            is_active=stock.is_active,
            prices=[
                StockPriceResponse(
                    date=p.date,
                    open_price=float(p.open_price) if p.open_price else None,
                    high_price=float(p.high_price) if p.high_price else None,
                    low_price=float(p.low_price) if p.low_price else None,
                    close_price=float(p.close_price),
                    volume=p.volume
                ) for p in prices
            ]
        )

    # Try sample data
    all_stocks = await service.data_provider.get_all_stocks()
    for s in all_stocks:
        if s.get("symbol", "").upper() == symbol.upper():
            return StockDetailResponse(
                id=s.get("symbol"),
                symbol=s.get("symbol"),
                name=s.get("name", ""),
                sector=s.get("sector"),
                current_price=s.get("close"),
                change=s.get("change"),
                change_percent=s.get("change_percent"),
                volume=s.get("volume"),
                market_cap=s.get("market_cap"),
                is_active=True,
                prices=[]
            )

    raise HTTPException(status_code=404, detail="Stock not found")


@router.get("/sectors", response_model=List[str])
async def get_sectors(db: Session = Depends(get_db)):
    """Get list of all available sectors."""
    service = StockService(db)
    sectors = service.get_sectors()

    if sectors:
        return sectors

    # Return sample sectors
    return ["Banking", "Telecom", "Industrial", "Oil & Gas", "Consumer Goods", "Agriculture"]


@router.get("/gainers", response_model=List[StockResponse])
async def get_top_gainers(
    limit: int = Query(10, le=50, description="Number of results"),
    db: Session = Depends(get_db)
):
    """Get top gaining stocks."""
    service = StockService(db)
    gainers = await service.get_top_gainers(limit)
    return [dict_to_stock_response(g) for g in gainers]


@router.get("/losers", response_model=List[StockResponse])
async def get_top_losers(
    limit: int = Query(10, le=50, description="Number of results"),
    db: Session = Depends(get_db)
):
    """Get top losing stocks."""
    service = StockService(db)
    losers = await service.get_top_losers(limit)
    return [dict_to_stock_response(l) for l in losers]


@router.get("/active", response_model=List[StockResponse])
async def get_most_active(
    limit: int = Query(10, le=50, description="Number of results"),
    db: Session = Depends(get_db)
):
    """Get most actively traded stocks by volume."""
    service = StockService(db)
    active = await service.get_most_active(limit)
    return [dict_to_stock_response(a) for a in active]


@router.post("/sync")
async def sync_stocks(db: Session = Depends(get_db)):
    """
    Sync stocks from data provider to database.

    This endpoint populates/updates the stocks table.
    """
    service = StockService(db)
    count = await service.sync_stocks()
    return {"message": f"Synced {count} stocks", "count": count}
