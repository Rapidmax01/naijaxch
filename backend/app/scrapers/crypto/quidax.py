import httpx
import logging
from typing import Dict, Optional

from app.scrapers.base import BaseExchangeScraper

logger = logging.getLogger(__name__)


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

        # Try multiple pair formats
        pair_formats = [
            f"{crypto.lower()}{fiat.lower()}",
            f"{crypto.lower()}_{fiat.lower()}",
        ]

        ticker = None
        for pair in pair_formats:
            ticker = await self.get_ticker(pair)
            if ticker.get("buy_price", 0) > 0 and ticker.get("sell_price", 0) > 0:
                break

        # Fallback to orderbook if ticker returned zeros
        if not ticker or (ticker.get("buy_price", 0) == 0 and ticker.get("sell_price", 0) == 0):
            for pair in pair_formats:
                ob_prices = await self._prices_from_orderbook(pair)
                if ob_prices.get("buy_price", 0) > 0:
                    ticker = ob_prices
                    break

        if not ticker:
            ticker = {"buy_price": 0, "sell_price": 0}

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

                    # Resilient field parsing: buy/sell OR ask/bid
                    buy_price = float(
                        ticker.get("buy", 0) or ticker.get("ask", 0) or 0
                    )
                    sell_price = float(
                        ticker.get("sell", 0) or ticker.get("bid", 0) or 0
                    )

                    return {
                        "exchange": "quidax",
                        "pair": pair,
                        "buy_price": buy_price,
                        "sell_price": sell_price,
                        "last_price": float(ticker.get("last", 0) or 0),
                        "volume_24h": float(ticker.get("vol", 0) or 0),
                        "high_24h": float(ticker.get("high", 0) or 0),
                        "low_24h": float(ticker.get("low", 0) or 0)
                    }
                else:
                    logger.warning(
                        f"[Quidax] get_ticker({pair}) returned HTTP {response.status_code}: "
                        f"{response.text[:200]}"
                    )
        except Exception as e:
            self._log_error(f"get_ticker({pair})", e)

        return {
            "buy_price": 0,
            "sell_price": 0,
            "volume_24h": 0
        }

    async def _prices_from_orderbook(self, pair: str) -> Dict:
        """Extract best bid/ask from orderbook as fallback."""
        orderbook = await self.get_orderbook(pair)

        buy_price = 0.0
        sell_price = 0.0

        asks = orderbook.get("asks", [])
        bids = orderbook.get("bids", [])

        if asks:
            # Best ask = lowest ask price = what user pays to buy
            try:
                buy_price = float(asks[0].get("price", 0) if isinstance(asks[0], dict) else asks[0][0])
            except (ValueError, TypeError, IndexError):
                pass

        if bids:
            # Best bid = highest bid price = what user gets when selling
            try:
                sell_price = float(bids[0].get("price", 0) if isinstance(bids[0], dict) else bids[0][0])
            except (ValueError, TypeError, IndexError):
                pass

        return {
            "buy_price": buy_price,
            "sell_price": sell_price,
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
                else:
                    logger.warning(
                        f"[Quidax] get_orderbook({pair}) returned HTTP {response.status_code}"
                    )
        except Exception as e:
            self._log_error(f"get_orderbook({pair})", e)

        return {}
