import asyncio
from celery import shared_task
from app.services.arbscanner import PriceAggregator, ArbitrageCalculator
from app.core.redis import redis_client


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

            all_opportunities.extend(opportunities)

        # Filter profitable only
        profitable = [o for o in all_opportunities if o.get("is_profitable")]

        # Cache opportunities
        redis_client.set_json(
            "opportunities:all",
            {"opportunities": profitable[:10]},
            expire_seconds=120
        )

        # TODO: Check user alerts and send notifications
        if profitable:
            trigger_alerts.delay(profitable)

        return {"found": len(profitable)}

    return asyncio.run(_check())


@shared_task
def trigger_alerts(opportunities: list):
    """
    Check user alerts and send notifications for matching opportunities.
    """
    # TODO: Implement alert checking and notification sending
    # 1. Get all active alerts from database
    # 2. Match opportunities against alert criteria
    # 3. Send Telegram/email notifications
    pass


@shared_task
def send_telegram_notification(chat_id: int, message: str):
    """
    Send a Telegram notification to a user.
    """
    # TODO: Implement using python-telegram-bot
    pass
