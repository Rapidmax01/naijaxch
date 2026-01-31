"""Paystack payment gateway integration."""
import httpx
import hmac
import hashlib
from typing import Dict, Optional, Any
from datetime import datetime

from app.config import settings


class PaystackService:
    """Service for Paystack payment operations."""

    BASE_URL = "https://api.paystack.co"

    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.public_key = settings.PAYSTACK_PUBLIC_KEY

    @property
    def headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    async def initialize_transaction(
        self,
        email: str,
        amount_ngn: float,
        reference: str,
        callback_url: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Initialize a Paystack transaction.

        Args:
            email: Customer email
            amount_ngn: Amount in Naira (will be converted to kobo)
            reference: Unique transaction reference
            callback_url: URL to redirect after payment
            metadata: Additional data to attach to transaction

        Returns:
            Paystack response with authorization_url
        """
        amount_kobo = int(amount_ngn * 100)

        payload = {
            "email": email,
            "amount": amount_kobo,
            "reference": reference,
            "currency": "NGN",
        }

        if callback_url:
            payload["callback_url"] = callback_url

        if metadata:
            payload["metadata"] = metadata

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/transaction/initialize",
                headers=self.headers,
                json=payload,
            )

            data = response.json()

            if not data.get("status"):
                raise PaystackError(data.get("message", "Transaction initialization failed"))

            return data["data"]

    async def verify_transaction(self, reference: str) -> Dict[str, Any]:
        """
        Verify a Paystack transaction.

        Args:
            reference: Transaction reference

        Returns:
            Transaction details if successful
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/transaction/verify/{reference}",
                headers=self.headers,
            )

            data = response.json()

            if not data.get("status"):
                raise PaystackError(data.get("message", "Transaction verification failed"))

            return data["data"]

    async def create_customer(self, email: str, first_name: str = None, last_name: str = None) -> Dict[str, Any]:
        """Create a Paystack customer."""
        payload = {"email": email}
        if first_name:
            payload["first_name"] = first_name
        if last_name:
            payload["last_name"] = last_name

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/customer",
                headers=self.headers,
                json=payload,
            )

            data = response.json()
            if not data.get("status"):
                raise PaystackError(data.get("message", "Customer creation failed"))

            return data["data"]

    async def create_subscription(
        self,
        customer_email: str,
        plan_code: str,
        authorization_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a recurring subscription."""
        payload = {
            "customer": customer_email,
            "plan": plan_code,
        }

        if authorization_code:
            payload["authorization"] = authorization_code

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/subscription",
                headers=self.headers,
                json=payload,
            )

            data = response.json()
            if not data.get("status"):
                raise PaystackError(data.get("message", "Subscription creation failed"))

            return data["data"]

    async def disable_subscription(self, subscription_code: str, token: str) -> bool:
        """Disable/cancel a subscription."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/subscription/disable",
                headers=self.headers,
                json={"code": subscription_code, "token": token},
            )

            data = response.json()
            return data.get("status", False)

    async def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Get subscription details."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/subscription/{subscription_id}",
                headers=self.headers,
            )

            data = response.json()
            if not data.get("status"):
                raise PaystackError(data.get("message", "Failed to get subscription"))

            return data["data"]

    async def list_plans(self) -> list:
        """List all plans."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/plan",
                headers=self.headers,
            )

            data = response.json()
            return data.get("data", [])

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify Paystack webhook signature.

        Args:
            payload: Raw request body
            signature: x-paystack-signature header

        Returns:
            True if signature is valid
        """
        if not settings.PAYSTACK_SECRET_KEY:
            return False

        expected = hmac.new(
            settings.PAYSTACK_SECRET_KEY.encode(),
            payload,
            hashlib.sha512
        ).hexdigest()

        return hmac.compare_digest(expected, signature)


class PaystackError(Exception):
    """Paystack API error."""
    pass
