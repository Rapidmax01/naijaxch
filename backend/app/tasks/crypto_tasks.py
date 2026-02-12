import asyncio
import json
import logging
from celery import shared_task
from app.services.arbscanner import PriceAggregator, ArbitrageCalculator
from app.core.redis import redis_client
from app.core.database import SessionLocal
from app.models.arbscanner.alert import ArbAlert
from app.models.user import User
from app.services.telegram.bot_service import telegram_bot
from app.services.email.email_service import EmailService

logger = logging.getLogger(__name__)


@shared_task
def fetch_all_prices():
    """
    Fetch prices from all 7 exchanges via PriceAggregator.
    Runs every 60 seconds via Celery Beat.
    """

    async def _fetch():
        aggregator = PriceAggregator()
        cryptos = ["USDT", "BTC", "ETH"]
        all_prices = {}

        for crypto in cryptos:
            prices_data = await aggregator.get_all_prices(
                crypto=crypto, fiat="NGN", use_cache=False
            )
            all_prices[crypto] = prices_data

        return all_prices

    return asyncio.run(_fetch())


@shared_task
def check_arbitrage_opportunities():
    """
    Check for arbitrage opportunities and trigger alerts.
    Runs every 60 seconds via Celery Beat.
    """

    async def _check():
        aggregator = PriceAggregator()
        calculator = ArbitrageCalculator()

        cryptos = ["USDT", "BTC", "ETH"]
        all_opportunities = []

        for crypto in cryptos:
            prices_data = await aggregator.get_all_prices(crypto)

            # Convert to format expected by calculator
            prices = {}
            for ex in prices_data.get("exchanges", []):
                prices[ex["exchange"]] = {
                    "buy_price": ex.get("buy_price", 0),
                    "sell_price": ex.get("sell_price", 0)
                }

            # Find opportunities
            opportunities = calculator.find_opportunities(
                prices=prices,
                min_spread_percent=0.5,
                trade_amount_ngn=100000
            )

            # Tag each opportunity with crypto
            for opp in opportunities:
                opp.setdefault("crypto", crypto)

            all_opportunities.extend(opportunities)

        # Filter profitable only
        profitable = [o for o in all_opportunities if o.get("is_profitable")]

        # Cache opportunities
        redis_client.set_json(
            "opportunities:all",
            {"opportunities": profitable[:10]},
            expire_seconds=120
        )

        # Trigger user alerts
        if profitable:
            trigger_alerts.delay(profitable)

        return {"found": len(profitable)}

    return asyncio.run(_check())


@shared_task
def trigger_alerts(opportunities: list):
    """
    Check user alerts and send notifications for matching opportunities.
    """
    db = SessionLocal()
    try:
        # Get all active alerts
        active_alerts = db.query(ArbAlert).filter(
            ArbAlert.is_active == True
        ).all()

        if not active_alerts:
            return {"matched": 0}

        matched_count = 0

        for alert in active_alerts:
            user = db.query(User).filter(User.id == alert.user_id).first()
            if not user:
                continue

            # Parse exchange filters
            buy_exchanges = json.loads(alert.buy_exchanges) if alert.buy_exchanges else None
            sell_exchanges = json.loads(alert.sell_exchanges) if alert.sell_exchanges else None

            for opp in opportunities:
                # Check crypto filter
                if alert.crypto and opp.get("crypto", "").upper() != alert.crypto.upper():
                    continue

                # Check spread threshold
                spread = opp.get("gross_spread_percent", 0)
                if spread < float(alert.min_spread_percent or 0):
                    continue

                # Check exchange filters
                if buy_exchanges and opp.get("buy_exchange") not in buy_exchanges:
                    continue
                if sell_exchanges and opp.get("sell_exchange") not in sell_exchanges:
                    continue

                # Dedup: skip if we already notified this user for this pair recently
                dedup_key = f"alert_sent:{alert.user_id}:{opp.get('buy_exchange')}:{opp.get('sell_exchange')}:{opp.get('crypto')}"
                if redis_client.exists(dedup_key):
                    continue

                # Mark as sent (5-minute cooldown per pair per user)
                redis_client.set(dedup_key, "1", expire_seconds=300)

                # Send Telegram notification
                if alert.notify_telegram and user.telegram_chat_id:
                    send_telegram_alert.delay(
                        chat_id=user.telegram_chat_id,
                        crypto=opp.get("crypto", "USDT"),
                        buy_exchange=opp.get("buy_exchange", ""),
                        sell_exchange=opp.get("sell_exchange", ""),
                        buy_price=opp.get("buy_price", 0),
                        sell_price=opp.get("sell_price", 0),
                        spread_percent=spread,
                    )

                # Send email notification
                if alert.notify_email and user.email:
                    send_email_alert.delay(
                        email=user.email,
                        crypto=opp.get("crypto", "USDT"),
                        buy_exchange=opp.get("buy_exchange", ""),
                        sell_exchange=opp.get("sell_exchange", ""),
                        buy_price=opp.get("buy_price", 0),
                        sell_price=opp.get("sell_price", 0),
                        spread_percent=spread,
                    )

                matched_count += 1

        return {"matched": matched_count}

    except Exception as e:
        logger.error(f"Error triggering alerts: {e}")
        return {"error": str(e)}
    finally:
        db.close()


@shared_task
def send_telegram_alert(
    chat_id: int,
    crypto: str,
    buy_exchange: str,
    sell_exchange: str,
    buy_price: float,
    sell_price: float,
    spread_percent: float,
):
    """Send an arbitrage alert via Telegram."""

    async def _send():
        return await telegram_bot.send_arbitrage_alert(
            chat_id=chat_id,
            crypto=crypto,
            buy_exchange=buy_exchange,
            sell_exchange=sell_exchange,
            buy_price=buy_price,
            sell_price=sell_price,
            spread_percent=spread_percent,
        )

    try:
        result = asyncio.run(_send())
        logger.info(f"Telegram alert sent to {chat_id}: {result.get('status')}")
        return result
    except Exception as e:
        logger.error(f"Failed to send Telegram alert to {chat_id}: {e}")
        return {"status": "error", "error": str(e)}


@shared_task
def send_email_alert(
    email: str,
    crypto: str,
    buy_exchange: str,
    sell_exchange: str,
    buy_price: float,
    sell_price: float,
    spread_percent: float,
):
    """Send an arbitrage alert via email."""

    async def _send():
        svc = EmailService()
        return await svc.send_arbitrage_alert(
            to=email,
            crypto=crypto,
            buy_exchange=buy_exchange,
            sell_exchange=sell_exchange,
            buy_price=buy_price,
            sell_price=sell_price,
            spread_percent=spread_percent,
        )

    try:
        result = asyncio.run(_send())
        logger.info(f"Email alert sent to {email}: {result.get('status')}")
        return result
    except Exception as e:
        logger.error(f"Failed to send email alert to {email}: {e}")
        return {"status": "error", "error": str(e)}
