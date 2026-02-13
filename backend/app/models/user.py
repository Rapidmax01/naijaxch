import uuid
import secrets
import string
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, BigInteger, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.core.database import Base


def generate_referral_code() -> str:
    """Generate a unique 8-character referral code."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(8))


class User(Base):
    """User model for authentication and profile."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    telegram_chat_id = Column(BigInteger, nullable=True)

    auth_provider = Column(String(20), default="email", nullable=False)
    google_id = Column(String(255), nullable=True, unique=True)

    # Referral system
    referral_code = Column(String(10), unique=True, nullable=True, index=True, default=generate_referral_code)
    referred_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    referral_count = Column(Integer, default=0)

    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="user")

    @property
    def full_name(self) -> str:
        """Get user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or ""

    def __repr__(self):
        return f"<User {self.email}>"
