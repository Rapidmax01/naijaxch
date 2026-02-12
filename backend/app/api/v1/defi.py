from fastapi import APIRouter, Query
from typing import Optional

from app.scrapers.defi.defillama import DeFiLlamaScraper

router = APIRouter()
scraper = DeFiLlamaScraper()


@router.get("/yields")
async def get_defi_yields(
    chain: Optional[str] = Query(default=None),
    symbol: Optional[str] = Query(default=None),
    min_tvl: Optional[float] = Query(default=None),
    min_apy: Optional[float] = Query(default=None),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
):
    """Get DeFi stablecoin yields, with optional filters."""
    pools = await scraper.fetch_stablecoin_yields()

    # Apply filters
    if chain:
        pools = [p for p in pools if p["chain"].lower() == chain.lower()]
    if symbol:
        pools = [p for p in pools if symbol.upper() in p["symbol"].upper()]
    if min_tvl:
        pools = [p for p in pools if p["tvl_usd"] >= min_tvl]
    if min_apy:
        pools = [p for p in pools if p["apy"] >= min_apy]

    total = len(pools)
    pools = pools[offset:offset + limit]

    return {
        "pools": pools,
        "total": total,
        "chains": scraper.get_chains(await scraper.fetch_stablecoin_yields()),
    }


@router.get("/chains")
async def get_defi_chains():
    """Get list of available chains."""
    pools = await scraper.fetch_stablecoin_yields()
    return {"chains": scraper.get_chains(pools)}
