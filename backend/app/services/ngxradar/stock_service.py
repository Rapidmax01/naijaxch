"""NGX Stock service for database operations."""
from typing import List, Optional, Dict, Any
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc

from app.models.ngxradar.stock import Stock, StockPrice
from app.models.ngxradar.dividend import Dividend
from app.scrapers.stocks.ngx import NGXDataProvider


class StockService:
    """Service for NGX stock operations."""

    def __init__(self, db: Session):
        self.db = db
        self.data_provider = NGXDataProvider(use_sample=False)

    async def sync_stocks(self) -> int:
        """Sync stocks from data provider to database."""
        stocks_data = await self.data_provider.get_all_stocks()
        synced = 0

        for data in stocks_data:
            stock = self.db.query(Stock).filter(
                Stock.symbol == data.get("symbol", "").upper()
            ).first()

            if not stock:
                stock = Stock(
                    symbol=data.get("symbol", "").upper(),
                    name=data.get("name", ""),
                    sector=data.get("sector"),
                )
                self.db.add(stock)
                self.db.flush()

            # Update current price data
            stock.current_price = data.get("close")
            stock.change = data.get("change")
            stock.change_percent = data.get("change_percent")
            stock.volume = data.get("volume")
            stock.market_cap = data.get("market_cap")

            synced += 1

        self.db.commit()
        return synced

    def get_all_stocks(
        self,
        sector: Optional[str] = None,
        is_active: bool = True,
        limit: int = 100,
        offset: int = 0
    ) -> List[Stock]:
        """Get all stocks with optional filtering."""
        query = self.db.query(Stock).filter(Stock.is_active == is_active)

        if sector:
            query = query.filter(Stock.sector == sector)

        return query.offset(offset).limit(limit).all()

    def get_stock_by_symbol(self, symbol: str) -> Optional[Stock]:
        """Get stock by symbol."""
        return self.db.query(Stock).filter(
            Stock.symbol == symbol.upper()
        ).first()

    def get_stock_by_id(self, stock_id: str) -> Optional[Stock]:
        """Get stock by ID."""
        return self.db.query(Stock).filter(Stock.id == stock_id).first()

    def get_stock_prices(
        self,
        stock_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 30
    ) -> List[StockPrice]:
        """Get historical prices for a stock."""
        query = self.db.query(StockPrice).filter(
            StockPrice.stock_id == stock_id
        )

        if start_date:
            query = query.filter(StockPrice.date >= start_date)
        if end_date:
            query = query.filter(StockPrice.date <= end_date)

        return query.order_by(StockPrice.date.desc()).limit(limit).all()

    def screen_stocks(
        self,
        sector: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_change_percent: Optional[float] = None,
        max_change_percent: Optional[float] = None,
        min_volume: Optional[int] = None,
        min_market_cap: Optional[float] = None,
        max_pe_ratio: Optional[float] = None,
        min_dividend_yield: Optional[float] = None,
        sort_by: str = "symbol",
        sort_order: str = "asc",
        limit: int = 50,
        offset: int = 0
    ) -> tuple[List[Stock], int]:
        """Screen stocks based on filters."""
        query = self.db.query(Stock).filter(Stock.is_active == True)

        # Apply filters
        if sector:
            query = query.filter(Stock.sector == sector)
        if min_price is not None:
            query = query.filter(Stock.current_price >= min_price)
        if max_price is not None:
            query = query.filter(Stock.current_price <= max_price)
        if min_change_percent is not None:
            query = query.filter(Stock.change_percent >= min_change_percent)
        if max_change_percent is not None:
            query = query.filter(Stock.change_percent <= max_change_percent)
        if min_volume is not None:
            query = query.filter(Stock.volume >= min_volume)
        if min_market_cap is not None:
            query = query.filter(Stock.market_cap >= min_market_cap)
        if max_pe_ratio is not None:
            query = query.filter(Stock.pe_ratio <= max_pe_ratio)
        if min_dividend_yield is not None:
            query = query.filter(Stock.dividend_yield >= min_dividend_yield)

        # Get total count
        total = query.count()

        # Apply sorting
        sort_column = getattr(Stock, sort_by, Stock.symbol)
        if sort_order.lower() == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Apply pagination
        stocks = query.offset(offset).limit(limit).all()

        return stocks, total

    def get_sectors(self) -> List[str]:
        """Get list of unique sectors."""
        sectors = self.db.query(Stock.sector).filter(
            Stock.sector.isnot(None),
            Stock.is_active == True
        ).distinct().all()
        return [s[0] for s in sectors if s[0]]

    async def get_top_gainers(self, limit: int = 10) -> List[Dict]:
        """Get top gaining stocks."""
        return await self.data_provider.get_top_gainers(limit)

    async def get_top_losers(self, limit: int = 10) -> List[Dict]:
        """Get top losing stocks."""
        return await self.data_provider.get_top_losers(limit)

    async def get_most_active(self, limit: int = 10) -> List[Dict]:
        """Get most active stocks by volume."""
        return await self.data_provider.get_most_active(limit)

    async def get_market_summary(self) -> Dict:
        """Get market summary including ASI."""
        return await self.data_provider.get_market_summary()

    def get_dividends(
        self,
        stock_id: Optional[str] = None,
        upcoming_only: bool = False,
        limit: int = 20
    ) -> List[Dividend]:
        """Get dividend information."""
        query = self.db.query(Dividend)

        if stock_id:
            query = query.filter(Dividend.stock_id == stock_id)

        if upcoming_only:
            query = query.filter(Dividend.payment_date >= date.today())

        return query.order_by(Dividend.payment_date.desc()).limit(limit).all()
