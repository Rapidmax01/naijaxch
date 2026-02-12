from fastapi import APIRouter, Query
from typing import Optional

from app.services.arbscanner.price_aggregator import PriceAggregator

router = APIRouter()
aggregator = PriceAggregator()


@router.get("/compare")
async def compare_p2p_rates(crypto: str = Query(default="USDT")):
    """Compare P2P rates across exchanges for a single crypto."""
    data = await aggregator.get_all_prices(crypto=crypto.upper())
    exchanges = data.get("exchanges", [])

    # Sort by buy price ascending (cheapest buy first)
    buy_ranked = sorted(
        [e for e in exchanges if e.get("buy_price", 0) > 0],
        key=lambda x: x["buy_price"],
    )
    # Sort by sell price descending (best sell first)
    sell_ranked = sorted(
        [e for e in exchanges if e.get("sell_price", 0) > 0],
        key=lambda x: x["sell_price"],
        reverse=True,
    )

    # Compute max spread
    max_spread = 0
    max_spread_pct = 0
    if buy_ranked and sell_ranked:
        cheapest_buy = buy_ranked[0]["buy_price"]
        best_sell = sell_ranked[0]["sell_price"]
        max_spread = best_sell - cheapest_buy
        max_spread_pct = (max_spread / cheapest_buy * 100) if cheapest_buy > 0 else 0

    return {
        "crypto": crypto.upper(),
        "cheapest_buy": buy_ranked[0] if buy_ranked else None,
        "best_sell": sell_ranked[0] if sell_ranked else None,
        "max_spread": round(max_spread, 2),
        "max_spread_percent": round(max_spread_pct, 2),
        "buy_ranked": buy_ranked,
        "sell_ranked": sell_ranked,
        "all_exchanges": exchanges,
        "updated_at": data.get("updated_at"),
    }


@router.get("/compare/all")
async def compare_all_p2p_rates():
    """Compare P2P rates across all supported cryptos."""
    cryptos = aggregator.get_supported_cryptos()
    results = {}

    for crypto in cryptos:
        data = await aggregator.get_all_prices(crypto=crypto)
        exchanges = data.get("exchanges", [])

        buy_ranked = sorted(
            [e for e in exchanges if e.get("buy_price", 0) > 0],
            key=lambda x: x["buy_price"],
        )
        sell_ranked = sorted(
            [e for e in exchanges if e.get("sell_price", 0) > 0],
            key=lambda x: x["sell_price"],
            reverse=True,
        )

        max_spread = 0
        max_spread_pct = 0
        if buy_ranked and sell_ranked:
            cheapest_buy = buy_ranked[0]["buy_price"]
            best_sell = sell_ranked[0]["sell_price"]
            max_spread = best_sell - cheapest_buy
            max_spread_pct = (max_spread / cheapest_buy * 100) if cheapest_buy > 0 else 0

        results[crypto] = {
            "cheapest_buy": buy_ranked[0] if buy_ranked else None,
            "best_sell": sell_ranked[0] if sell_ranked else None,
            "max_spread": round(max_spread, 2),
            "max_spread_percent": round(max_spread_pct, 2),
            "exchange_count": len(exchanges),
        }

    return {"comparisons": results, "cryptos": cryptos}
