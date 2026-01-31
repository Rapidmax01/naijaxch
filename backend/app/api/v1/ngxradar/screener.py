"""NGX Stock Screener endpoint."""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.ngxradar.stock_service import StockService
from app.schemas.ngxradar import ScreenerResponse, ScreenerFilters, StockResponse

router = APIRouter()


@router.get("/screener", response_model=ScreenerResponse)
async def screen_stocks(
    sector: Optional[str] = Query(None, description="Filter by sector"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    min_change_percent: Optional[float] = Query(None, description="Minimum % change"),
    max_change_percent: Optional[float] = Query(None, description="Maximum % change"),
    min_volume: Optional[int] = Query(None, description="Minimum volume"),
    min_market_cap: Optional[float] = Query(None, description="Minimum market cap"),
    max_pe_ratio: Optional[float] = Query(None, description="Maximum P/E ratio"),
    min_dividend_yield: Optional[float] = Query(None, description="Minimum dividend yield"),
    sort_by: str = Query("symbol", description="Sort by field"),
    sort_order: str = Query("asc", regex="^(asc|desc)$", description="Sort order"),
    limit: int = Query(50, le=200, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """
    Screen NGX stocks based on various filters.

    Filter options:
    - sector: Banking, Telecom, Industrial, Oil & Gas, Consumer Goods, Agriculture
    - min/max_price: Price range filter
    - min/max_change_percent: Daily change % filter
    - min_volume: Minimum trading volume
    - min_market_cap: Minimum market capitalization
    - max_pe_ratio: Maximum P/E ratio
    - min_dividend_yield: Minimum dividend yield
    """
    service = StockService(db)

    filters = ScreenerFilters(
        sector=sector,
        min_price=min_price,
        max_price=max_price,
        min_change_percent=min_change_percent,
        max_change_percent=max_change_percent,
        min_volume=min_volume,
        min_market_cap=min_market_cap,
        max_pe_ratio=max_pe_ratio,
        min_dividend_yield=min_dividend_yield,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset
    )

    # Try database first
    stocks, total = service.screen_stocks(
        sector=sector,
        min_price=min_price,
        max_price=max_price,
        min_change_percent=min_change_percent,
        max_change_percent=max_change_percent,
        min_volume=min_volume,
        min_market_cap=min_market_cap,
        max_pe_ratio=max_pe_ratio,
        min_dividend_yield=min_dividend_yield,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset
    )

    if stocks:
        return ScreenerResponse(
            stocks=[
                StockResponse(
                    id=s.id,
                    symbol=s.symbol,
                    name=s.name,
                    sector=s.sector,
                    current_price=float(s.current_price) if s.current_price else None,
                    change=float(s.change) if s.change else None,
                    change_percent=float(s.change_percent) if s.change_percent else None,
                    volume=s.volume,
                    market_cap=float(s.market_cap) if s.market_cap else None,
                    pe_ratio=float(s.pe_ratio) if s.pe_ratio else None,
                    dividend_yield=float(s.dividend_yield) if s.dividend_yield else None,
                    high_52w=float(s.high_52w) if s.high_52w else None,
                    low_52w=float(s.low_52w) if s.low_52w else None,
                    is_active=s.is_active
                ) for s in stocks
            ],
            total=total,
            filters_applied=filters
        )

    # Fallback to sample data with filtering
    all_stocks = await service.data_provider.get_all_stocks()
    filtered = all_stocks

    # Apply filters to sample data
    if sector:
        filtered = [s for s in filtered if s.get("sector") == sector]
    if min_price is not None:
        filtered = [s for s in filtered if (s.get("close") or 0) >= min_price]
    if max_price is not None:
        filtered = [s for s in filtered if (s.get("close") or 0) <= max_price]
    if min_change_percent is not None:
        filtered = [s for s in filtered if (s.get("change_percent") or 0) >= min_change_percent]
    if max_change_percent is not None:
        filtered = [s for s in filtered if (s.get("change_percent") or 0) <= max_change_percent]
    if min_volume is not None:
        filtered = [s for s in filtered if (s.get("volume") or 0) >= min_volume]
    if min_market_cap is not None:
        filtered = [s for s in filtered if (s.get("market_cap") or 0) >= min_market_cap]

    # Sort
    reverse = sort_order == "desc"
    sort_key = {
        "symbol": lambda x: x.get("symbol", ""),
        "name": lambda x: x.get("name", ""),
        "current_price": lambda x: x.get("close") or 0,
        "change_percent": lambda x: x.get("change_percent") or 0,
        "volume": lambda x: x.get("volume") or 0,
        "market_cap": lambda x: x.get("market_cap") or 0
    }.get(sort_by, lambda x: x.get("symbol", ""))

    filtered.sort(key=sort_key, reverse=reverse)

    total = len(filtered)
    paginated = filtered[offset:offset + limit]

    return ScreenerResponse(
        stocks=[
            StockResponse(
                id=s.get("symbol", ""),
                symbol=s.get("symbol", ""),
                name=s.get("name", ""),
                sector=s.get("sector"),
                current_price=s.get("close"),
                change=s.get("change"),
                change_percent=s.get("change_percent"),
                volume=s.get("volume"),
                market_cap=s.get("market_cap"),
                is_active=True
            ) for s in paginated
        ],
        total=total,
        filters_applied=filters
    )
