"""Telegram bot command handlers."""
import logging
from typing import Optional
import httpx

from app.config import settings
from app.core.redis import redis_client

logger = logging.getLogger(__name__)


async def handle_start(chat_id: int, text: str, from_user: dict) -> str:
    """
    Handle /start command.

    If a link token is provided, link the Telegram account.
    Otherwise, show welcome message.
    """
    # Check if there's a link token (e.g., /start abc123token)
    parts = text.split()
    if len(parts) > 1:
        token = parts[1]
        # Verify token and link account
        user_id = redis_client.get(f"telegram_link:{token}")

        if user_id:
            # Token is valid - return special response for linking
            return f"__LINK_TOKEN__:{token}"
        else:
            return (
                "❌ <b>Invalid or expired link token</b>\n\n"
                "Please generate a new link token from your NaijaXch account.\n\n"
                f"<a href=\"{settings.FRONTEND_URL}/account\">Open Account Settings →</a>"
            )

    # No token - show welcome
    return (
        "👋 <b>Welcome to NaijaXch Bot!</b>\n\n"
        "Get real-time alerts for:\n"
        "• 💱 Crypto arbitrage opportunities\n"
        "• 📊 Stock price movements\n\n"
        "To get started, link your NaijaXch account:\n"
        f"1. Go to <a href=\"{settings.FRONTEND_URL}/account\">Account Settings</a>\n"
        "2. Click 'Link Telegram'\n"
        "3. Send the link code here\n\n"
        "<b>Commands:</b>\n"
        "/start - Get started\n"
        "/help - Show help\n"
        "/status - Check connection"
    )


async def handle_help(chat_id: int) -> str:
    """Handle /help command."""
    return (
        "📚 <b>NaijaXch Bot Help</b>\n\n"
        "<b>What I do:</b>\n"
        "I send you instant alerts when:\n"
        "• A profitable crypto arbitrage opportunity appears\n"
        "• A stock hits your target price\n\n"
        "<b>Commands:</b>\n"
        "/start - Get started\n"
        "/help - Show this help\n"
        "/status - Check if your account is linked\n\n"
        "<b>Setup:</b>\n"
        f"Link your account at <a href=\"{settings.FRONTEND_URL}/account\">{settings.FRONTEND_URL}/account</a>\n\n"
        "<b>Need help?</b>\n"
        f"Visit <a href=\"{settings.FRONTEND_URL}/support\">Support</a>"
    )


async def handle_status(chat_id: int, db_session) -> str:
    """Handle /status command."""
    from app.models.user import User

    # Check if this chat_id is linked to a user
    user = db_session.query(User).filter(User.telegram_chat_id == chat_id).first()

    if user:
        return (
            "✅ <b>Connected!</b>\n\n"
            f"Linked to: <b>{user.email}</b>\n\n"
            "You'll receive alerts here for all your subscribed products.\n\n"
            f"<a href=\"{settings.FRONTEND_URL}/account\">Manage Settings →</a>"
        )
    else:
        return (
            "❌ <b>Not Connected</b>\n\n"
            "Your Telegram is not linked to any NaijaXch account.\n\n"
            f"<a href=\"{settings.FRONTEND_URL}/account\">Link Account →</a>"
        )


async def handle_unknown(text: str) -> str:
    """Handle unknown commands or messages."""
    return (
        "🤔 I didn't understand that.\n\n"
        "Try /help to see available commands."
    )
