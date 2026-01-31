"""Telegram bot endpoints."""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
import secrets
import time

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.redis import redis_client
from app.models.user import User
from app.services.telegram import telegram_bot
from app.telegram_bot.handlers.commands import (
    handle_start,
    handle_help,
    handle_status,
    handle_unknown,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Store pending link tokens (token -> user_id, expires_at)
LINK_TOKEN_TTL = 300  # 5 minutes


@router.get("/telegram/link-token")
async def get_link_token(
    current_user: User = Depends(get_current_user),
):
    """
    Generate a token for linking Telegram account.

    User sends this token to the bot to link their account.
    """
    # Generate unique token
    token = secrets.token_urlsafe(16)

    # Store token -> user_id mapping
    redis_client.set(
        f"telegram_link:{token}",
        current_user.id,
        expire_seconds=LINK_TOKEN_TTL
    )

    return {
        "token": token,
        "expires_in": LINK_TOKEN_TTL,
        "bot_url": f"https://t.me/naijaxchbot?start={token}",
        "instructions": "Send this token to @naijaxchbot on Telegram to link your account."
    }


@router.post("/telegram/verify-link")
async def verify_telegram_link(
    token: str,
    chat_id: int,
    db: Session = Depends(get_db),
):
    """
    Verify a Telegram link token (called by the bot).

    This endpoint is called by the Telegram bot when a user
    sends their link token.
    """
    # Get user_id from token
    user_id = redis_client.get(f"telegram_link:{token}")

    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    # Find user and update telegram_chat_id
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.telegram_chat_id = chat_id
    db.commit()

    # Delete used token
    redis_client.delete(f"telegram_link:{token}")

    # Send welcome message
    await telegram_bot.send_welcome_message(chat_id, user.email)

    return {"status": "linked", "user_email": user.email}


@router.delete("/telegram/unlink")
async def unlink_telegram(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Unlink Telegram from user account."""
    if not current_user.telegram_chat_id:
        raise HTTPException(status_code=400, detail="Telegram not linked")

    current_user.telegram_chat_id = None
    db.commit()

    return {"message": "Telegram unlinked successfully"}


@router.get("/telegram/status")
async def get_telegram_status(
    current_user: User = Depends(get_current_user),
):
    """Check if Telegram is linked to this account."""
    return {
        "linked": current_user.telegram_chat_id is not None,
        "chat_id": current_user.telegram_chat_id,
    }


@router.post("/telegram/test")
async def test_telegram_notification(
    current_user: User = Depends(get_current_user),
):
    """Send a test notification to linked Telegram."""
    if not current_user.telegram_chat_id:
        raise HTTPException(status_code=400, detail="Telegram not linked")

    result = await telegram_bot.send_message(
        current_user.telegram_chat_id,
        "🔔 <b>Test Notification</b>\n\nYour NaijaXch alerts are working!"
    )

    if result.get("status") != "sent":
        raise HTTPException(status_code=500, detail="Failed to send test message")

    return {"message": "Test notification sent!"}


@router.post("/telegram/webhook")
async def telegram_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Receive webhook updates from Telegram.

    This endpoint should be registered with Telegram using:
    https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_URL>/api/v1/telegram/webhook
    """
    try:
        update = await request.json()
        logger.info(f"Telegram update received: {update}")

        # Handle message updates
        message = update.get("message")
        if not message:
            return {"ok": True}

        chat_id = message.get("chat", {}).get("id")
        text = message.get("text", "")
        from_user = message.get("from", {})

        if not chat_id or not text:
            return {"ok": True}

        response_text = ""

        # Route to appropriate handler
        if text.startswith("/start"):
            response_text = await handle_start(chat_id, text, from_user)

            # Check if this is a link token response
            if response_text.startswith("__LINK_TOKEN__:"):
                token = response_text.split(":")[1]
                # Get user_id and link
                user_id = redis_client.get(f"telegram_link:{token}")
                if user_id:
                    user = db.query(User).filter(User.id == user_id).first()
                    if user:
                        user.telegram_chat_id = chat_id
                        db.commit()
                        redis_client.delete(f"telegram_link:{token}")
                        response_text = None  # Will send welcome message
                        await telegram_bot.send_welcome_message(chat_id, user.email)

        elif text.startswith("/help"):
            response_text = await handle_help(chat_id)

        elif text.startswith("/status"):
            response_text = await handle_status(chat_id, db)

        else:
            response_text = await handle_unknown(text)

        # Send response
        if response_text:
            await telegram_bot.send_message(chat_id, response_text)

        return {"ok": True}

    except Exception as e:
        logger.error(f"Telegram webhook error: {e}")
        return {"ok": True}  # Always return 200 to Telegram
