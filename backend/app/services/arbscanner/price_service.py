"""Price aggregation service for crypto exchanges."""
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.scrapers.crypto.quidax import QuidaxAPI
from app.scrapers.crypto.luno import LunoAPI
from app.scrapers.crypto.binance_p2p import BinanceP2PScraper
from app.scrapers.crypto.bybit_p2p import BybitP2PScraper
from app.scrapers.crypto.remitano import RemitanoScraper
from app.scrapers.crypto.patricia import PatriciaScraper
from app.scrapers.crypto.paxful import PaxfulScraper
from app.models.arbscanner.price import CryptoPrice
from app.models.arbscanner.exchange import Exchange
from app.models.arbscanner.opportunity import ArbitrageOpportunity

logger = logging.getLogger(__name__)

# Supported cryptos
SUPPORTED_CRYPTOS = ["USDT", "BTC", "ETH"]

# Exchange scrapers
EXCHANGE_SCRAPERS = {
    "quidax": QuidaxAPI,
    "luno": LunoAPI,
    "binance_p2p": BinanceP2PScraper,
    "bybit_p2p": BybitP2PScraper,
    "remitano": RemitanoScraper,
    "patricia": PatriciaScraper,
    "paxful": PaxfulScraper,
}


class PriceService:
    """Service for fetching and managing crypto prices."""

    def __init__(self, db: Session):
        self.db = db
        self._price_cache: Dict[str, Dict] = {}
        self._cache_timestamp: Optional[datetime] = None
        self._cache_ttl = timedelta(seconds=60)  # 1 minute cache

    async def fetch_all_prices(self, crypto: str = "USDT") -> List[Dict]:
        """
        Fetch prices from all exchanges concurrently.

        Returns list of price data from each exchange.
        """
        tasks = []
        exchange_names = []

        for name, scraper_class in EXCHANGE_SCRAPERS.items():
            try:
                scraper = scraper_class()
                tasks.append(scraper.get_prices(crypto=crypto, fiat="NGN"))
                exchange_names.append(name)
            except Exception as e:
                logger.error(f"Error initializing {name}: {e}")

        results = await asyncio.gather(*tasks, return_exceptions=True)

        prices = []
        for name, result in zip(exchange_names, results):
            if isinstance(result, Exception):
                logger.error(f"Error fetching from {name}: {result}")
                continue
            if result and result.get("buy_price", 0) > 0:
                prices.append(result)

        # Update cache
        cache_key = f"{crypto}_NGN"
        self._price_cache[cache_key] = {
            "prices": prices,
            "timestamp": datetime.utcnow()
        }

        return prices

    async def get_current_prices(self, crypto: str = "USDT", force_refresh: bool = False) -> List[Dict]:
        """
        Get current prices, using cache if available.
        """
        cache_key = f"{crypto}_NGN"
        cached = self._price_cache.get(cache_key)

        if not force_refresh and cached:
            age = datetime.utcnow() - cached["timestamp"]
            if age < self._cache_ttl:
                return cached["prices"]

        return await self.fetch_all_prices(crypto)

    async def save_prices(self, prices: List[Dict]) -> None:
        """Save prices to database for historical tracking."""
        now = datetime.utcnow()

        for price_data in prices:
            exchange_name = price_data.get("exchange")

            # Get or create exchange record
            exchange = self.db.query(Exchange).filter(
                Exchange.name == exchange_name
            ).first()

            if not exchange:
                exchange = Exchange(
                    name=exchange_name,
                    display_name=price_data.get("display_name", exchange_name),
                    type=price_data.get("type", "exchange"),
                    is_active=True
                )
                self.db.add(exchange)
                self.db.flush()

            # Create price record
            price_record = CryptoPrice(
                time=now,
                exchange_id=exchange.id,
                crypto=price_data.get("crypto", "USDT"),
                fiat=price_data.get("fiat", "NGN"),
                buy_price=Decimal(str(price_data.get("buy_price", 0))),
                sell_price=Decimal(str(price_data.get("sell_price", 0))),
                volume_24h=Decimal(str(price_data.get("volume_24h", 0))) if price_data.get("volume_24h") else None
            )
            self.db.add(price_record)

        self.db.commit()

    def find_arbitrage_opportunities(self, prices: List[Dict], min_spread: float = 0.5) -> List[Dict]:
        """
        Find arbitrage opportunities between exchanges.

        Args:
            prices: List of price data from exchanges
            min_spread: Minimum spread percentage to consider

        Returns:
            List of arbitrage opportunities
        """
        opportunities = []

        # Compare each pair of exchanges
        for i, buy_exchange in enumerate(prices):
            for j, sell_exchange in enumerate(prices):
                if i == j:
                    continue

                buy_price = buy_exchange.get("buy_price", 0)
                sell_price = sell_exchange.get("sell_price", 0)

                if buy_price <= 0 or sell_price <= 0:
                    continue

                # Profit = sell_price - buy_price
                profit = sell_price - buy_price
                spread_percent = (profit / buy_price) * 100

                if spread_percent >= min_spread:
                    opportunities.append({
                        "crypto": buy_exchange.get("crypto", "USDT"),
                        "buy_exchange": buy_exchange.get("display_name", buy_exchange.get("exchange")),
                        "buy_exchange_id": buy_exchange.get("exchange"),
                        "buy_price": buy_price,
                        "sell_exchange": sell_exchange.get("display_name", sell_exchange.get("exchange")),
                        "sell_exchange_id": sell_exchange.get("exchange"),
                        "sell_price": sell_price,
                        "spread": profit,
                        "spread_percent": round(spread_percent, 2),
                        "potential_profit_per_1000": round(profit * (1000 / buy_price), 2),
                        "updated_at": datetime.utcnow().isoformat()
                    })

        # Sort by spread percentage descending
        opportunities.sort(key=lambda x: x["spread_percent"], reverse=True)
        return opportunities

    async def get_opportunities(self, crypto: str = "USDT", min_spread: float = 0.5) -> List[Dict]:
        """Get current arbitrage opportunities."""
        prices = await self.get_current_prices(crypto)
        return self.find_arbitrage_opportunities(prices, min_spread)

    async def get_all_opportunities(self, min_spread: float = 0.5) -> List[Dict]:
        """Get opportunities for all supported cryptos."""
        all_opportunities = []

        for crypto in SUPPORTED_CRYPTOS:
            try:
                opportunities = await self.get_opportunities(crypto, min_spread)
                all_opportunities.extend(opportunities)
            except Exception as e:
                logger.error(f"Error getting opportunities for {crypto}: {e}")

        # Sort all by spread
        all_opportunities.sort(key=lambda x: x["spread_percent"], reverse=True)
        return all_opportunities

    def get_exchange_info(self) -> List[Dict]:
        """Get info about all supported exchanges."""
        exchanges = []
        for name, scraper_class in EXCHANGE_SCRAPERS.items():
            scraper = scraper_class()
            exchanges.append({
                "id": scraper.name,
                "name": scraper.display_name,
                "type": scraper.type,
            })
        return exchanges
