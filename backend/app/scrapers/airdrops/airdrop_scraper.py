import json
import logging
import re
from typing import Dict, List

import httpx

logger = logging.getLogger(__name__)

ALPHADROPS_URL = "https://alphadrops.net/airdrops"


class AirdropScraper:
    """Scrapes airdrop listings from AlphaDrops."""

    async def fetch_airdrops(self) -> List[Dict]:
        """Fetch airdrops from AlphaDrops and return normalized dicts."""
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                resp = await client.get(
                    ALPHADROPS_URL,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Accept": "text/html,application/xhtml+xml",
                    },
                )
                resp.raise_for_status()

            raw_airdrops = self._parse_airdrops(resp.text)
            return [self._normalize(a) for a in raw_airdrops]
        except Exception as e:
            logger.error(f"AirdropScraper error: {e}")
            return []

    def _parse_airdrops(self, html: str) -> List[Dict]:
        """Extract airdrop JSON from Next.js RSC payload or script tags."""
        # Try Next.js __NEXT_DATA__ script tag
        match = re.search(
            r'<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL
        )
        if match:
            try:
                data = json.loads(match.group(1))
                props = data.get("props", {}).get("pageProps", {})
                airdrops = props.get("initialAirdrops") or props.get("airdrops", [])
                if airdrops:
                    return airdrops
            except (json.JSONDecodeError, KeyError):
                pass

        # Try RSC payload lines (Next.js app router)
        for line in html.split("\n"):
            line = line.strip()
            if not line:
                continue
            # RSC format: number:payload
            colon_idx = line.find(":")
            if colon_idx > 0 and line[:colon_idx].strip().isdigit():
                payload = line[colon_idx + 1:]
            else:
                payload = line

            try:
                parsed = json.loads(payload)
                airdrops = self._find_airdrops_in_data(parsed)
                if airdrops:
                    return airdrops
            except (json.JSONDecodeError, TypeError):
                continue

        # Try any JSON array embedded in script tags
        for match in re.finditer(r"<script[^>]*>(.*?)</script>", html, re.DOTALL):
            script = match.group(1)
            for json_match in re.finditer(r"\[{.*?}\]", script, re.DOTALL):
                try:
                    items = json.loads(json_match.group(0))
                    if isinstance(items, list) and len(items) > 0 and "name" in items[0]:
                        return items
                except (json.JSONDecodeError, TypeError, KeyError):
                    continue

        logger.warning("Could not parse airdrops from AlphaDrops HTML")
        return []

    def _find_airdrops_in_data(self, data, depth: int = 0) -> List[Dict]:
        """Recursively search for an airdrops array in nested data."""
        if depth > 5:
            return []

        if isinstance(data, list) and len(data) > 0:
            if isinstance(data[0], dict) and ("name" in data[0] or "slug" in data[0]):
                return data

        if isinstance(data, dict):
            for key in ("initialAirdrops", "airdrops", "data", "results", "items"):
                if key in data:
                    val = data[key]
                    if isinstance(val, list) and len(val) > 0:
                        return val

            for val in data.values():
                result = self._find_airdrops_in_data(val, depth + 1)
                if result:
                    return result

        if isinstance(data, list):
            for item in data:
                result = self._find_airdrops_in_data(item, depth + 1)
                if result:
                    return result

        return []

    def _normalize(self, raw: Dict) -> Dict:
        """Map raw AlphaDrops fields to our Airdrop model shape."""
        categories = raw.get("categories") or []
        category = categories[0] if categories else raw.get("category", "defi")
        if isinstance(category, dict):
            category = category.get("name", "defi")
        category = str(category).lower()

        status_raw = (raw.get("status") or "active").lower()
        status_map = {"live": "active", "confirmed": "active", "upcoming": "upcoming", "ended": "ended"}
        status = status_map.get(status_raw, "active")

        return {
            "name": raw.get("name") or raw.get("title", "Unknown"),
            "project": raw.get("slug") or raw.get("project") or raw.get("name", "Unknown"),
            "description": raw.get("shortDescription") or raw.get("description", ""),
            "category": category,
            "status": status,
            "reward_estimate": raw.get("fundingAmount") or raw.get("reward_estimate"),
            "reward_token": raw.get("token") or raw.get("reward_token"),
            "image_url": raw.get("logo") or raw.get("image_url"),
            "url": raw.get("website") or raw.get("url"),
            "difficulty": "medium",
            "is_auto_curated": True,
            "is_verified": False,
            "is_featured": False,
        }
