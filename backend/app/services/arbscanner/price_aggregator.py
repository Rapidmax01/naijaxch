import asyncio
from typing import Dict, List, Optional
from datetime import datetime

from app.scrapers.crypto import BinanceP2PScraper, BybitP2PScraper, QuidaxAPI, LunoAPI
from app.core.redis import redis_client


class PriceAggregator:
    """
    Aggregates prices from all supported exchanges.

    Fetches prices from multiple sources and provides a unified view.
    Caches results in Redis for performance.
    """

    CACHE_TTL = 60  # Cache for 60 seconds

    def __init__(self):
        self.scrapers = {
            "binance_p2p": BinanceP2PScraper(),
            "bybit_p2p": BybitP2PScraper(),
            "quidax": QuidaxAPI(),
            "luno": LunoAPI(),
        }

    async def get_all_prices(
        self,
        crypto: str = "USDT",
        fiat: str = "NGN",
        use_cache: bool = True
    ) -> Dict:
        """
        Get prices from all exchanges for a crypto/fiat pair.

        Args:
            crypto: Cryptocurrency (USDT, BTC, ETH)
            fiat: Fiat currency (NGN)
            use_cache: Whether to use cached prices

        Returns:
            Dict with prices from all exchanges and best buy/sell
        """

        cache_key = f"prices:{crypto}:{fiat}"

        # Check cache
        if use_cache:
            cached = redis_client.get_json(cache_key)
            if cached:
                return cached

        # Fetch from all exchanges
        tasks = [
            scraper.get_prices(crypto, fiat)
            for scraper in self.scrapers.values()
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        exchanges = []
        for result in results:
            if isinstance(result, dict) and result.get("buy_price", 0) > 0:
                exchanges.append(result)

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
            "updated_at": datetime.utcnow().isoformat()
        }

        # Cache result
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
