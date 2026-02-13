import asyncio
import logging
from celery import shared_task

from app.core.database import SessionLocal
from app.models.airdrop import Airdrop
from app.scrapers.airdrops.airdrop_scraper import AirdropScraper

logger = logging.getLogger(__name__)


@shared_task
def fetch_and_curate_airdrops():
    """Scrape airdrops from AlphaDrops and upsert into the database. Runs every 6 hours."""

    async def _fetch():
        scraper = AirdropScraper()
        return await scraper.fetch_airdrops()

    try:
        airdrops_data = asyncio.run(_fetch())
        if not airdrops_data:
            logger.info("No airdrops fetched from AlphaDrops")
            return {"created": 0, "updated": 0}

        db = SessionLocal()
        created = 0
        updated = 0

        try:
            for data in airdrops_data:
                name = data.get("name", "")
                project = data.get("project", "")
                if not name or not project:
                    continue

                existing = (
                    db.query(Airdrop)
                    .filter(Airdrop.project == project, Airdrop.name == name)
                    .first()
                )

                if existing:
                    # Only update auto-curated entries (don't overwrite manual ones)
                    if existing.is_auto_curated:
                        for field in ("description", "category", "status", "reward_estimate",
                                      "reward_token", "image_url", "url"):
                            value = data.get(field)
                            if value is not None:
                                setattr(existing, field, value)
                        updated += 1
                else:
                    airdrop = Airdrop(**data)
                    db.add(airdrop)
                    created += 1

            db.commit()
        finally:
            db.close()

        logger.info(f"Airdrop curation: {created} created, {updated} updated")
        return {"created": created, "updated": updated}

    except Exception as e:
        logger.error(f"Error in fetch_and_curate_airdrops: {e}")
        return {"error": str(e)}
