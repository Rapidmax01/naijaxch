"""Paxful P2P scraper."""
import httpx
import logging
from typing import Dict, List
import asyncio

from app.scrapers.base import BaseExchangeScraper

logger = logging.getLogger(__name__)


class PaxfulScraper(BaseExchangeScraper):
    """
    Scrape Paxful / Noones P2P for crypto prices.

    Paxful was acquired by Noones — try both domains.
    """

    API_URLS = [
        "https://paxful.com/api/offer/list",
        "https://noones.com/api/offer/list",
    ]

    def __init__(self):
        super().__init__()
        self.name = "paxful"
        self.display_name = "Paxful"
        self.type = "p2p"
        self.base_url = self.API_URLS[0]

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
        """Fetch P2P ads, trying Paxful then Noones."""

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

        for base_url in self.API_URLS:
            try:
                client_kwargs = self._get_client_kwargs()
                # Extract origin from URL for headers
                origin = base_url.rsplit("/api/", 1)[0]
                client_kwargs["headers"].update({
                    "Accept": "application/json",
                    "Origin": origin,
                    "Referer": f"{origin}/",
                })

                async with httpx.AsyncClient(**client_kwargs) as client:
                    response = await client.get(base_url, params=params)

                    if response.status_code == 200:
                        data = response.json()
                        ads = self._parse_ads(data, trade_type)
                        if ads:
                            return ads
                    else:
                        logger.warning(
                            f"[Paxful] {base_url} returned HTTP {response.status_code}: "
                            f"{response.text[:200]}"
                        )
            except Exception as e:
                self._log_error(f"_fetch_ads({base_url}, {crypto}, {fiat}, {trade_type})", e)

        return []

    def _parse_ads(self, data, trade_type: str) -> List[Dict]:
        """Parse Paxful/Noones response — handles both formats."""
        results = []

        offers = []
        if isinstance(data, dict):
            # Paxful format: data.data.offers[]
            inner = data.get("data", data)
            if isinstance(inner, dict):
                offers = inner.get("offers", inner.get("ads", []))
            elif isinstance(inner, list):
                offers = inner
        elif isinstance(data, list):
            offers = data

        for offer in offers[:10]:
            if not isinstance(offer, dict):
                continue
            try:
                price = float(
                    offer.get("fiat_price_per_crypto", 0)
                    or offer.get("price", 0)
                    or offer.get("rate", 0)
                    or 0
                )
                if price <= 0:
                    continue

                results.append({
                    "price": price,
                    "min_amount": float(offer.get("fiat_min", 0) or offer.get("min_amount", 0) or 0),
                    "max_amount": float(offer.get("fiat_max", 0) or offer.get("max_amount", 0) or 0),
                    "available": float(offer.get("crypto_amount", 0) or offer.get("amount", 0) or 0),
                    "merchant": offer.get("username", offer.get("seller", "Unknown")),
                    "trade_type": trade_type.upper()
                })
            except (ValueError, TypeError):
                continue

        return results
