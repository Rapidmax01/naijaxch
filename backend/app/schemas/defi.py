from pydantic import BaseModel
from typing import Optional, List


class DefiPoolResponse(BaseModel):
    pool: str
    chain: str
    project: str
    symbol: str
    tvl_usd: float
    apy: float
    apy_base: Optional[float] = None
    apy_reward: Optional[float] = None
    il_risk: Optional[str] = None
    pool_url: Optional[str] = None


class DefiYieldsResponse(BaseModel):
    pools: List[DefiPoolResponse]
    total: int
    chains: List[str] = []
    updated_at: Optional[str] = None
