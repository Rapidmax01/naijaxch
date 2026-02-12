import logging
import httpx
from typing import List, Dict, Optional
from datetime import datetime

from app.core.redis import redis_client

logger = logging.getLogger(__name__)

DEFI_YIELDS_CACHE_KEY = "defi:yields:stablecoins"
DEFI_CACHE_TTL = 1800  # 30 minutes


class DeFiLlamaScraper:
    POOLS_URL = "https://yields.llama.fi/pools"
    STABLECOINS = {"USDT", "USDC", "DAI", "BUSD", "TUSD"}
    MIN_TVL = 100_000  # $100k minimum TVL

    async def fetch_stablecoin_yields(self) -> List[Dict]:
        cached = redis_client.get_json(DEFI_YIELDS_CACHE_KEY)
        if cached:
            return cached

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(self.POOLS_URL)
                resp.raise_for_status()
                data = resp.json()

            pools = data.get("data", [])
            filtered = []

            for pool in pools:
                symbol = pool.get("symbol", "")
                tvl = pool.get("tvlUsd", 0) or 0
                apy = pool.get("apy", 0) or 0

                # Check if it's a stablecoin pool with sufficient TVL
                symbols_upper = symbol.upper().split("-")
                if not any(s in self.STABLECOINS for s in symbols_upper):
                    continue
                if tvl < self.MIN_TVL:
                    continue
                if apy <= 0:
                    continue

                filtered.append({
                    "pool": pool.get("pool", ""),
                    "chain": pool.get("chain", ""),
                    "project": pool.get("project", ""),
                    "symbol": symbol,
                    "tvl_usd": tvl,
                    "apy": round(apy, 2),
                    "apy_base": round(pool.get("apyBase", 0) or 0, 2),
                    "apy_reward": round(pool.get("apyReward", 0) or 0, 2),
                    "il_risk": pool.get("ilRisk", "no"),
                    "pool_url": pool.get("url"),
                })

            # Sort by APY descending
            filtered.sort(key=lambda x: x["apy"], reverse=True)

            # Cache results
            redis_client.set_json(DEFI_YIELDS_CACHE_KEY, filtered, DEFI_CACHE_TTL)

            logger.info(f"Fetched {len(filtered)} stablecoin yield pools from DeFiLlama")
            return filtered

        except Exception as e:
            logger.error(f"Error fetching DeFiLlama yields: {e}")
            return cached or []

    def get_chains(self, pools: List[Dict]) -> List[str]:
        chains = sorted(set(p["chain"] for p in pools))
        return chains
