import httpx
from typing import List, Dict
import asyncio

from app.scrapers.base import BaseExchangeScraper


class BybitP2PScraper(BaseExchangeScraper):
    """
    Scrape Bybit P2P for crypto prices.
    """

    def __init__(self):
        super().__init__()
        self.name = "bybit_p2p"
        self.display_name = "Bybit P2P"
        self.type = "p2p"
        self.base_url = "https://api2.bybit.com/fiat/otc/item/online"

    async def get_prices(
        self,
        crypto: str = "USDT",
        fiat: str = "NGN"
    ) -> Dict:
        """Get best buy and sell prices from Bybit P2P."""

        buy_ads, sell_ads = await asyncio.gather(
            self._fetch_ads(crypto, fiat, "1"),  # 1 = Buy
            self._fetch_ads(crypto, fiat, "0"),  # 0 = Sell
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
            buy_ads=buy_ads[:5],
            sell_ads=sell_ads[:5]
        )

    async def _fetch_ads(
        self,
        crypto: str,
        fiat: str,
        side: str
    ) -> List[Dict]:
        """Fetch P2P ads from Bybit."""

        payload = {
            "tokenId": crypto,
            "currencyId": fiat,
            "side": side,
            "size": "10",
            "page": "1",
            "paymentMethod": []
        }

        try:
            client_kwargs = self._get_client_kwargs()
            client_kwargs["headers"]["Content-Type"] = "application/json"

            async with httpx.AsyncClient(**client_kwargs) as client:
                response = await client.post(
                    self.base_url,
                    json=payload,
                )

                if response.status_code == 200:
                    data = response.json()
                    return self._parse_ads(data, side)
        except Exception:
            pass

        return []

    def _parse_ads(self, data: dict, side: str) -> List[Dict]:
        """Parse Bybit P2P response."""
        results = []

        items = data.get("result", {}).get("items", [])
        for item in items:
            try:
                results.append({
                    "price": float(item.get("price", 0)),
                    "min_amount": float(item.get("minAmount", 0)),
                    "max_amount": float(item.get("maxAmount", 0)),
                    "available": float(item.get("quantity", 0)),
                    "merchant": item.get("nickName", "Unknown"),
                    "trade_type": "BUY" if side == "1" else "SELL"
                })
            except (ValueError, TypeError):
                continue

        return results
