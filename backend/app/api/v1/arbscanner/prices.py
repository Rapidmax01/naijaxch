from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime

from app.services.arbscanner.price_aggregator import PriceAggregator
from app.schemas.arbscanner import AllPricesResponse, ExchangePriceResponse

router = APIRouter()
price_aggregator = PriceAggregator()


@router.get("/prices", response_model=AllPricesResponse)
async def get_all_prices(
    crypto: str = Query(default="USDT", description="Cryptocurrency (USDT, BTC, ETH)"),
    fiat: str = Query(default="NGN", description="Fiat currency"),
    refresh: bool = Query(default=False, description="Force refresh (bypass cache)")
):
    """
    Get current prices from all exchanges.

    Returns buy and sell prices from all supported exchanges,
    along with the best buy and sell opportunities.
    """
    prices = await price_aggregator.get_all_prices(
        crypto=crypto.upper(),
        fiat=fiat.upper(),
        use_cache=not refresh
    )

    # Transform to response model
    exchanges = []
    for ex in prices.get("exchanges", []):
        exchanges.append(ExchangePriceResponse(
            exchange=ex.get("exchange", ""),
            display_name=ex.get("display_name", ""),
            crypto=ex.get("crypto", crypto),
            fiat=ex.get("fiat", fiat),
            buy_price=ex.get("buy_price", 0),
            sell_price=ex.get("sell_price", 0),
            spread=ex.get("spread", 0),
            spread_percent=ex.get("spread_percent", 0),
            volume_24h=ex.get("volume_24h"),
            updated_at=datetime.fromisoformat(ex.get("updated_at", datetime.utcnow().isoformat()))
        ))

    best_buy = None
    best_sell = None

    if prices.get("best_buy"):
        bb = prices["best_buy"]
        best_buy = ExchangePriceResponse(
            exchange=bb.get("exchange", ""),
            display_name=bb.get("display_name", ""),
            crypto=bb.get("crypto", crypto),
            fiat=bb.get("fiat", fiat),
            buy_price=bb.get("buy_price", 0),
            sell_price=bb.get("sell_price", 0),
            spread=bb.get("spread", 0),
            spread_percent=bb.get("spread_percent", 0),
            updated_at=datetime.fromisoformat(bb.get("updated_at", datetime.utcnow().isoformat()))
        )

    if prices.get("best_sell"):
        bs = prices["best_sell"]
        best_sell = ExchangePriceResponse(
            exchange=bs.get("exchange", ""),
            display_name=bs.get("display_name", ""),
            crypto=bs.get("crypto", crypto),
            fiat=bs.get("fiat", fiat),
            buy_price=bs.get("buy_price", 0),
            sell_price=bs.get("sell_price", 0),
            spread=bs.get("spread", 0),
            spread_percent=bs.get("spread_percent", 0),
            updated_at=datetime.fromisoformat(bs.get("updated_at", datetime.utcnow().isoformat()))
        )

    return AllPricesResponse(
        crypto=crypto.upper(),
        fiat=fiat.upper(),
        exchanges=exchanges,
        best_buy=best_buy,
        best_sell=best_sell,
        updated_at=datetime.fromisoformat(prices.get("updated_at", datetime.utcnow().isoformat()))
    )


@router.get("/prices/{crypto}")
async def get_crypto_prices(
    crypto: str,
    fiat: str = Query(default="NGN"),
    refresh: bool = Query(default=False)
):
    """Get prices for a specific cryptocurrency."""
    return await get_all_prices(crypto=crypto, fiat=fiat, refresh=refresh)


@router.get("/exchanges")
async def get_exchanges():
    """Get list of supported exchanges."""
    return {
        "exchanges": price_aggregator.get_supported_exchanges(),
        "cryptos": price_aggregator.get_supported_cryptos()
    }


@router.get("/fees")
async def get_fees():
    """Get fee structure for all exchanges."""
    from app.services.arbscanner.fee_calculator import FeeCalculator
    fee_calc = FeeCalculator()
    return {"fees": fee_calc.get_all_fees()}
