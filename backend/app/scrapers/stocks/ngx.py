import httpx
import logging
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from datetime import datetime, date
import re

from app.core.redis import redis_client

logger = logging.getLogger(__name__)


class NGXScraper:
    """
    Scrape stock data from NGX (Nigerian Exchange) website.

    Data sources:
    - NGX website for daily prices
    - Alternative data providers as backup
    """

    def __init__(self):
        self.base_url = "https://ngxgroup.com"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        self.timeout = 60.0

    async def get_all_stocks(self) -> List[Dict]:
        """
        Get all listed stocks with current prices.
        Uses multiple data sources for reliability.
        """
        # Try AFX first (most reliable free source)
        stocks = await self._fetch_from_afx()

        if not stocks:
            # Try NGX official
            stocks = await self._fetch_from_ngx()

        if not stocks:
            # Fallback to stocks.ng
            stocks = await self._fetch_from_stocksng()

        return stocks

    async def _fetch_from_ngx(self) -> List[Dict]:
        """Fetch from NGX official website."""
        url = f"{self.base_url}/exchange/data/equities-price-list/"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self.headers,
                    timeout=self.timeout,
                    follow_redirects=True
                )

                if response.status_code == 200:
                    return self._parse_ngx_page(response.text)
        except Exception as e:
            logger.error("NGX fetch error: %s", e)

        return []

    async def _fetch_from_stocksng(self) -> List[Dict]:
        """Fetch from stocks.ng as alternative source."""
        url = "https://stocks.ng/stocks"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self.headers,
                    timeout=self.timeout,
                    follow_redirects=True
                )

                if response.status_code == 200:
                    return self._parse_stocksng_page(response.text)
        except Exception as e:
            logger.error("Stocks.ng fetch error: %s", e)

        return []

    async def _fetch_from_afx(self) -> List[Dict]:
        """Fetch from afx.kwayisi.org - free NGX data source."""
        url = "https://afx.kwayisi.org/ngx/"
        stocks = []

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self.headers,
                    timeout=self.timeout,
                    follow_redirects=True
                )

                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "html.parser")

                    # Find the main table with stock data
                    table = soup.find("table")
                    if table:
                        rows = table.find_all("tr")
                        for row in rows[1:]:  # Skip header
                            cols = row.find_all("td")
                            if len(cols) >= 5:
                                try:
                                    symbol = cols[0].get_text(strip=True)
                                    name = cols[1].get_text(strip=True) if len(cols) > 1 else ""
                                    close = self._parse_number(cols[2].get_text(strip=True)) if len(cols) > 2 else 0
                                    change_text = cols[3].get_text(strip=True) if len(cols) > 3 else "0"
                                    volume_text = cols[4].get_text(strip=True) if len(cols) > 4 else "0"

                                    # Parse change value
                                    change = self._parse_number(change_text.replace("+", "").replace("%", ""))

                                    # Parse volume (handle K, M, B suffixes)
                                    volume = self._parse_volume(volume_text)

                                    if symbol and close > 0:
                                        stocks.append({
                                            "symbol": symbol.upper(),
                                            "name": name,
                                            "close": close,
                                            "change_percent": change,
                                            "volume": volume,
                                            "date": date.today().isoformat()
                                        })
                                except Exception:
                                    continue
        except Exception as e:
            logger.error("AFX fetch error: %s", e)

        return stocks

    async def _fetch_summary_from_afx(self) -> Optional[Dict]:
        """Fetch market summary (ASI, market cap, etc.) from afx.kwayisi.org/ngx/."""
        url = "https://afx.kwayisi.org/ngx/"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self.headers,
                    timeout=self.timeout,
                    follow_redirects=True
                )

                if response.status_code != 200:
                    return None

                soup = BeautifulSoup(response.text, "html.parser")

                # The AFX page has summary data in <p> or header elements before the table.
                # Look for the ASI value - typically shown as a large number with
                # associated change, % change, market cap, volume, value, deals.
                summary = self._default_market_summary()

                # Strategy: find all text content before the stock table
                # The page structure has summary stats in <b> or header tags
                # Look for the main index section
                main = soup.find("main") or soup.find("body")
                if not main:
                    return None

                # Get all text blocks before the table
                table = soup.find("table")
                if not table:
                    return None

                # Find summary section - AFX uses <b> tags and <span> for the index data
                # Look for bold elements that contain large numbers (ASI)
                bold_elements = main.find_all("b")
                for b in bold_elements:
                    text = b.get_text(strip=True)
                    num = self._parse_number(text)
                    # ASI is typically > 50,000
                    if num > 50000:
                        summary["asi"] = num
                        break

                # Look for change values near ASI - typically in spans after the bold ASI
                # Find all spans that might contain change data
                spans = main.find_all("span")
                for span in spans:
                    text = span.get_text(strip=True)
                    # Look for point change (e.g., "+2,877.36" or "-500.00")
                    if text and (text.startswith("+") or text.startswith("-") or text.startswith("−")):
                        # Check if it's a percentage
                        if "%" in text:
                            pct = self._parse_number(text.replace("+", "").replace("−", "-"))
                            if text.startswith("−"):
                                pct = -abs(pct)
                            if abs(pct) < 20:  # Reasonable % change
                                summary["asi_change_percent"] = pct
                        else:
                            change = self._parse_number(text.replace("+", "").replace("−", "-"))
                            if text.startswith("−"):
                                change = -abs(change)
                            if abs(change) < 50000:  # Reasonable point change
                                summary["asi_change"] = change

                # Look for market cap, volume, value, deals in definition-list or table-like structures
                # AFX often uses <dt>/<dd> or label/value pairs
                dts = main.find_all("dt")
                for dt in dts:
                    label = dt.get_text(strip=True).lower()
                    dd = dt.find_next_sibling("dd")
                    if not dd:
                        continue
                    val_text = dd.get_text(strip=True)

                    if "cap" in label:
                        summary["market_cap"] = self._parse_large_number(val_text)
                    elif "volume" in label:
                        summary["volume"] = int(self._parse_large_number(val_text))
                    elif "value" in label:
                        summary["value"] = self._parse_large_number(val_text)
                    elif "deal" in label:
                        summary["deals"] = int(self._parse_number(val_text))

                # If we got a valid ASI, return the summary
                if summary["asi"] > 0:
                    logger.info("AFX market summary fetched: ASI=%.2f", summary["asi"])
                    return summary

        except Exception as e:
            logger.error("AFX market summary fetch error: %s", e)

        return None

    def _parse_large_number(self, text: str) -> float:
        """Parse large numbers with T/B/M/K suffixes (e.g., '108.5T', '7.2B')."""
        if not text:
            return 0.0
        text = text.strip().upper().replace(",", "")
        # Remove currency symbols
        text = re.sub(r"[₦$€£]", "", text).strip()
        multiplier = 1
        if text.endswith("T"):
            multiplier = 1_000_000_000_000
            text = text[:-1]
        elif text.endswith("B"):
            multiplier = 1_000_000_000
            text = text[:-1]
        elif text.endswith("M"):
            multiplier = 1_000_000
            text = text[:-1]
        elif text.endswith("K"):
            multiplier = 1_000
            text = text[:-1]
        try:
            return float(text) * multiplier
        except ValueError:
            return 0.0

    def _parse_volume(self, text: str) -> int:
        """Parse volume with K/M/B suffixes."""
        if not text:
            return 0
        text = text.strip().upper().replace(",", "")
        multiplier = 1
        if text.endswith("K"):
            multiplier = 1000
            text = text[:-1]
        elif text.endswith("M"):
            multiplier = 1000000
            text = text[:-1]
        elif text.endswith("B"):
            multiplier = 1000000000
            text = text[:-1]
        try:
            return int(float(text) * multiplier)
        except ValueError:
            return 0

    def _parse_ngx_page(self, html: str) -> List[Dict]:
        """Parse NGX equities page."""
        soup = BeautifulSoup(html, "html.parser")
        stocks = []

        # Look for data table
        table = soup.find("table", {"class": re.compile(r"table|dataTable", re.I)})
        if not table:
            tables = soup.find_all("table")
            table = tables[0] if tables else None

        if not table:
            return stocks

        tbody = table.find("tbody")
        if not tbody:
            return stocks

        rows = tbody.find_all("tr")

        for row in rows:
            cols = row.find_all("td")
            if len(cols) >= 6:
                try:
                    stock = {
                        "symbol": self._clean_text(cols[0].text),
                        "name": self._clean_text(cols[1].text) if len(cols) > 1 else "",
                        "close": self._parse_number(cols[2].text if len(cols) > 2 else "0"),
                        "change": self._parse_number(cols[3].text if len(cols) > 3 else "0"),
                        "volume": int(self._parse_number(cols[4].text if len(cols) > 4 else "0")),
                        "date": date.today().isoformat()
                    }
                    if stock["symbol"] and stock["close"] > 0:
                        stocks.append(stock)
                except Exception:
                    continue

        return stocks

    def _parse_stocksng_page(self, html: str) -> List[Dict]:
        """Parse stocks.ng page."""
        soup = BeautifulSoup(html, "html.parser")
        stocks = []

        # Look for stock cards or table
        stock_items = soup.find_all("div", {"class": re.compile(r"stock|card", re.I)})

        for item in stock_items:
            try:
                symbol_elem = item.find(["span", "a", "div"], {"class": re.compile(r"symbol|ticker", re.I)})
                price_elem = item.find(["span", "div"], {"class": re.compile(r"price|value", re.I)})

                if symbol_elem and price_elem:
                    stocks.append({
                        "symbol": self._clean_text(symbol_elem.text),
                        "close": self._parse_number(price_elem.text),
                        "date": date.today().isoformat()
                    })
            except Exception:
                continue

        return stocks

    async def get_market_summary(self) -> Dict:
        """Get NGX All Share Index and market summary.
        Tries AFX first (primary), then ngxgroup.com, then defaults to zeros.
        """
        # Try AFX first (most reliable)
        summary = await self._fetch_summary_from_afx()
        if summary and summary.get("asi", 0) > 0:
            return summary

        # Fallback to NGX official
        url = f"{self.base_url}/exchange/data/market-statistics/"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self.headers,
                    timeout=self.timeout,
                    follow_redirects=True
                )

                if response.status_code == 200:
                    parsed = self._parse_market_summary(response.text)
                    if parsed.get("asi", 0) > 0:
                        return parsed
        except Exception as e:
            logger.error("NGX market summary error: %s", e)

        return self._default_market_summary()

    def _parse_market_summary(self, html: str) -> Dict:
        """Parse market summary page."""
        soup = BeautifulSoup(html, "html.parser")

        summary = self._default_market_summary()

        # Look for ASI value
        asi_elem = soup.find(text=re.compile(r"All.?Share", re.I))
        if asi_elem:
            parent = asi_elem.find_parent()
            if parent:
                value_elem = parent.find_next(["span", "div", "td"])
                if value_elem:
                    summary["asi"] = self._parse_number(value_elem.text)

        return summary

    def _default_market_summary(self) -> Dict:
        """Return default market summary structure."""
        return {
            "asi": 0,
            "asi_change": 0,
            "asi_change_percent": 0,
            "market_cap": 0,
            "volume": 0,
            "value": 0,
            "deals": 0,
            "date": date.today().isoformat()
        }

    async def get_stock_detail(self, symbol: str) -> Optional[Dict]:
        """Get detailed information for a specific stock."""
        stocks = await self.get_all_stocks()

        for stock in stocks:
            if stock.get("symbol", "").upper() == symbol.upper():
                return stock

        return None

    async def get_top_gainers(self, limit: int = 10) -> List[Dict]:
        """Get top gaining stocks."""
        stocks = await self.get_all_stocks()

        # Filter stocks with positive change
        gainers = [s for s in stocks if s.get("change", 0) > 0]

        # Sort by change percentage (descending)
        gainers.sort(key=lambda x: x.get("change", 0), reverse=True)

        return gainers[:limit]

    async def get_top_losers(self, limit: int = 10) -> List[Dict]:
        """Get top losing stocks."""
        stocks = await self.get_all_stocks()

        # Filter stocks with negative change
        losers = [s for s in stocks if s.get("change", 0) < 0]

        # Sort by change (ascending - most negative first)
        losers.sort(key=lambda x: x.get("change", 0))

        return losers[:limit]

    async def get_most_active(self, limit: int = 10) -> List[Dict]:
        """Get most actively traded stocks by volume."""
        stocks = await self.get_all_stocks()

        # Sort by volume (descending)
        stocks.sort(key=lambda x: x.get("volume", 0), reverse=True)

        return stocks[:limit]

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        if not text:
            return ""
        return " ".join(text.strip().split())

    def _parse_number(self, text: str) -> float:
        """Parse number from text, handling commas and parentheses."""
        if not text:
            return 0.0

        cleaned = text.strip().replace(",", "").replace(" ", "")

        # Handle negative (parentheses)
        if cleaned.startswith("(") and cleaned.endswith(")"):
            cleaned = "-" + cleaned[1:-1]

        # Remove percentage signs
        cleaned = cleaned.replace("%", "")

        # Remove currency symbols
        cleaned = re.sub(r"[₦$€£]", "", cleaned)

        try:
            return float(cleaned)
        except ValueError:
            return 0.0


# Sample stock data for development/testing (Updated Jan 2026)
SAMPLE_NGX_STOCKS = [
    {"symbol": "GTCO", "name": "Guaranty Trust Holding Company", "sector": "Banking", "close": 99.00, "change": 0.15, "change_percent": 0.15, "volume": 6360000, "market_cap": 3610000000000},
    {"symbol": "ZENITHBANK", "name": "Zenith Bank Plc", "sector": "Banking", "close": 71.45, "change": 1.05, "change_percent": 1.49, "volume": 12000000, "market_cap": 2930000000000},
    {"symbol": "ACCESSCORP", "name": "Access Holdings Plc", "sector": "Banking", "close": 22.60, "change": 0.40, "change_percent": 1.80, "volume": 18000000, "market_cap": 1200000000000},
    {"symbol": "MTNN", "name": "MTN Nigeria Communications", "sector": "Telecom", "close": 210.00, "change": 2.50, "change_percent": 1.20, "volume": 5000000, "market_cap": 4270000000000},
    {"symbol": "DANGCEM", "name": "Dangote Cement Plc", "sector": "Industrial", "close": 485.00, "change": 5.00, "change_percent": 1.04, "volume": 800000, "market_cap": 8260000000000},
    {"symbol": "BUACEMENT", "name": "BUA Cement Plc", "sector": "Industrial", "close": 105.00, "change": -0.50, "change_percent": -0.47, "volume": 1200000, "market_cap": 3560000000000},
    {"symbol": "AIRTELAFRI", "name": "Airtel Africa Plc", "sector": "Telecom", "close": 2350.00, "change": 25.00, "change_percent": 1.07, "volume": 150000, "market_cap": 8850000000000},
    {"symbol": "SEPLAT", "name": "Seplat Energy Plc", "sector": "Oil & Gas", "close": 4800.00, "change": -50.00, "change_percent": -1.03, "volume": 80000, "market_cap": 2830000000000},
    {"symbol": "NESTLE", "name": "Nestle Nigeria Plc", "sector": "Consumer Goods", "close": 1500.00, "change": 20.00, "change_percent": 1.35, "volume": 25000, "market_cap": 1190000000000},
    {"symbol": "DANGSUGAR", "name": "Dangote Sugar Refinery", "sector": "Consumer Goods", "close": 45.00, "change": 0.50, "change_percent": 1.12, "volume": 5000000, "market_cap": 546000000000},
    {"symbol": "UBA", "name": "United Bank for Africa", "sector": "Banking", "close": 44.30, "change": 0.80, "change_percent": 1.84, "volume": 15000000, "market_cap": 1960000000000},
    {"symbol": "FIRSTHOLDCO", "name": "First HoldCo Plc", "sector": "Banking", "close": 45.00, "change": -0.50, "change_percent": -1.10, "volume": 10000000, "market_cap": 2000000000000},
    {"symbol": "STANBIC", "name": "Stanbic IBTC Holdings", "sector": "Banking", "close": 75.00, "change": 1.50, "change_percent": 2.04, "volume": 2000000, "market_cap": 780000000000},
    {"symbol": "FLOURMILL", "name": "Flour Mills of Nigeria", "sector": "Consumer Goods", "close": 55.00, "change": -0.80, "change_percent": -1.43, "volume": 1500000, "market_cap": 226000000000},
    {"symbol": "PRESCO", "name": "Presco Plc", "sector": "Agriculture", "close": 350.00, "change": 5.00, "change_percent": 1.45, "volume": 200000, "market_cap": 350000000000},
]


class NGXDataProvider:
    """
    Provides NGX stock data with Redis caching and fallback to sample data.
    """

    CACHE_TTL = 300  # 5 minutes

    def __init__(self, use_sample: bool = False):
        self.scraper = NGXScraper()
        self.use_sample = use_sample

    async def get_all_stocks(self) -> List[Dict]:
        """Get all stocks, checking Redis cache first, with sample data fallback."""
        if self.use_sample:
            return self._get_sample_stocks()

        # Check Redis cache
        cached = redis_client.get_json("ngx:stocks")
        if cached:
            return cached

        stocks = await self.scraper.get_all_stocks()

        if not stocks:
            logger.warning("Using sample NGX data (live data unavailable)")
            return self._get_sample_stocks()

        # Cache in Redis
        redis_client.set_json("ngx:stocks", stocks, expire_seconds=self.CACHE_TTL)
        return stocks

    async def get_market_summary(self) -> Dict:
        """Get market summary, checking Redis cache first, with sample data fallback."""
        if self.use_sample:
            return self._get_sample_summary()

        # Check Redis cache
        cached = redis_client.get_json("ngx:market_summary")
        if cached:
            return cached

        summary = await self.scraper.get_market_summary()

        if summary.get("asi", 0) == 0:
            return self._get_sample_summary()

        # Cache in Redis
        redis_client.set_json("ngx:market_summary", summary, expire_seconds=self.CACHE_TTL)
        return summary

    async def get_top_gainers(self, limit: int = 10) -> List[Dict]:
        """Get top gainers."""
        stocks = await self.get_all_stocks()
        gainers = [s for s in stocks if s.get("change", 0) > 0 or s.get("change_percent", 0) > 0]
        gainers.sort(key=lambda x: x.get("change_percent", x.get("change", 0)), reverse=True)
        return gainers[:limit]

    async def get_top_losers(self, limit: int = 10) -> List[Dict]:
        """Get top losers."""
        stocks = await self.get_all_stocks()
        losers = [s for s in stocks if s.get("change", 0) < 0 or s.get("change_percent", 0) < 0]
        losers.sort(key=lambda x: x.get("change_percent", x.get("change", 0)))
        return losers[:limit]

    async def get_most_active(self, limit: int = 10) -> List[Dict]:
        """Get most active by volume."""
        stocks = await self.get_all_stocks()
        stocks.sort(key=lambda x: x.get("volume", 0), reverse=True)
        return stocks[:limit]

    def _get_sample_stocks(self) -> List[Dict]:
        """Return sample stock data."""
        from datetime import date
        stocks = []
        for s in SAMPLE_NGX_STOCKS:
            stock = s.copy()
            stock["date"] = date.today().isoformat()
            stocks.append(stock)
        return stocks

    def _get_sample_summary(self) -> Dict:
        """Return sample market summary (Updated 10 Feb 2026)."""
        from datetime import date
        return {
            "asi": 176809.43,
            "asi_change": 2877.36,
            "asi_change_percent": 1.65,
            "market_cap": 108500000000000,  # 108.5 trillion
            "volume": 285000000,
            "value": 7200000000,  # 7.2 billion
            "deals": 8456,
            "date": date.today().isoformat()
        }
