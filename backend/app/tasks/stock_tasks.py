import asyncio
import logging
from celery import shared_task
from app.scrapers.stocks.ngx import NGXDataProvider
from app.core.redis import redis_client
from app.core.database import SessionLocal
from app.models.user import User
from app.services.ngxradar.alert_service import AlertService
from app.services.telegram.bot_service import telegram_bot
from app.services.email.email_service import EmailService

logger = logging.getLogger(__name__)


@shared_task
def refresh_ngx_data():
    """
    Fetch NGX market summary and stock list, cache in Redis.
    Runs every 5 minutes via Celery Beat.
    """

    async def _refresh():
        provider = NGXDataProvider(use_sample=False)

        # Fetch market summary (bypasses cache to get fresh data)
        summary = await provider.scraper.get_market_summary()
        if summary.get("asi", 0) > 0:
            redis_client.set_json(
                "ngx:market_summary", summary, expire_seconds=300
            )
            logger.info("NGX market summary cached: ASI=%.2f", summary["asi"])

        # Fetch stock list
        stocks = await provider.scraper.get_all_stocks()
        if stocks:
            redis_client.set_json(
                "ngx:stocks", stocks, expire_seconds=300
            )
            logger.info("NGX stocks cached: %d stocks", len(stocks))

        return {
            "summary_asi": summary.get("asi", 0),
            "stocks_count": len(stocks),
        }

    return asyncio.run(_refresh())


@shared_task
def check_stock_alerts():
    """
    Check all active stock alerts against current prices and send notifications.
    Runs every 60 seconds via Celery Beat.
    """
    db = SessionLocal()
    try:
        alert_service = AlertService(db)
        triggered_alerts = alert_service.check_alerts()

        if not triggered_alerts:
            return {"triggered": 0}

        sent_count = 0

        for alert in triggered_alerts:
            user = db.query(User).filter(User.id == alert.user_id).first()
            if not user:
                continue

            # Get stock info
            from app.models.ngxradar.stock import Stock
            stock = db.query(Stock).filter(Stock.id == alert.stock_id).first()
            if not stock:
                continue

            current_price = float(stock.current_price) if stock.current_price else 0
            target_value = float(alert.target_value)

            # Send Telegram notification
            if alert.notify_telegram and user.telegram_chat_id:
                send_stock_telegram_alert.delay(
                    chat_id=user.telegram_chat_id,
                    symbol=stock.symbol,
                    stock_name=stock.name,
                    alert_type=alert.alert_type,
                    target_value=target_value,
                    current_price=current_price,
                )
                sent_count += 1

            # Send email notification
            if alert.notify_email and user.email:
                send_stock_email_alert.delay(
                    email=user.email,
                    symbol=stock.symbol,
                    stock_name=stock.name,
                    alert_type=alert.alert_type,
                    target_value=target_value,
                    current_price=current_price,
                )
                sent_count += 1

        return {"triggered": len(triggered_alerts), "notifications_sent": sent_count}

    except Exception as e:
        logger.error(f"Error checking stock alerts: {e}")
        return {"error": str(e)}
    finally:
        db.close()


@shared_task
def send_stock_telegram_alert(
    chat_id: int,
    symbol: str,
    stock_name: str,
    alert_type: str,
    target_value: float,
    current_price: float,
):
    """Send a stock price alert via Telegram."""

    async def _send():
        return await telegram_bot.send_stock_alert(
            chat_id=chat_id,
            symbol=symbol,
            stock_name=stock_name,
            alert_type=alert_type,
            target_value=target_value,
            current_price=current_price,
        )

    try:
        result = asyncio.run(_send())
        logger.info(f"Stock Telegram alert sent to {chat_id}: {result.get('status')}")
        return result
    except Exception as e:
        logger.error(f"Failed to send stock Telegram alert to {chat_id}: {e}")
        return {"status": "error", "error": str(e)}


@shared_task
def send_stock_email_alert(
    email: str,
    symbol: str,
    stock_name: str,
    alert_type: str,
    target_value: float,
    current_price: float,
):
    """Send a stock price alert via email."""

    async def _send():
        svc = EmailService()
        return await svc.send_stock_alert(
            to=email,
            symbol=symbol,
            stock_name=stock_name,
            alert_type=alert_type,
            target_value=target_value,
            current_price=current_price,
        )

    try:
        result = asyncio.run(_send())
        logger.info(f"Stock email alert sent to {email}: {result.get('status')}")
        return result
    except Exception as e:
        logger.error(f"Failed to send stock email alert to {email}: {e}")
        return {"status": "error", "error": str(e)}
