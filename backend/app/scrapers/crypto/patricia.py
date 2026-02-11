"""Patricia exchange scraper."""
import httpx
import logging
from typing import Dict

from app.scrapers.base import BaseExchangeScraper

logger = logging.getLogger(__name__)


class PatriciaScraper(BaseExchangeScraper):
    """
    Scrape Patricia for crypto prices.

    Patricia is a Nigerian cryptocurrency exchange.
    Note: API may be unreliable after 2023 security incident.
    """

    # Try multiple URL variants — API status uncertain
    API_URLS = [
        "https://api.patricia.com.ng/api/v1/rates",
        "https://app.patricia.com.ng/api/v1/rates",
        "https://patricia.com.ng/api/v1/rates",
    ]

    def __init__(self):
        super().__init__()
        self.name = "patricia"
        self.display_name = "Patricia"
        self.type = "exchange"
        self.base_url = self.API_URLS[0]

    async def get_prices(
        self,
        crypto: str = "USDT",
        fiat: str = "NGN"
    ) -> Dict:
        """Get current prices from Patricia."""

        rates = await self._fetch_rates()

        crypto_key = crypto.lower()
        buy_price = rates.get(f"{crypto_key}_buy", 0)
        sell_price = rates.get(f"{crypto_key}_sell", 0)

        return self._format_response(
            buy_price=buy_price,
            sell_price=sell_price,
            crypto=crypto,
            fiat=fiat,
        )

    async def _fetch_rates(self) -> Dict:
        """Fetch exchange rates from Patricia, trying multiple URLs."""

        for url in self.API_URLS:
            try:
                client_kwargs = self._get_client_kwargs()
                async with httpx.AsyncClient(**client_kwargs) as client:
                    response = await client.get(url)

                    if response.status_code == 200:
                        data = response.json()
                        rates = self._parse_rates(data)
                        if rates:
                            return rates
                    else:
                        logger.warning(
                            f"[Patricia] {url} returned HTTP {response.status_code}: "
                            f"{response.text[:200]}"
                        )
            except Exception as e:
                self._log_error(f"_fetch_rates({url})", e)

        return {}

    def _parse_rates(self, data: dict) -> Dict:
        """Parse Patricia rates response."""
        rates = {}

        # Patricia returns rates in various formats
        # Try to extract buy/sell rates for common cryptos
        if isinstance(data, dict):
            result = data.get("data", data)

            if isinstance(result, dict):
                for key, value in result.items():
                    if isinstance(value, dict):
                        # Format: {crypto: {buy: x, sell: y}}
                        rates[f"{key.lower()}_buy"] = float(value.get("buy", 0) or 0)
                        rates[f"{key.lower()}_sell"] = float(value.get("sell", 0) or 0)
                    elif isinstance(value, (int, float)):
                        rates[key.lower()] = float(value)

        return rates
