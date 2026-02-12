import logging
import httpx
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional
from datetime import datetime
from email.utils import parsedate_to_datetime

logger = logging.getLogger(__name__)

RSS_FEEDS = [
    {
        "url": "https://cointelegraph.com/rss",
        "source": "CoinTelegraph",
        "category": "crypto",
    },
    {
        "url": "https://www.coindesk.com/arc/outboundfeeds/rss/",
        "source": "CoinDesk",
        "category": "crypto",
    },
    {
        "url": "https://businessday.ng/feed/",
        "source": "BusinessDay Nigeria",
        "category": "nigeria",
    },
]


class RSSNewsScraper:
    async def fetch_all_feeds(self) -> List[Dict]:
        all_items = []
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            for feed_config in RSS_FEEDS:
                try:
                    items = await self._fetch_feed(client, feed_config)
                    all_items.extend(items)
                except Exception as e:
                    logger.error(f"Error fetching RSS from {feed_config['source']}: {e}")

        # Sort by published date, newest first
        all_items.sort(key=lambda x: x.get("published_at") or "", reverse=True)
        return all_items

    async def _fetch_feed(self, client: httpx.AsyncClient, feed_config: dict) -> List[Dict]:
        resp = await client.get(feed_config["url"], headers={"User-Agent": "NaijaXch/1.0"})
        resp.raise_for_status()

        root = ET.fromstring(resp.text)
        items = []

        # Handle both RSS 2.0 and Atom feeds
        for item in root.iter("item"):
            title = self._get_text(item, "title")
            link = self._get_text(item, "link")
            description = self._get_text(item, "description")
            pub_date = self._get_text(item, "pubDate")

            if not title or not link:
                continue

            # Parse image from media:content or enclosure
            image_url = None
            enclosure = item.find("enclosure")
            if enclosure is not None and "image" in (enclosure.get("type") or ""):
                image_url = enclosure.get("url")

            # Try media:content
            for ns in ["media", "{http://search.yahoo.com/mrss/}"]:
                media = item.find(f"{ns}:content") if ":" in ns else item.find(f"{{{ns}}}content")
                if media is not None:
                    image_url = media.get("url")
                    break

            published_at = None
            if pub_date:
                try:
                    published_at = parsedate_to_datetime(pub_date).isoformat()
                except Exception:
                    pass

            # Clean summary
            summary = description
            if summary and len(summary) > 300:
                summary = summary[:297] + "..."

            items.append({
                "title": title,
                "source": feed_config["source"],
                "url": link,
                "summary": summary,
                "image_url": image_url,
                "category": feed_config["category"],
                "published_at": published_at,
            })

        return items[:20]  # Limit per feed

    @staticmethod
    def _get_text(element: ET.Element, tag: str) -> Optional[str]:
        el = element.find(tag)
        return el.text.strip() if el is not None and el.text else None
