"""Remitano P2P scraper."""
import httpx
import logging
from typing import Dict, List
import asyncio

from app.scrapers.base import BaseExchangeScraper

logger = logging.getLogger(__name__)


class RemitanoScraper(BaseExchangeScraper):
    """
    Scrape Remitano P2P for crypto prices.

    Remitano is a popular P2P exchange in Nigeria.
    """

    # Try multiple URL variants — API may have moved
    API_URLS = [
        "https://api.remitano.com/api/v1/coinorders/ads",
        "https://remitano.com/api/v1/coinorders/ads",
    ]

    def __init__(self):
        super().__init__()
        self.name = "remitano"
        self.display_name = "Remitano"
        self.type = "p2p"
        self.base_url = self.API_URLS[0]

    async def get_prices(
        self,
        crypto: str = "USDT",
        fiat: str = "NGN"
    ) -> Dict:
        """Get best buy and sell prices from Remitano."""

        buy_ads, sell_ads = await asyncio.gather(
            self._fetch_ads(crypto, fiat, "buy"),
            self._fetch_ads(crypto, fiat, "sell"),
            return_exceptions=True
        )

        if isinstance(buy_ads, Exception):
            buy_ads = []
        if isinstance(sell_ads, Exception):
            sell_ads = []

        # Best buy = lowest price to buy crypto
        best_buy = min(buy_ads, key=lambda x: x["price"]) if buy_ads else None
        # Best sell = highest price to sell crypto
        best_sell = max(sell_ads, key=lambda x: x["price"]) if sell_ads else None

        return self._format_response(
            buy_price=best_buy["price"] if best_buy else 0,
            sell_price=best_sell["price"] if best_sell else 0,
            crypto=crypto,
            fiat=fiat,
        )

    async def _fetch_ads(
        self,
        crypto: str,
        fiat: str,
        trade_type: str
    ) -> List[Dict]:
        """Fetch P2P ads from Remitano, trying multiple URLs."""

        # Remitano uses coin codes
        coin_map = {
            "USDT": "usdt",
            "BTC": "btc",
            "ETH": "eth",
        }
        coin = coin_map.get(crypto.upper(), crypto.lower())

        params = {
            "coin": coin,
            "fiat": fiat.lower(),
            "type": trade_type,
            "country": "ng",
        }

        for url in self.API_URLS:
            try:
                client_kwargs = self._get_client_kwargs()
                async with httpx.AsyncClient(**client_kwargs) as client:
                    response = await client.get(url, params=params)

                    if response.status_code == 200:
                        data = response.json()
                        ads = self._parse_ads(data, trade_type)
                        if ads:
                            return ads
                    else:
                        logger.warning(
                            f"[Remitano] {url} returned HTTP {response.status_code}: "
                            f"{response.text[:200]}"
                        )
            except Exception as e:
                self._log_error(f"_fetch_ads({url}, {crypto}, {fiat}, {trade_type})", e)

        return []

    def _parse_ads(self, data, trade_type: str) -> List[Dict]:
        """Parse Remitano response — handles multiple response shapes."""
        results = []

        # Try multiple response shapes
        ads = None
        if isinstance(data, list):
            ads = data
        elif isinstance(data, dict):
            for key in ("ads", "offers", "data"):
                candidate = data.get(key)
                if isinstance(candidate, list) and candidate:
                    ads = candidate
                    break
                elif isinstance(candidate, dict):
                    # data.data.ads[], data.data.offers[], etc.
                    for subkey in ("ads", "offers", "data"):
                        sub = candidate.get(subkey)
                        if isinstance(sub, list) and sub:
                            ads = sub
                            break
                    if ads:
                        break

        if not ads:
            return results

        for ad in ads[:10]:
            if not isinstance(ad, dict):
                continue
            try:
                # Accept multiple price field names
                price = float(
                    ad.get("price", 0) or ad.get("fiat_price", 0) or ad.get("rate", 0) or 0
                )
                if price <= 0:
                    continue

                results.append({
                    "price": price,
                    "min_amount": float(ad.get("min_amount", 0) or 0),
                    "max_amount": float(ad.get("max_amount", 0) or 0),
                    "available": float(ad.get("coin_amount", 0) or ad.get("amount", 0) or 0),
                    "merchant": ad.get("username", ad.get("trader", {}).get("name", "Unknown")) if isinstance(ad.get("trader"), dict) else ad.get("username", "Unknown"),
                    "trade_type": trade_type.upper()
                })
            except (ValueError, TypeError):
                continue

        return results
