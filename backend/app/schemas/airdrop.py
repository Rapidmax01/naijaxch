from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class AirdropCreate(BaseModel):
    name: str
    project: str
    description: Optional[str] = None
    category: str = "defi"
    reward_estimate: Optional[str] = None
    reward_token: Optional[str] = None
    requirements: Optional[str] = None
    steps: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None
    status: str = "active"
    difficulty: str = "medium"
    deadline: Optional[date] = None
    start_date: Optional[date] = None
    is_verified: bool = False
    is_featured: bool = False


class AirdropUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    reward_estimate: Optional[str] = None
    requirements: Optional[str] = None
    steps: Optional[str] = None
    url: Optional[str] = None
    status: Optional[str] = None
    difficulty: Optional[str] = None
    deadline: Optional[date] = None
    is_verified: Optional[bool] = None
    is_featured: Optional[bool] = None


class AirdropResponse(BaseModel):
    id: str
    name: str
    project: str
    description: Optional[str] = None
    category: str
    reward_estimate: Optional[str] = None
    reward_token: Optional[str] = None
    requirements: Optional[str] = None
    steps: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None
    status: str
    difficulty: str
    deadline: Optional[date] = None
    start_date: Optional[date] = None
    is_verified: bool
    is_featured: bool
    is_auto_curated: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class AirdropListResponse(BaseModel):
    airdrops: List[AirdropResponse]
    total: int
