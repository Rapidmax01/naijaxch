"""Patricia exchange scraper."""
import httpx
from typing import Dict

from app.scrapers.base import BaseExchangeScraper


class PatriciaScraper(BaseExchangeScraper):
    """
    Scrape Patricia for crypto prices.

    Patricia is a Nigerian cryptocurrency exchange.
    """

    def __init__(self):
        super().__init__()
        self.name = "patricia"
        self.display_name = "Patricia"
        self.type = "exchange"
        self.base_url = "https://api.patricia.com.ng/api/v1"

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
        """Fetch exchange rates from Patricia."""

        url = f"{self.base_url}/rates"

        try:
            client_kwargs = self._get_client_kwargs()
            async with httpx.AsyncClient(**client_kwargs) as client:
                response = await client.get(url)

                if response.status_code == 200:
                    data = response.json()
                    return self._parse_rates(data)
        except Exception as e:
            self._log_error("_fetch_rates", e)

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
