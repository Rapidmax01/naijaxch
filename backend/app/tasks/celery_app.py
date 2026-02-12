from celery import Celery
from app.config import settings

celery_app = Celery(
    "naijatrade",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.crypto_tasks", "app.tasks.stock_tasks", "app.tasks.defi_tasks", "app.tasks.news_tasks"]
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
        "refresh-ngx-every-5-min": {
            "task": "app.tasks.stock_tasks.refresh_ngx_data",
            "schedule": 300.0,  # Every 5 minutes
        },
        "check-stock-alerts-every-minute": {
            "task": "app.tasks.stock_tasks.check_stock_alerts",
            "schedule": 60.0,
        },
        "fetch-defi-yields-every-30min": {
            "task": "app.tasks.defi_tasks.fetch_defi_yields",
            "schedule": 1800.0,
        },
        "fetch-news-every-15min": {
            "task": "app.tasks.news_tasks.fetch_news_feeds",
            "schedule": 900.0,
        },
    },
)
