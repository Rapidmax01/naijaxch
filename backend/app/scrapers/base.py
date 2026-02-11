from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import httpx
import logging
from datetime import datetime

from app.config import settings

logger = logging.getLogger(__name__)


class BaseExchangeScraper(ABC):
    """Base class for all exchange scrapers."""

    def __init__(self):
        self.name: str = ""
        self.display_name: str = ""
        self.type: str = ""  # "p2p" or "exchange"
        self.base_url: str = ""
        self.timeout: float = 30.0
        self.headers: Dict[str, str] = {
            "User-Agent": settings.SCRAPER_USER_AGENT
        }
        # Proxy configuration
        self.proxy_url: Optional[str] = settings.PROXY_URL

    @abstractmethod
    async def get_prices(
        self,
        crypto: str = "USDT",
        fiat: str = "NGN"
    ) -> Dict:
        """
        Get current prices for a crypto/fiat pair.

        Returns:
            Dict with buy_price, sell_price, and other metadata
        """
        pass

    def _get_client_kwargs(self) -> Dict:
        """Get httpx client configuration."""
        kwargs = {
            "timeout": self.timeout,
            "headers": self.headers,
        }
        if self.proxy_url:
            kwargs["proxy"] = self.proxy_url
        return kwargs

    async def _make_request(
        self,
        method: str,
        url: str,
        **kwargs
    ) -> httpx.Response:
        """Make an HTTP request with error handling and optional proxy."""
        client_kwargs = self._get_client_kwargs()
        async with httpx.AsyncClient(**client_kwargs) as client:
            response = await client.request(
                method,
                url,
                **kwargs
            )
            response.raise_for_status()
            return response

    def _log_error(self, method: str, error: Exception) -> None:
        """Log scraper errors with context."""
        logger.error(
            f"[{self.display_name}] {method} failed: {type(error).__name__}: {error}"
        )

    def _format_response(
        self,
        buy_price: float,
        sell_price: float,
        crypto: str = "USDT",
        fiat: str = "NGN",
        **extra
    ) -> Dict:
        """Format the price response."""
        spread = sell_price - buy_price
        spread_percent = (spread / buy_price) * 100 if buy_price else 0

        return {
            "exchange": self.name,
            "display_name": self.display_name,
            "type": self.type,
            "crypto": crypto,
            "fiat": fiat,
            "buy_price": buy_price,
            "sell_price": sell_price,
            "spread": spread,
            "spread_percent": round(spread_percent, 4),
            "updated_at": datetime.utcnow().isoformat(),
            **extra
        }
