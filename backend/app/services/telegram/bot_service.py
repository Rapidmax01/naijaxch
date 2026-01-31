"""Telegram bot service for sending alerts."""
import logging
from typing import Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class TelegramBotService:
    """Service for sending Telegram notifications."""

    BASE_URL = "https://api.telegram.org/bot"

    def __init__(self):
        self.token = settings.TELEGRAM_BOT_TOKEN
        self.enabled = bool(self.token)

    @property
    def api_url(self) -> str:
        return f"{self.BASE_URL}{self.token}"

    async def send_message(
        self,
        chat_id: int,
        text: str,
        parse_mode: str = "HTML",
        disable_notification: bool = False,
    ) -> dict:
        """
        Send a message to a Telegram chat.

        Args:
            chat_id: Telegram chat ID
            text: Message text (supports HTML formatting)
            parse_mode: "HTML" or "Markdown"
            disable_notification: Send silently
        """
        if not self.enabled:
            logger.warning("Telegram bot not configured, skipping message")
            return {"status": "skipped", "message": "Bot token not configured"}

        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
            "disable_notification": disable_notification,
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/sendMessage",
                    json=payload,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    return {"status": "sent", "data": response.json()}
                else:
                    logger.error(f"Telegram send failed: {response.text}")
                    return {"status": "failed", "error": response.text}

        except Exception as e:
            logger.error(f"Telegram send error: {e}")
            return {"status": "error", "error": str(e)}

    async def send_arbitrage_alert(
        self,
        chat_id: int,
        crypto: str,
        buy_exchange: str,
        sell_exchange: str,
        buy_price: float,
        sell_price: float,
        spread_percent: float,
    ) -> dict:
        """Send an arbitrage opportunity alert."""
        profit_per_1m = (sell_price - buy_price) * (1000000 / buy_price)

        text = f"""
🚨 <b>Arbitrage Alert!</b>

<b>{crypto}</b> - {spread_percent:.2f}% Spread

📉 <b>Buy on {buy_exchange}</b>
   ₦{buy_price:,.2f}

📈 <b>Sell on {sell_exchange}</b>
   ₦{sell_price:,.2f}

💰 <b>Potential Profit:</b> ₦{profit_per_1m:,.2f} per ₦1M

⚠️ <i>Prices change rapidly. Verify before trading.</i>
        """.strip()

        return await self.send_message(chat_id, text)

    async def send_stock_alert(
        self,
        chat_id: int,
        symbol: str,
        stock_name: str,
        alert_type: str,
        target_value: float,
        current_price: float,
    ) -> dict:
        """Send a stock price alert."""
        direction = "above" if alert_type == "price_above" else "below"
        emoji = "📈" if alert_type == "price_above" else "📉"

        text = f"""
{emoji} <b>Stock Alert!</b>

<b>{symbol}</b> - {stock_name}

Price is now {direction} your target!

🎯 Target: ₦{target_value:,.2f}
💵 Current: ₦{current_price:,.2f}

<a href="{settings.FRONTEND_URL}/ngx/stocks/{symbol}">View Stock →</a>
        """.strip()

        return await self.send_message(chat_id, text)

    async def send_welcome_message(self, chat_id: int, user_email: str) -> dict:
        """Send welcome message when user links their Telegram."""
        text = f"""
🎉 <b>Welcome to NaijaXch Bot!</b>

Your Telegram is now linked to <b>{user_email}</b>

You'll receive alerts here for:
• 💱 Crypto arbitrage opportunities
• 📊 Stock price alerts
• 📰 Important updates

<b>Commands:</b>
/start - Get started
/help - Show help
/status - Check connection status

<a href="{settings.FRONTEND_URL}">Open NaijaXch →</a>
        """.strip()

        return await self.send_message(chat_id, text)

    async def send_payment_confirmation(
        self,
        chat_id: int,
        amount: float,
        product: str,
        plan: str,
    ) -> dict:
        """Send payment confirmation message."""
        text = f"""
✅ <b>Payment Successful!</b>

Amount: ₦{amount:,.2f}
Product: {product.upper()}
Plan: {plan.capitalize()}

Your subscription is now active!

<a href="{settings.FRONTEND_URL}/account">View Account →</a>
        """.strip()

        return await self.send_message(chat_id, text)


# Global bot service instance
telegram_bot = TelegramBotService()
