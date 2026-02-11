"""Remitano P2P scraper."""
import httpx
from typing import Dict, List
import asyncio

from app.scrapers.base import BaseExchangeScraper


class RemitanoScraper(BaseExchangeScraper):
    """
    Scrape Remitano P2P for crypto prices.

    Remitano is a popular P2P exchange in Nigeria.
    """

    def __init__(self):
        super().__init__()
        self.name = "remitano"
        self.display_name = "Remitano"
        self.type = "p2p"
        self.base_url = "https://remitano.com/api/v1/coinorders/ads"

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
        """Fetch P2P ads from Remitano."""

        # Remitano uses coin codes
        coin_map = {
            "USDT": "usdt",
            "BTC": "btc",
            "ETH": "eth",
        }
        coin = coin_map.get(crypto.upper(), crypto.lower())

        url = f"{self.base_url}"
        params = {
            "coin": coin,
            "fiat": fiat.lower(),
            "type": trade_type,
            "country": "ng",
        }

        try:
            client_kwargs = self._get_client_kwargs()
            async with httpx.AsyncClient(**client_kwargs) as client:
                response = await client.get(url, params=params)

                if response.status_code == 200:
                    data = response.json()
                    return self._parse_ads(data, trade_type)
        except Exception as e:
            self._log_error(f"_fetch_ads({crypto}, {fiat}, {trade_type})", e)

        return []

    def _parse_ads(self, data: dict, trade_type: str) -> List[Dict]:
        """Parse Remitano response."""
        results = []

        ads = data.get("ads", []) or data if isinstance(data, list) else []

        for ad in ads[:10]:
            try:
                results.append({
                    "price": float(ad.get("price", 0)),
                    "min_amount": float(ad.get("min_amount", 0) or 0),
                    "max_amount": float(ad.get("max_amount", 0) or 0),
                    "available": float(ad.get("coin_amount", 0) or 0),
                    "merchant": ad.get("username", "Unknown"),
                    "trade_type": trade_type.upper()
                })
            except (ValueError, TypeError):
                continue

        return results
