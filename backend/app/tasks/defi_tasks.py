import asyncio
import logging
from celery import shared_task

from app.scrapers.defi.defillama import DeFiLlamaScraper

logger = logging.getLogger(__name__)


@shared_task
def fetch_defi_yields():
    """Fetch DeFi stablecoin yields from DeFiLlama. Runs every 30 minutes."""

    async def _fetch():
        scraper = DeFiLlamaScraper()
        pools = await scraper.fetch_stablecoin_yields()
        return {"pools_count": len(pools)}

    try:
        result = asyncio.run(_fetch())
        logger.info(f"DeFi yields fetched: {result['pools_count']} pools")
        return result
    except Exception as e:
        logger.error(f"Error fetching DeFi yields: {e}")
        return {"error": str(e)}
