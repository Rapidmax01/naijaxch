import httpx
from typing import List, Dict
import asyncio

from app.scrapers.base import BaseExchangeScraper


class BinanceP2PScraper(BaseExchangeScraper):
    """
    Scrape Binance P2P for crypto prices.

    Binance P2P uses an unofficial API endpoint for searching ads.
    This scraper fetches the best buy and sell prices for NGN pairs.
    """

    def __init__(self):
        super().__init__()
        self.name = "binance_p2p"
        self.display_name = "Binance P2P"
        self.type = "p2p"
        self.base_url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"

    async def get_prices(
        self,
        crypto: str = "USDT",
        fiat: str = "NGN"
    ) -> Dict:
        """Get best buy and sell prices from Binance P2P."""

        buy_ads, sell_ads = await asyncio.gather(
            self._fetch_ads(crypto, fiat, "BUY"),
            self._fetch_ads(crypto, fiat, "SELL"),
            return_exceptions=True
        )

        # Handle exceptions
        if isinstance(buy_ads, Exception):
            buy_ads = []
        if isinstance(sell_ads, Exception):
            sell_ads = []

        # Best buy price (lowest price to buy crypto = highest NGN value for buyers)
        best_buy = min(buy_ads, key=lambda x: x["price"]) if buy_ads else None

        # Best sell price (highest price to sell crypto = lowest NGN value for sellers)
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
        trade_type: str
    ) -> List[Dict]:
        """
        Fetch P2P ads from Binance.

        Args:
            crypto: Cryptocurrency (USDT, BTC, ETH)
            fiat: Fiat currency (NGN)
            trade_type: BUY or SELL
                - BUY = You buy crypto (merchant sells)
                - SELL = You sell crypto (merchant buys)
        """

        payload = {
            "asset": crypto,
            "fiat": fiat,
            "merchantCheck": False,  # Include all advertisers
            "page": 1,
            "payTypes": [],  # All payment methods
            "publisherType": None,
            "rows": 10,
            "tradeType": trade_type,
            "transAmount": ""  # No amount filter
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
                    return self._parse_ads(data, trade_type)
        except Exception as e:
            self._log_error(f"_fetch_ads({crypto}, {fiat}, {trade_type})", e)

        return []

    def _parse_ads(self, data: dict, trade_type: str) -> List[Dict]:
        """Parse Binance P2P response."""
        results = []

        for ad in data.get("data", []):
            adv = ad.get("adv", {})
            advertiser = ad.get("advertiser", {})

            results.append({
                "price": float(adv.get("price", 0)),
                "min_amount": float(adv.get("minSingleTransAmount", 0)),
                "max_amount": float(adv.get("maxSingleTransAmount", 0)),
                "available": float(adv.get("surplusAmount", 0)),
                "merchant": advertiser.get("nickName", "Unknown"),
                "completion_rate": float(advertiser.get("monthFinishRate", 0)) * 100,
                "orders": advertiser.get("monthOrderCount", 0),
                "trade_type": trade_type
            })

        return results
