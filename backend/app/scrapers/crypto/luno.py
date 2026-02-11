import httpx
from typing import Dict

from app.scrapers.base import BaseExchangeScraper


class LunoAPI(BaseExchangeScraper):
    """
    Luno API integration.

    Luno is a cryptocurrency exchange operating in Africa.
    Docs: https://www.luno.com/en/developers/api
    """

    def __init__(self, api_key: str = None, api_secret: str = None):
        super().__init__()
        self.name = "luno"
        self.display_name = "Luno"
        self.type = "exchange"
        self.base_url = "https://api.luno.com/api/1"
        self.api_key = api_key
        self.api_secret = api_secret

    async def get_prices(
        self,
        crypto: str = "USDT",
        fiat: str = "NGN"
    ) -> Dict:
        """Get current prices from Luno."""

        # Format pair for Luno (uppercase, no separator)
        # BTC = XBT on Luno
        crypto_code = "XBT" if crypto.upper() == "BTC" else crypto.upper()
        pair = f"{crypto_code}{fiat.upper()}"

        ticker = await self.get_ticker(pair)

        return self._format_response(
            buy_price=ticker.get("buy_price", 0),
            sell_price=ticker.get("sell_price", 0),
            crypto=crypto,
            fiat=fiat,
            volume_24h=ticker.get("volume_24h")
        )

    async def get_ticker(self, pair: str = "USDTNGN") -> Dict:
        """
        Get ticker for a trading pair.

        Pairs: XBTNGN (BTC), USDTNGN, ETHNGN
        """

        url = f"{self.base_url}/ticker"
        params = {"pair": pair}

        try:
            async with httpx.AsyncClient(**self._get_client_kwargs()) as client:
                response = await client.get(url, params=params)

                if response.status_code == 200:
                    data = response.json()

                    return {
                        "exchange": "luno",
                        "pair": pair,
                        "buy_price": float(data.get("ask", 0)),
                        "sell_price": float(data.get("bid", 0)),
                        "last_price": float(data.get("last_trade", 0)),
                        "volume_24h": float(data.get("rolling_24_hour_volume", 0))
                    }
        except Exception as e:
            self._log_error(f"get_ticker({pair})", e)

        return {
            "buy_price": 0,
            "sell_price": 0,
            "volume_24h": 0
        }

    async def get_all_tickers(self) -> Dict:
        """Get all available tickers."""

        url = f"{self.base_url}/tickers"

        try:
            async with httpx.AsyncClient(**self._get_client_kwargs()) as client:
                response = await client.get(url)

                if response.status_code == 200:
                    return response.json().get("tickers", [])
        except Exception as e:
            self._log_error("get_all_tickers", e)

        return []

    async def get_orderbook(self, pair: str = "USDTNGN") -> Dict:
        """Get orderbook for a trading pair."""

        url = f"{self.base_url}/orderbook"
        params = {"pair": pair}

        try:
            async with httpx.AsyncClient(**self._get_client_kwargs()) as client:
                response = await client.get(url, params=params)

                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            self._log_error(f"get_orderbook({pair})", e)

        return {}
