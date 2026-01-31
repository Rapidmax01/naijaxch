from celery import Celery
from app.config import settings

celery_app = Celery(
    "naijatrade",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.crypto_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Lagos",
    enable_utc=True,
    beat_schedule={
        "fetch-prices-every-minute": {
            "task": "app.tasks.crypto_tasks.fetch_all_prices",
            "schedule": 60.0,  # Every 60 seconds
        },
        "check-opportunities-every-minute": {
            "task": "app.tasks.crypto_tasks.check_arbitrage_opportunities",
            "schedule": 60.0,
        },
    },
)
