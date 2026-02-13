"""
Naira exchange rate scraper.

Fetches USD/NGN, GBP/NGN, EUR/NGN rates from multiple sources:
- Primary: nairatoday.com (black market buy/sell + CBN official rates)
- Fallback: open.er-api.com for official rates + USDT P2P for parallel
"""
import logging
import re
from datetime import datetime
from typing import Dict, Optional

import httpx
from bs4 import BeautifulSoup

from app.config import settings
from app.core.redis import redis_client

logger = logging.getLogger(__name__)

# Hardcoded fallback rates (updated Feb 2026 as a last resort)
FALLBACK_RATES = {
    "USD": {"cbn": 1355.0, "buy": 1420.0, "sell": 1440.0},
    "GBP": {"cbn": 1845.0, "buy": 1940.0, "sell": 1970.0},
    "EUR": {"cbn": 1609.0, "buy": 1655.0, "sell": 1700.0},
}

CURRENCY_META = {
    "USD": {"name": "US Dollar", "flag": "\U0001f1fa\U0001f1f8"},
    "GBP": {"name": "British Pound", "flag": "\U0001f1ec\U0001f1e7"},
    "EUR": {"name": "Euro", "flag": "\U0001f1ea\U0001f1fa"},
}

CACHE_KEY = "naira:rates"
CACHE_TTL = 300  # 5 minutes


class NairaRateScraper:
    """Scrapes Naira exchange rates from multiple sources."""

    def __init__(self):
        self.headers = {
            "User-Agent": settings.SCRAPER_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
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
            "source": "nairatoday.com",
            "updated_at": datetime.utcnow().isoformat(),
        }

        # Primary: scrape nairatoday.com for real black market + CBN rates
        scraped = await self._scrape_nairatoday()

        if not scraped:
            # Fallback: use existing approach (API for official, USDT P2P for parallel)
            logger.warning("nairatoday.com scrape failed, falling back to API sources")
            rates["source"] = "api_fallback"
            scraped = await self._fallback_rates()

        for currency in ["USD", "GBP", "EUR"]:
            meta = CURRENCY_META[currency]
            fallback = FALLBACK_RATES[currency]

            data = scraped.get(currency, {})
            official = data.get("cbn", fallback["cbn"])
            buy = data.get("buy", fallback["buy"])
            sell = data.get("sell", fallback["sell"])
            # Parallel rate = midpoint of buy and sell
            parallel = round((buy + sell) / 2, 2)

            rates["currencies"][currency] = {
                "code": currency,
                "name": meta["name"],
                "flag": meta["flag"],
                "official": round(official, 2),
                "parallel": round(parallel, 2),
                "buy": round(buy, 2),
                "sell": round(sell, 2),
                "spread": round(parallel - official, 2),
                "spread_percent": round(((parallel - official) / official) * 100, 2) if official else 0,
            }

        # Cache result
        redis_client.set_json(CACHE_KEY, rates, expire_seconds=CACHE_TTL)

        return rates

    async def _scrape_nairatoday(self) -> Optional[Dict]:
        """
        Scrape nairatoday.com for black market buy/sell and CBN rates.
        Returns {currency: {buy, sell, cbn}} or None on failure.
        """
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                headers=self.headers,
                follow_redirects=True,
            ) as client:
                response = await client.get("https://nairatoday.com/")

                if response.status_code != 200:
                    logger.warning(f"nairatoday.com returned status {response.status_code}")
                    return None

                soup = BeautifulSoup(response.text, "html.parser")
                return self._parse_nairatoday(soup)

        except Exception as e:
            logger.error(f"Error scraping nairatoday.com: {e}")
            return None

    def _parse_nairatoday(self, soup: BeautifulSoup) -> Optional[Dict]:
        """
        Parse nairatoday.com HTML to extract rates.
        The page has rate data with buy/sell prices and CBN official rates.
        """
        rates = {}
        text = soup.get_text(" ", strip=True)

        # Currency patterns to search for in the page text
        currency_patterns = {
            "USD": [
                r"(?:dollar|usd).*?(?:buy|buying)[:\s]*(?:₦|NGN)?\s*([\d,]+)",
                r"(?:dollar|usd).*?(?:sell|selling)[:\s]*(?:₦|NGN)?\s*([\d,]+)",
                r"(?:dollar|usd).*?(?:cbn|official|central\s*bank)[:\s]*(?:₦|NGN)?\s*([\d,]+)",
            ],
            "GBP": [
                r"(?:pound|gbp).*?(?:buy|buying)[:\s]*(?:₦|NGN)?\s*([\d,]+)",
                r"(?:pound|gbp).*?(?:sell|selling)[:\s]*(?:₦|NGN)?\s*([\d,]+)",
                r"(?:pound|gbp).*?(?:cbn|official|central\s*bank)[:\s]*(?:₦|NGN)?\s*([\d,]+)",
            ],
            "EUR": [
                r"(?:euro|eur).*?(?:buy|buying)[:\s]*(?:₦|NGN)?\s*([\d,]+)",
                r"(?:euro|eur).*?(?:sell|selling)[:\s]*(?:₦|NGN)?\s*([\d,]+)",
                r"(?:euro|eur).*?(?:cbn|official|central\s*bank)[:\s]*(?:₦|NGN)?\s*([\d,]+)",
            ],
        }

        for currency, patterns in currency_patterns.items():
            buy_match = re.search(patterns[0], text, re.IGNORECASE)
            sell_match = re.search(patterns[1], text, re.IGNORECASE)
            cbn_match = re.search(patterns[2], text, re.IGNORECASE)

            if buy_match and sell_match:
                buy = float(buy_match.group(1).replace(",", ""))
                sell = float(sell_match.group(1).replace(",", ""))
                cbn = float(cbn_match.group(1).replace(",", "")) if cbn_match else FALLBACK_RATES[currency]["cbn"]

                # Sanity check: rates should be reasonable
                if buy > 100 and sell > 100 and sell >= buy:
                    rates[currency] = {"buy": buy, "sell": sell, "cbn": cbn}
                    logger.info(f"nairatoday.com {currency}: buy={buy}, sell={sell}, cbn={cbn}")
                else:
                    logger.warning(f"nairatoday.com {currency}: unreasonable rates buy={buy} sell={sell}")

        # Also try extracting from structured elements (tables, specific divs)
        if not rates:
            rates = self._parse_nairatoday_tables(soup)

        if rates:
            return rates

        logger.warning("Could not parse any rates from nairatoday.com")
        return None

    def _parse_nairatoday_tables(self, soup: BeautifulSoup) -> Dict:
        """
        Try extracting rates from table elements on the page.
        """
        rates = {}

        # Look for table cells containing rate data
        for table in soup.find_all("table"):
            rows = table.find_all("tr")
            for row in rows:
                cells = row.find_all(["td", "th"])
                row_text = " ".join(c.get_text(strip=True) for c in cells).lower()

                for currency, keyword in [("USD", "dollar"), ("GBP", "pound"), ("EUR", "euro")]:
                    if keyword in row_text and currency not in rates:
                        # Extract all numbers from this row
                        numbers = re.findall(r"[\d,]+(?:\.\d+)?", row_text)
                        numbers = [float(n.replace(",", "")) for n in numbers if float(n.replace(",", "")) > 100]

                        if len(numbers) >= 2:
                            # Typically: buy, sell (possibly more columns)
                            buy = min(numbers[:2])
                            sell = max(numbers[:2])
                            cbn = numbers[2] if len(numbers) > 2 else FALLBACK_RATES[currency]["cbn"]
                            rates[currency] = {"buy": buy, "sell": sell, "cbn": cbn}

        return rates

    async def _fallback_rates(self) -> Dict:
        """
        Fallback: use free APIs for official rates and USDT P2P for parallel.
        """
        result = {}

        # Get official rates from API
        api_rates = await self._fetch_exchange_rate_api()

        # Get USDT parallel rate
        usd_parallel = await self._get_usdt_parallel_rate()

        for currency in ["USD", "GBP", "EUR"]:
            fallback = FALLBACK_RATES[currency]
            official = api_rates.get(currency, fallback["cbn"])

            if currency == "USD":
                parallel = usd_parallel or fallback["sell"]
                buy = parallel - 20  # Approximate spread
                sell = parallel
            else:
                usd_official = api_rates.get("USD", FALLBACK_RATES["USD"]["cbn"])
                usd_par = usd_parallel or FALLBACK_RATES["USD"]["sell"]
                if usd_official > 0:
                    ratio = usd_par / usd_official
                    sell = round(official * ratio, 2)
                    buy = sell - 30
                else:
                    buy = fallback["buy"]
                    sell = fallback["sell"]

            result[currency] = {"buy": buy, "sell": sell, "cbn": official}

        return result

    async def _get_usdt_parallel_rate(self) -> Optional[float]:
        """
        Get the average USDT/NGN P2P rate as a proxy for parallel market USD rate.
        """
        try:
            prices_data = redis_client.get_json("prices:USDT:aggregate")
            if not prices_data:
                return None

            exchanges = prices_data.get("exchanges", [])
            if not exchanges:
                return None

            buy_prices = [ex["buy_price"] for ex in exchanges if ex.get("buy_price", 0) > 0]
            if not buy_prices:
                return None

            return round(sum(buy_prices) / len(buy_prices), 2)

        except Exception as e:
            logger.error(f"Error getting USDT parallel rate: {e}")
            return None

    async def _fetch_exchange_rate_api(self) -> Dict[str, float]:
        """
        Fetch official/indicative NGN rates from free exchange rate APIs.
        """
        # Try open.er-api.com (free, no key)
        try:
            async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
                response = await client.get("https://open.er-api.com/v6/latest/USD")
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

        return {k: v["cbn"] for k, v in FALLBACK_RATES.items()}
