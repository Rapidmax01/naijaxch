from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class NewsItemResponse(BaseModel):
    id: str
    title: str
    source: str
    url: str
    summary: Optional[str] = None
    image_url: Optional[str] = None
    category: str
    published_at: Optional[datetime] = None
    fetched_at: datetime

    class Config:
        from_attributes = True


class NewsFeedResponse(BaseModel):
    items: List[NewsItemResponse]
    total: int
    sources: List[str] = []
