import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime

from app.scrapers.crypto import (
    BinanceP2PScraper, BybitP2PScraper, QuidaxAPI, LunoAPI,
    RemitanoScraper, PatriciaScraper, PaxfulScraper,
)
from app.core.redis import redis_client
from app.services.arbscanner.fallback_prices import get_fallback_price

logger = logging.getLogger(__name__)


class PriceAggregator:
    """
    Aggregates prices from all supported exchanges.

    Fetches prices from multiple sources and provides a unified view.
    Uses a three-tier fallback: live API -> per-exchange Redis cache -> static sample data.
    """

    CACHE_TTL = 60  # Cache for 60 seconds
    EXCHANGE_CACHE_TTL = 300  # Per-exchange cache for 5 minutes

    # Reasonable NGN price bounds per crypto
    PRICE_BOUNDS = {
        "USDT": (500, 5000),
        "BTC": (50_000_000, 500_000_000),
        "ETH": (2_000_000, 50_000_000),
    }

    MAX_SPREAD_PERCENT = 20  # Reject spreads exceeding 20%

    def _is_valid_price(self, price_data: Dict, crypto: str) -> bool:
        """Check if price data falls within reasonable bounds."""
        buy = price_data.get("buy_price", 0)
        sell = price_data.get("sell_price", 0)

        if buy <= 0 or sell <= 0:
            return False

        bounds = self.PRICE_BOUNDS.get(crypto)
        if bounds:
            low, high = bounds
            if not (low <= buy <= high) or not (low <= sell <= high):
                logger.warning(
                    f"Price out of bounds for {crypto}: buy={buy}, sell={sell} "
                    f"(expected {low}-{high})"
                )
                return False

        # Reject unreasonable spreads
        if buy > 0:
            spread_pct = abs(sell - buy) / buy * 100
            if spread_pct > self.MAX_SPREAD_PERCENT:
                logger.warning(
                    f"Spread {spread_pct:.1f}% exceeds {self.MAX_SPREAD_PERCENT}% "
                    f"for {price_data.get('exchange', '?')}"
                )
                return False

        return True

    def __init__(self):
        self.scrapers = {
            "binance_p2p": BinanceP2PScraper(),
            "bybit_p2p": BybitP2PScraper(),
            "quidax": QuidaxAPI(),
            "luno": LunoAPI(),
            "remitano": RemitanoScraper(),
            "patricia": PatriciaScraper(),
            "paxful": PaxfulScraper(),
        }

    async def get_all_prices(
        self,
        crypto: str = "USDT",
        fiat: str = "NGN",
        use_cache: bool = True
    ) -> Dict:
        """
        Get prices from all exchanges for a crypto/fiat pair.

        Three-tier fallback per exchange:
          1. Live API call
          2. Per-exchange Redis cache (5min TTL)
          3. Static sample data

        Returns:
            Dict with prices from all exchanges, best buy/sell,
            data_source per exchange, and exchange_statuses.
        """

        cache_key = f"prices:{crypto}:{fiat}"

        # Check aggregate cache
        if use_cache:
            cached = redis_client.get_json(cache_key)
            if cached:
                return cached

        # Fetch from all exchanges concurrently
        scraper_names = list(self.scrapers.keys())
        tasks = [
            scraper.get_prices(crypto, fiat)
            for scraper in self.scrapers.values()
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results with three-tier fallback
        exchanges = []
        exchange_statuses = {}

        for name, result in zip(scraper_names, results):
            exchange_cache_key = f"exchange_price:{name}:{crypto}:{fiat}"

            if isinstance(result, dict) and result.get("buy_price", 0) > 0 and self._is_valid_price(result, crypto):
                # Tier 1: Live data succeeded
                result["data_source"] = "live"
                exchanges.append(result)
                exchange_statuses[name] = "live"
                # Update per-exchange cache
                redis_client.set_json(exchange_cache_key, result, self.EXCHANGE_CACHE_TTL)
            else:
                if isinstance(result, Exception):
                    logger.warning(f"[{name}] Live fetch exception: {type(result).__name__}: {result}")
                elif not isinstance(result, dict):
                    logger.warning(f"[{name}] Live fetch returned unexpected type: {type(result).__name__}")
                elif result.get("buy_price", 0) <= 0:
                    logger.warning(
                        f"[{name}] Live fetch returned zero/negative prices: "
                        f"buy={result.get('buy_price')}, sell={result.get('sell_price')}"
                    )
                else:
                    logger.warning(f"[{name}] Live fetch returned invalid price data (failed bounds/spread check)")

                # Tier 2: Try per-exchange cache
                cached_price = redis_client.get_json(exchange_cache_key)
                if cached_price and cached_price.get("buy_price", 0) > 0:
                    cached_price["data_source"] = "cached"
                    exchanges.append(cached_price)
                    exchange_statuses[name] = "cached"
                else:
                    # Tier 3: Static fallback data
                    fallback = get_fallback_price(name, crypto, fiat)
                    if fallback:
                        fallback["data_source"] = "sample"
                        exchanges.append(fallback)
                        exchange_statuses[name] = "sample"

        # Find best prices
        best_buy = None
        best_sell = None

        if exchanges:
            # Best buy = lowest buy price (best for user to buy)
            valid_buys = [e for e in exchanges if e.get("buy_price", 0) > 0]
            if valid_buys:
                best_buy = min(valid_buys, key=lambda x: x["buy_price"])

            # Best sell = highest sell price (best for user to sell)
            valid_sells = [e for e in exchanges if e.get("sell_price", 0) > 0]
            if valid_sells:
                best_sell = max(valid_sells, key=lambda x: x["sell_price"])

        response = {
            "crypto": crypto,
            "fiat": fiat,
            "exchanges": exchanges,
            "best_buy": best_buy,
            "best_sell": best_sell,
            "exchange_statuses": exchange_statuses,
            "updated_at": datetime.utcnow().isoformat()
        }

        # Cache aggregate result
        redis_client.set_json(cache_key, response, self.CACHE_TTL)

        return response

    async def get_exchange_prices(
        self,
        exchange: str,
        crypto: str = "USDT",
        fiat: str = "NGN"
    ) -> Optional[Dict]:
        """Get prices from a specific exchange."""

        scraper = self.scrapers.get(exchange)
        if not scraper:
            return None

        return await scraper.get_prices(crypto, fiat)

    async def get_prices_for_cryptos(
        self,
        cryptos: List[str],
        fiat: str = "NGN"
    ) -> Dict[str, Dict]:
        """Get prices for multiple cryptocurrencies."""

        tasks = [
            self.get_all_prices(crypto, fiat)
            for crypto in cryptos
        ]

        results = await asyncio.gather(*tasks)

        return {
            crypto: result
            for crypto, result in zip(cryptos, results)
        }

    def get_supported_exchanges(self) -> List[Dict]:
        """Get list of supported exchanges."""
        return [
            {
                "name": scraper.name,
                "display_name": scraper.display_name,
                "type": scraper.type
            }
            for scraper in self.scrapers.values()
        ]

    def get_supported_cryptos(self) -> List[str]:
        """Get list of supported cryptocurrencies."""
        return ["USDT", "BTC", "ETH"]
