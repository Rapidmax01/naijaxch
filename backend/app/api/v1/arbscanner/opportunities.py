from fastapi import APIRouter, Query, Depends
from typing import List, Optional
from datetime import datetime

from app.services.arbscanner.price_aggregator import PriceAggregator
from app.services.arbscanner.arbitrage_calculator import ArbitrageCalculator
from app.schemas.arbscanner import (
    ArbitrageOpportunityResponse,
    OpportunitiesListResponse,
    ArbitrageCalculateRequest,
    ArbitrageCalculateResponse,
    FeesBreakdown
)

router = APIRouter()
price_aggregator = PriceAggregator()
arbitrage_calculator = ArbitrageCalculator()


@router.get("/opportunities", response_model=OpportunitiesListResponse)
async def get_opportunities(
    crypto: str = Query(default="USDT", description="Cryptocurrency"),
    min_spread: float = Query(default=0.5, description="Minimum spread percentage"),
    trade_amount: float = Query(default=100000, description="Trade amount in NGN"),
    limit: int = Query(default=10, le=50, description="Max opportunities to return")
):
    """
    Get current arbitrage opportunities.

    Scans all exchanges and returns profitable arbitrage opportunities
    sorted by potential profit.
    """
    # Get current prices
    prices_data = await price_aggregator.get_all_prices(crypto=crypto.upper())

    # Convert to format expected by calculator
    prices = {}
    for ex in prices_data.get("exchanges", []):
        prices[ex["exchange"]] = {
            "buy_price": ex.get("buy_price", 0),
            "sell_price": ex.get("sell_price", 0)
        }

    # Find opportunities
    opportunities = arbitrage_calculator.find_opportunities(
        prices=prices,
        min_spread_percent=min_spread,
        trade_amount_ngn=trade_amount
    )

    # Limit results
    opportunities = opportunities[:limit]

    # Transform to response
    response_opps = []
    for opp in opportunities:
        response_opps.append(ArbitrageOpportunityResponse(
            crypto=opp["crypto"],
            buy_exchange=opp["buy_exchange"],
            sell_exchange=opp["sell_exchange"],
            buy_price=opp["buy_price"],
            sell_price=opp["sell_price"],
            gross_spread=opp["gross_spread"],
            gross_spread_percent=opp["gross_spread_percent"],
            fees=FeesBreakdown(**opp["fees"]),
            net_profit=opp["net_profit"],
            net_profit_percent=opp["net_profit_percent"],
            is_profitable=opp["is_profitable"],
            detected_at=datetime.utcnow()
        ))

    return OpportunitiesListResponse(
        opportunities=response_opps,
        total=len(response_opps),
        updated_at=datetime.utcnow()
    )


@router.post("/calculate", response_model=ArbitrageCalculateResponse)
async def calculate_arbitrage(request: ArbitrageCalculateRequest):
    """
    Calculate arbitrage profit for a specific trade.

    Provide buy exchange, sell exchange, and trade amount to get
    detailed profit breakdown including all fees.
    """
    # Get current prices
    prices_data = await price_aggregator.get_all_prices(crypto=request.crypto.upper())

    # Find prices for specified exchanges
    buy_price = None
    sell_price = None

    for ex in prices_data.get("exchanges", []):
        if ex["exchange"] == request.buy_exchange:
            buy_price = ex.get("buy_price", 0)
        if ex["exchange"] == request.sell_exchange:
            sell_price = ex.get("sell_price", 0)

    if not buy_price or not sell_price:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail="Could not get prices for specified exchanges"
        )

    # Calculate opportunity
    result = arbitrage_calculator.calculate_opportunity(
        buy_exchange=request.buy_exchange,
        sell_exchange=request.sell_exchange,
        buy_price=buy_price,
        sell_price=sell_price,
        crypto=request.crypto,
        trade_amount_ngn=request.trade_amount_ngn
    )

    return ArbitrageCalculateResponse(
        crypto=result["crypto"],
        buy_exchange=result["buy_exchange"],
        sell_exchange=result["sell_exchange"],
        buy_price=result["buy_price"],
        sell_price=result["sell_price"],
        trade_amount_ngn=result["trade_amount_ngn"],
        crypto_amount=result["crypto_amount"],
        gross_spread=result["gross_spread"],
        gross_spread_percent=result["gross_spread_percent"],
        fees=FeesBreakdown(**result["fees"]),
        net_profit=result["net_profit"],
        net_profit_percent=result["net_profit_percent"],
        is_profitable=result["is_profitable"],
        roi=result["roi"]
    )


@router.get("/history")
async def get_history(
    crypto: Optional[str] = None,
    min_spread: Optional[float] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0)
):
    """
    Get historical arbitrage opportunities.

    Note: This endpoint requires database storage.
    Currently returns empty list as we haven't set up history tracking.
    """
    # TODO: Implement historical data from database
    return {
        "opportunities": [],
        "total": 0,
        "limit": limit,
        "offset": offset
    }
