import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Boolean, Text, Date

from app.core.database import Base


class Airdrop(Base):
    __tablename__ = "airdrops"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    project = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, default="defi")  # defi, nft, gaming, layer2, other
    reward_estimate = Column(String(100), nullable=True)
    reward_token = Column(String(20), nullable=True)
    requirements = Column(Text, nullable=True)
    steps = Column(Text, nullable=True)
    url = Column(String(1000), nullable=True)
    image_url = Column(String(1000), nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active, upcoming, ended
    difficulty = Column(String(20), nullable=False, default="medium")  # easy, medium, hard
    deadline = Column(Date, nullable=True)
    start_date = Column(Date, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    is_auto_curated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Airdrop {self.name}>"
