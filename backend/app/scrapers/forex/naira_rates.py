"""
Naira exchange rate scraper.

Fetches USD/NGN, GBP/NGN, EUR/NGN rates from multiple sources:
- USDT P2P rates (proxy for parallel market) from existing crypto scrapers
- Open exchange rates API (free tier) for official/indicative rates
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional
import httpx

from app.config import settings
from app.core.redis import redis_client

logger = logging.getLogger(__name__)

# Hardcoded fallback rates (updated periodically as a last resort)
FALLBACK_RATES = {
    "USD": {"cbn": 1550.0, "parallel": 1620.0},
    "GBP": {"cbn": 1960.0, "parallel": 2050.0},
    "EUR": {"cbn": 1680.0, "parallel": 1750.0},
}

CACHE_KEY = "naira:rates"
CACHE_TTL = 300  # 5 minutes


class NairaRateScraper:
    """Scrapes Naira exchange rates from multiple sources."""

    def __init__(self):
        self.headers = {"User-Agent": settings.SCRAPER_USER_AGENT}
        self.timeout = 20.0

    async def get_rates(self) -> Dict:
        """
        Get current NGN exchange rates.
        Returns official (CBN) and parallel market rates for USD, GBP, EUR.
        """
        # Check cache first
        cached = redis_client.get_json(CACHE_KEY)
        if cached:
            return cached

        rates = {
            "currencies": {},
            "source": "live",
            "updated_at": datetime.utcnow().isoformat(),
        }

        # Fetch USDT P2P rates as parallel market proxy for USD
        usd_parallel = await self._get_usdt_parallel_rate()

        # Fetch rates from free API
        api_rates = await self._fetch_exchange_rate_api()

        for currency in ["USD", "GBP", "EUR"]:
            fallback = FALLBACK_RATES[currency]

            # Official rate from API
            official = api_rates.get(currency, fallback["cbn"])

            # Parallel rate: for USD use USDT P2P, for others derive from USD ratio
            if currency == "USD":
                parallel = usd_parallel or fallback["parallel"]
            else:
                # Derive from the USD parallel rate and cross-rate ratios
                usd_official = api_rates.get("USD", FALLBACK_RATES["USD"]["cbn"])
                usd_par = usd_parallel or FALLBACK_RATES["USD"]["parallel"]
                if usd_official > 0:
                    ratio = usd_par / usd_official
                    parallel = round(official * ratio, 2)
                else:
                    parallel = fallback["parallel"]

            rates["currencies"][currency] = {
                "code": currency,
                "name": {"USD": "US Dollar", "GBP": "British Pound", "EUR": "Euro"}[currency],
                "flag": {"USD": "🇺🇸", "GBP": "🇬🇧", "EUR": "🇪🇺"}[currency],
                "official": round(official, 2),
                "parallel": round(parallel, 2),
                "spread": round(parallel - official, 2),
                "spread_percent": round(((parallel - official) / official) * 100, 2) if official else 0,
            }

        # Cache result
        redis_client.set_json(CACHE_KEY, rates, expire_seconds=CACHE_TTL)

        return rates

    async def _get_usdt_parallel_rate(self) -> Optional[float]:
        """
        Get the average USDT/NGN P2P rate as a proxy for parallel market USD rate.
        Uses the already-cached crypto prices.
        """
        try:
            prices_data = redis_client.get_json("prices:USDT:aggregate")
            if not prices_data:
                return None

            exchanges = prices_data.get("exchanges", [])
            if not exchanges:
                return None

            # Average of all buy prices (what you'd pay in NGN for 1 USDT ≈ 1 USD)
            buy_prices = [ex["buy_price"] for ex in exchanges if ex.get("buy_price", 0) > 0]
            if not buy_prices:
                return None

            return round(sum(buy_prices) / len(buy_prices), 2)

        except Exception as e:
            logger.error(f"Error getting USDT parallel rate: {e}")
            return None

    async def _fetch_exchange_rate_api(self) -> Dict[str, float]:
        """
        Fetch official/indicative NGN rates from a free exchange rate API.
        Returns {currency: ngn_rate} mapping.
        """
        try:
            # Using exchangerate.host (free, no API key required)
            async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
                response = await client.get(
                    "https://api.exchangerate.host/latest",
                    params={"base": "NGN", "symbols": "USD,GBP,EUR"},
                )

                if response.status_code == 200:
                    data = response.json()
                    rates_data = data.get("rates", {})
                    # API returns how many USD per 1 NGN, we need NGN per 1 USD
                    result = {}
                    for currency in ["USD", "GBP", "EUR"]:
                        rate = rates_data.get(currency, 0)
                        if rate and rate > 0:
                            result[currency] = round(1 / rate, 2)
                    if result:
                        return result
        except Exception as e:
            logger.warning(f"exchangerate.host API failed: {e}")

        # Fallback: try open.er-api.com (free)
        try:
            async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
                response = await client.get(
                    "https://open.er-api.com/v6/latest/USD",
                )
                if response.status_code == 200:
                    data = response.json()
                    ngn_per_usd = data.get("rates", {}).get("NGN", 0)
                    gbp_per_usd = data.get("rates", {}).get("GBP", 0)
                    eur_per_usd = data.get("rates", {}).get("EUR", 0)

                    result = {}
                    if ngn_per_usd > 0:
                        result["USD"] = round(ngn_per_usd, 2)
                    if gbp_per_usd > 0 and ngn_per_usd > 0:
                        result["GBP"] = round(ngn_per_usd / gbp_per_usd, 2)
                    if eur_per_usd > 0 and ngn_per_usd > 0:
                        result["EUR"] = round(ngn_per_usd / eur_per_usd, 2)
                    if result:
                        return result
        except Exception as e:
            logger.warning(f"open.er-api.com failed: {e}")

        # Return fallback CBN rates
        return {k: v["cbn"] for k, v in FALLBACK_RATES.items()}
