import httpx
from typing import Dict, Optional

from app.scrapers.base import BaseExchangeScraper


class QuidaxAPI(BaseExchangeScraper):
    """
    Quidax official API integration.

    Quidax is a Nigerian cryptocurrency exchange with an official API.
    Docs: https://docs.quidax.com/
    """

    def __init__(self, api_key: str = None, api_secret: str = None):
        super().__init__()
        self.name = "quidax"
        self.display_name = "Quidax"
        self.type = "exchange"
        self.base_url = "https://www.quidax.com/api/v1"
        self.api_key = api_key
        self.api_secret = api_secret

    async def get_prices(
        self,
        crypto: str = "USDT",
        fiat: str = "NGN"
    ) -> Dict:
        """Get current prices from Quidax."""

        # Format pair for Quidax (lowercase)
        pair = f"{crypto.lower()}{fiat.lower()}"
        ticker = await self.get_ticker(pair)

        return self._format_response(
            buy_price=ticker.get("buy_price", 0),
            sell_price=ticker.get("sell_price", 0),
            crypto=crypto,
            fiat=fiat,
            volume_24h=ticker.get("volume_24h"),
            high_24h=ticker.get("high_24h"),
            low_24h=ticker.get("low_24h")
        )

    async def get_ticker(self, pair: str = "usdtngn") -> Dict:
        """
        Get current ticker for a trading pair.

        Pairs: btcngn, usdtngn, ethngn, etc.
        """

        url = f"{self.base_url}/markets/tickers/{pair}"

        try:
            async with httpx.AsyncClient(**self._get_client_kwargs()) as client:
                response = await client.get(url)

                if response.status_code == 200:
                    data = response.json()
                    ticker = data.get("data", {}).get("ticker", {})

                    return {
                        "exchange": "quidax",
                        "pair": pair,
                        "buy_price": float(ticker.get("buy", 0)),  # Best ask
                        "sell_price": float(ticker.get("sell", 0)),  # Best bid
                        "last_price": float(ticker.get("last", 0)),
                        "volume_24h": float(ticker.get("vol", 0)),
                        "high_24h": float(ticker.get("high", 0)),
                        "low_24h": float(ticker.get("low", 0))
                    }
        except Exception as e:
            self._log_error(f"get_ticker({pair})", e)

        return {
            "buy_price": 0,
            "sell_price": 0,
            "volume_24h": 0
        }

    async def get_all_tickers(self) -> Dict:
        """Get all market tickers."""

        url = f"{self.base_url}/markets/tickers"

        try:
            async with httpx.AsyncClient(**self._get_client_kwargs()) as client:
                response = await client.get(url)

                if response.status_code == 200:
                    return response.json().get("data", {})
        except Exception as e:
            self._log_error("get_all_tickers", e)

        return {}

    async def get_orderbook(self, pair: str = "usdtngn") -> Dict:
        """Get orderbook for a trading pair."""

        url = f"{self.base_url}/markets/{pair}/order_book"

        try:
            async with httpx.AsyncClient(**self._get_client_kwargs()) as client:
                response = await client.get(url)

                if response.status_code == 200:
                    return response.json().get("data", {})
        except Exception as e:
            self._log_error(f"get_orderbook({pair})", e)

        return {}
