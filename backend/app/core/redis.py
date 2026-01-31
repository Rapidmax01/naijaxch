import redis
from typing import Optional, Any, Dict
import json
import time

from app.config import settings


class InMemoryCache:
    """Simple in-memory cache fallback when Redis is not available."""

    def __init__(self):
        self._cache: Dict[str, tuple] = {}  # key -> (value, expiry_time)

    def get(self, key: str) -> Optional[str]:
        if key in self._cache:
            value, expiry = self._cache[key]
            if expiry is None or time.time() < expiry:
                return value
            del self._cache[key]
        return None

    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        expiry = time.time() + ex if ex else None
        self._cache[key] = (value, expiry)
        return True

    def delete(self, key: str) -> int:
        if key in self._cache:
            del self._cache[key]
            return 1
        return 0

    def exists(self, key: str) -> int:
        return 1 if key in self._cache else 0


class RedisClient:
    """Redis client wrapper for caching and pub/sub."""

    def __init__(self):
        self._client: Optional[Any] = None
        self._use_memory_cache = False

    @property
    def client(self) -> Any:
        """Get or create Redis client."""
        if self._client is None:
            try:
                self._client = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True
                )
                # Test connection
                self._client.ping()
            except (redis.ConnectionError, redis.exceptions.ConnectionError):
                print("Warning: Redis not available, using in-memory cache")
                self._client = InMemoryCache()
                self._use_memory_cache = True
        return self._client

    def get(self, key: str) -> Optional[str]:
        """Get a value from Redis."""
        try:
            return self.client.get(key)
        except Exception:
            return None

    def get_json(self, key: str) -> Optional[dict]:
        """Get a JSON value from Redis."""
        value = self.client.get(key)
        if value:
            return json.loads(value)
        return None

    def set(
        self,
        key: str,
        value: str,
        expire_seconds: Optional[int] = None
    ) -> bool:
        """Set a value in Redis."""
        return self.client.set(key, value, ex=expire_seconds)

    def set_json(
        self,
        key: str,
        value: dict,
        expire_seconds: Optional[int] = None
    ) -> bool:
        """Set a JSON value in Redis."""
        return self.client.set(
            key,
            json.dumps(value),
            ex=expire_seconds
        )

    def delete(self, key: str) -> int:
        """Delete a key from Redis."""
        return self.client.delete(key)

    def exists(self, key: str) -> bool:
        """Check if a key exists in Redis."""
        return self.client.exists(key) > 0

    def publish(self, channel: str, message: str) -> int:
        """Publish a message to a channel."""
        return self.client.publish(channel, message)

    def subscribe(self, channel: str):
        """Subscribe to a channel."""
        pubsub = self.client.pubsub()
        pubsub.subscribe(channel)
        return pubsub

    def hset(self, name: str, key: str, value: str) -> int:
        """Set a hash field."""
        return self.client.hset(name, key, value)

    def hget(self, name: str, key: str) -> Optional[str]:
        """Get a hash field."""
        return self.client.hget(name, key)

    def hgetall(self, name: str) -> dict:
        """Get all hash fields."""
        return self.client.hgetall(name)


# Global Redis client instance
redis_client = RedisClient()


def get_redis() -> RedisClient:
    """Dependency to get Redis client."""
    return redis_client
