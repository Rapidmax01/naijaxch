import asyncio
import logging
from celery import shared_task
from app.scrapers.stocks.ngx import NGXDataProvider
from app.core.redis import redis_client

logger = logging.getLogger(__name__)


@shared_task
def refresh_ngx_data():
    """
    Fetch NGX market summary and stock list, cache in Redis.
    Runs every 5 minutes via Celery Beat.
    """

    async def _refresh():
        provider = NGXDataProvider(use_sample=False)

        # Fetch market summary (bypasses cache to get fresh data)
        summary = await provider.scraper.get_market_summary()
        if summary.get("asi", 0) > 0:
            redis_client.set_json(
                "ngx:market_summary", summary, expire_seconds=300
            )
            logger.info("NGX market summary cached: ASI=%.2f", summary["asi"])

        # Fetch stock list
        stocks = await provider.scraper.get_all_stocks()
        if stocks:
            redis_client.set_json(
                "ngx:stocks", stocks, expire_seconds=300
            )
            logger.info("NGX stocks cached: %d stocks", len(stocks))

        return {
            "summary_asi": summary.get("asi", 0),
            "stocks_count": len(stocks),
        }

    return asyncio.run(_refresh())
