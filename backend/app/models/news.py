import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text

from app.core.database import Base


class NewsItem(Base):
    __tablename__ = "news_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(500), nullable=False)
    source = Column(String(100), nullable=False)
    url = Column(String(1000), unique=True, nullable=False)
    summary = Column(Text, nullable=True)
    image_url = Column(String(1000), nullable=True)
    category = Column(String(50), nullable=False, default="crypto")
    published_at = Column(DateTime, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<NewsItem {self.title[:50]}>"
