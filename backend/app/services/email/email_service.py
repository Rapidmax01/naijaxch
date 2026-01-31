"""Email service using Resend."""
import httpx
import logging
from typing import Optional, List
from datetime import datetime

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via Resend API."""

    BASE_URL = "https://api.resend.com"

    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.FROM_EMAIL

    @property
    def headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def send_email(
        self,
        to: str | List[str],
        subject: str,
        html: str,
        text: Optional[str] = None,
    ) -> dict:
        """
        Send an email via Resend.

        Args:
            to: Recipient email(s)
            subject: Email subject
            html: HTML content
            text: Plain text content (optional)
        """
        if not self.api_key:
            logger.warning("Resend API key not configured, skipping email")
            return {"status": "skipped", "message": "API key not configured"}

        payload = {
            "from": self.from_email,
            "to": [to] if isinstance(to, str) else to,
            "subject": subject,
            "html": html,
        }

        if text:
            payload["text"] = text

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/emails",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    return {"status": "sent", "data": response.json()}
                else:
                    logger.error(f"Email send failed: {response.text}")
                    return {"status": "failed", "error": response.text}

        except Exception as e:
            logger.error(f"Email send error: {e}")
            return {"status": "error", "error": str(e)}

    async def send_welcome_email(self, to: str, name: str = None) -> dict:
        """Send welcome email to new user."""
        name = name or to.split("@")[0]

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .header h1 {{ color: white; margin: 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to NaijaTrade Tools!</h1>
                </div>
                <div class="content">
                    <p>Hi {name},</p>
                    <p>Welcome to NaijaTrade Tools! You now have access to:</p>
                    <ul>
                        <li><strong>ArbScanner</strong> - Find crypto arbitrage opportunities across Nigerian exchanges</li>
                        <li><strong>NGX Radar</strong> - Screen and track Nigerian stocks</li>
                    </ul>
                    <p>Get started by exploring the tools:</p>
                    <p style="text-align: center;">
                        <a href="{settings.FRONTEND_URL}/arb" class="button">Launch ArbScanner</a>
                    </p>
                    <p>Happy trading!</p>
                    <p>- The NaijaTrade Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 NaijaTrade Tools. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email(
            to=to,
            subject="Welcome to NaijaTrade Tools!",
            html=html,
        )

    async def send_password_reset_email(self, to: str, reset_token: str) -> dict:
        """Send password reset email."""
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #1f2937; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .header h1 {{ color: white; margin: 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .warning {{ background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }}
                .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Hi,</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <p style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </p>
                    <div class="warning">
                        <strong>Note:</strong> This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
                    </div>
                    <p>- The NaijaTrade Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 NaijaTrade Tools. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email(
            to=to,
            subject="Reset Your NaijaTrade Password",
            html=html,
        )

    async def send_payment_receipt(
        self,
        to: str,
        amount: float,
        reference: str,
        product: str,
        plan: str,
        paid_at: datetime = None,
    ) -> dict:
        """Send payment receipt email."""
        paid_at = paid_at or datetime.utcnow()
        amount_formatted = f"₦{amount:,.2f}"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .header h1 {{ color: white; margin: 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .receipt {{ background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }}
                .receipt-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }}
                .receipt-row:last-child {{ border-bottom: none; }}
                .amount {{ font-size: 24px; color: #10b981; font-weight: bold; text-align: center; }}
                .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Payment Successful!</h1>
                </div>
                <div class="content">
                    <p>Thank you for your payment. Your subscription is now active.</p>

                    <div class="receipt">
                        <p class="amount">{amount_formatted}</p>
                        <div class="receipt-row">
                            <span>Product</span>
                            <strong>{product.upper()}</strong>
                        </div>
                        <div class="receipt-row">
                            <span>Plan</span>
                            <strong>{plan.capitalize()}</strong>
                        </div>
                        <div class="receipt-row">
                            <span>Reference</span>
                            <span style="font-family: monospace;">{reference}</span>
                        </div>
                        <div class="receipt-row">
                            <span>Date</span>
                            <span>{paid_at.strftime('%B %d, %Y at %H:%M')}</span>
                        </div>
                    </div>

                    <p>If you have any questions, please contact our support team.</p>
                    <p>- The NaijaTrade Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 NaijaTrade Tools. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email(
            to=to,
            subject=f"Payment Receipt - {amount_formatted}",
            html=html,
        )

    async def send_arbitrage_alert(
        self,
        to: str,
        crypto: str,
        buy_exchange: str,
        sell_exchange: str,
        buy_price: float,
        sell_price: float,
        spread_percent: float,
    ) -> dict:
        """Send arbitrage opportunity alert email."""
        profit_per_1m = (sell_price - buy_price) * (1000000 / buy_price)

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .header h1 {{ color: white; margin: 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .opportunity {{ background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }}
                .spread {{ font-size: 36px; color: #10b981; font-weight: bold; text-align: center; }}
                .arrow {{ font-size: 24px; text-align: center; margin: 10px 0; }}
                .exchange {{ text-align: center; padding: 10px; background: #f3f4f6; border-radius: 6px; margin: 5px 0; }}
                .button {{ display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Arbitrage Alert!</h1>
                </div>
                <div class="content">
                    <div class="opportunity">
                        <p class="spread">{spread_percent:.2f}% Spread</p>
                        <div class="exchange">
                            <strong>BUY {crypto}</strong> on {buy_exchange}<br>
                            ₦{buy_price:,.2f}
                        </div>
                        <p class="arrow">↓</p>
                        <div class="exchange">
                            <strong>SELL {crypto}</strong> on {sell_exchange}<br>
                            ₦{sell_price:,.2f}
                        </div>
                        <p style="text-align: center; color: #10b981; margin-top: 15px;">
                            <strong>Potential profit: ₦{profit_per_1m:,.2f} per ₦1M</strong>
                        </p>
                    </div>
                    <p style="text-align: center;">
                        <a href="{settings.FRONTEND_URL}/arb" class="button">View Details</a>
                    </p>
                    <p style="font-size: 12px; color: #6b7280;">
                        Note: Prices change rapidly. Verify current prices before trading.
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 NaijaTrade Tools. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email(
            to=to,
            subject=f"🚨 {spread_percent:.1f}% Arbitrage: {crypto} {buy_exchange} → {sell_exchange}",
            html=html,
        )

    async def send_stock_alert(
        self,
        to: str,
        symbol: str,
        stock_name: str,
        alert_type: str,
        target_value: float,
        current_price: float,
    ) -> dict:
        """Send stock price alert email."""
        direction = "above" if alert_type == "price_above" else "below"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .header h1 {{ color: white; margin: 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .alert-box {{ background: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }}
                .symbol {{ font-size: 28px; font-weight: bold; color: #1f2937; }}
                .price {{ font-size: 36px; color: #10b981; font-weight: bold; margin: 10px 0; }}
                .button {{ display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Stock Price Alert!</h1>
                </div>
                <div class="content">
                    <div class="alert-box">
                        <p class="symbol">{symbol}</p>
                        <p style="color: #6b7280;">{stock_name}</p>
                        <p class="price">₦{current_price:,.2f}</p>
                        <p>Price is now {direction} your target of ₦{target_value:,.2f}</p>
                    </div>
                    <p style="text-align: center;">
                        <a href="{settings.FRONTEND_URL}/ngx/stocks/{symbol}" class="button">View Stock</a>
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 NaijaTrade Tools. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email(
            to=to,
            subject=f"📈 {symbol} is {direction} ₦{target_value:,.2f}",
            html=html,
        )


# Global email service instance
email_service = EmailService()
