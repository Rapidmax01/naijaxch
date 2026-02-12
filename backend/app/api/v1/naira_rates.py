"""Naira exchange rate API endpoints."""
from fastapi import APIRouter

from app.scrapers.forex.naira_rates import NairaRateScraper

router = APIRouter()


@router.get("/rates")
async def get_naira_rates():
    """
    Get current NGN exchange rates for USD, GBP, EUR.
    Returns official (CBN) and parallel market rates.
    """
    scraper = NairaRateScraper()
    rates = await scraper.get_rates()
    return rates
