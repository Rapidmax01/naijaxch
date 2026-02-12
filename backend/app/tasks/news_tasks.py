import asyncio
import logging
import json
from celery import shared_task

from app.scrapers.news.rss_scraper import RSSNewsScraper
from app.core.database import SessionLocal
from app.core.redis import redis_client
from app.models.news import NewsItem

logger = logging.getLogger(__name__)


@shared_task
def fetch_news_feeds():
    """Fetch news from RSS feeds, upsert into DB, cache latest 50. Runs every 15 minutes."""

    async def _fetch():
        scraper = RSSNewsScraper()
        return await scraper.fetch_all_feeds()

    try:
        items = asyncio.run(_fetch())
        if not items:
            return {"fetched": 0, "new": 0}

        db = SessionLocal()
        new_count = 0

        try:
            for item_data in items:
                existing = db.query(NewsItem).filter(NewsItem.url == item_data["url"]).first()
                if not existing:
                    news_item = NewsItem(
                        title=item_data["title"],
                        source=item_data["source"],
                        url=item_data["url"],
                        summary=item_data.get("summary"),
                        image_url=item_data.get("image_url"),
                        category=item_data.get("category", "crypto"),
                        published_at=item_data.get("published_at"),
                    )
                    db.add(news_item)
                    new_count += 1

            db.commit()

            # Cache latest 50 items
            latest = (
                db.query(NewsItem)
                .order_by(NewsItem.published_at.desc().nullslast())
                .limit(50)
                .all()
            )
            cached_items = [
                {
                    "id": n.id,
                    "title": n.title,
                    "source": n.source,
                    "url": n.url,
                    "summary": n.summary,
                    "image_url": n.image_url,
                    "category": n.category,
                    "published_at": n.published_at.isoformat() if n.published_at else None,
                    "fetched_at": n.fetched_at.isoformat() if n.fetched_at else None,
                }
                for n in latest
            ]
            redis_client.set_json("news:latest", cached_items, expire_seconds=900)

        finally:
            db.close()

        logger.info(f"News feeds fetched: {len(items)} items, {new_count} new")
        return {"fetched": len(items), "new": new_count}

    except Exception as e:
        logger.error(f"Error fetching news feeds: {e}")
        return {"error": str(e)}
