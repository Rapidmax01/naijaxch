from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.redis import redis_client
from app.models.news import NewsItem

router = APIRouter()


@router.get("/feed")
async def get_news_feed(
    category: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default=None),
    limit: int = Query(default=20, le=50),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Get news feed with optional category/source filters."""
    # Try cache first for unfiltered requests
    if not category and not source and offset == 0 and limit <= 50:
        cached = redis_client.get_json("news:latest")
        if cached:
            items = cached[:limit]
            return {"items": items, "total": len(cached), "sources": _unique_sources(cached)}

    # Fall back to DB query
    query = db.query(NewsItem)
    if category:
        query = query.filter(NewsItem.category == category)
    if source:
        query = query.filter(NewsItem.source == source)

    total = query.count()
    items = (
        query.order_by(NewsItem.published_at.desc().nullslast())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "items": [
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
            for n in items
        ],
        "total": total,
        "sources": _get_sources(db),
    }


@router.get("/sources")
async def get_news_sources(db: Session = Depends(get_db)):
    """Get available news sources."""
    return {"sources": _get_sources(db)}


def _get_sources(db: Session) -> list:
    rows = db.query(NewsItem.source).distinct().all()
    return sorted([r[0] for r in rows])


def _unique_sources(items: list) -> list:
    return sorted(set(i.get("source", "") for i in items if i.get("source")))
