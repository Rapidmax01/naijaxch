"""Paxful P2P scraper."""
import httpx
from typing import Dict, List
import asyncio

from app.scrapers.base import BaseExchangeScraper


class PaxfulScraper(BaseExchangeScraper):
    """
    Scrape Paxful P2P for crypto prices.

    Paxful is a global P2P marketplace.
    """

    def __init__(self):
        super().__init__()
        self.name = "paxful"
        self.display_name = "Paxful"
        self.type = "p2p"
        self.base_url = "https://paxful.com/api/offer/list"

    async def get_prices(
        self,
        crypto: str = "USDT",
        fiat: str = "NGN"
    ) -> Dict:
        """Get best buy and sell prices from Paxful."""

        buy_ads, sell_ads = await asyncio.gather(
            self._fetch_ads(crypto, fiat, "buy"),
            self._fetch_ads(crypto, fiat, "sell"),
            return_exceptions=True
        )

        if isinstance(buy_ads, Exception):
            buy_ads = []
        if isinstance(sell_ads, Exception):
            sell_ads = []

        best_buy = min(buy_ads, key=lambda x: x["price"]) if buy_ads else None
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
        """Fetch P2P ads from Paxful."""

        # Map crypto codes
        crypto_map = {
            "USDT": "usdt",
            "BTC": "btc",
            "ETH": "eth",
        }
        crypto_code = crypto_map.get(crypto.upper(), crypto.lower())

        params = {
            "crypto_currency": crypto_code,
            "currency": fiat.upper(),
            "type": trade_type,
            "limit": 10,
        }

        try:
            client_kwargs = self._get_client_kwargs()
            async with httpx.AsyncClient(**client_kwargs) as client:
                response = await client.get(self.base_url, params=params)

                if response.status_code == 200:
                    data = response.json()
                    return self._parse_ads(data, trade_type)
        except Exception:
            pass

        return []

    def _parse_ads(self, data: dict, trade_type: str) -> List[Dict]:
        """Parse Paxful response."""
        results = []

        offers = data.get("data", {}).get("offers", []) if isinstance(data, dict) else []

        for offer in offers[:10]:
            try:
                results.append({
                    "price": float(offer.get("fiat_price_per_crypto", 0) or offer.get("price", 0)),
                    "min_amount": float(offer.get("fiat_min", 0) or 0),
                    "max_amount": float(offer.get("fiat_max", 0) or 0),
                    "available": float(offer.get("crypto_amount", 0) or 0),
                    "merchant": offer.get("username", "Unknown"),
                    "trade_type": trade_type.upper()
                })
            except (ValueError, TypeError):
                continue

        return results
