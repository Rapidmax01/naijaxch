from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional

router = APIRouter()

# Current approximate investment rates in Nigeria
INVESTMENT_RATES = {
    "bank_fd": {
        "name": "Bank Fixed Deposit",
        "category": "traditional",
        "rates": {"3mo": 5.0, "6mo": 7.0, "1yr": 10.0, "2yr": 11.0, "5yr": 12.0},
        "risk": "low",
    },
    "treasury_bills": {
        "name": "Treasury Bills",
        "category": "traditional",
        "rates": {"3mo": 8.0, "6mo": 10.0, "1yr": 12.0, "2yr": 12.0, "5yr": 12.0},
        "risk": "low",
    },
    "crypto_staking": {
        "name": "Crypto Staking (USDT)",
        "category": "crypto",
        "rates": {"3mo": 6.0, "6mo": 6.0, "1yr": 6.0, "2yr": 6.0, "5yr": 6.0},
        "risk": "medium",
    },
    "stock_dividends": {
        "name": "Stock Dividends (NGX Avg)",
        "category": "stocks",
        "rates": {"3mo": 8.0, "6mo": 8.0, "1yr": 8.0, "2yr": 8.0, "5yr": 8.0},
        "risk": "medium",
    },
    "money_market": {
        "name": "Money Market Fund",
        "category": "traditional",
        "rates": {"3mo": 9.0, "6mo": 10.0, "1yr": 11.0, "2yr": 11.5, "5yr": 12.0},
        "risk": "low",
    },
}

DURATION_MONTHS = {"3mo": 3, "6mo": 6, "1yr": 12, "2yr": 24, "5yr": 60}


class CompareRequest(BaseModel):
    amount_ngn: float = Field(gt=0)
    duration: str = "1yr"


@router.get("/rates")
async def get_investment_rates():
    """Get current investment rates for all instruments."""
    return {"rates": INVESTMENT_RATES, "durations": list(DURATION_MONTHS.keys())}


@router.post("/compare")
async def compare_investments(req: CompareRequest):
    """Compute compound returns for all instruments at a given amount and duration."""
    months = DURATION_MONTHS.get(req.duration, 12)
    results = []

    for key, info in INVESTMENT_RATES.items():
        annual_rate = info["rates"].get(req.duration, info["rates"].get("1yr", 0))
        monthly_rate = annual_rate / 100 / 12

        # Compound monthly
        final_value = req.amount_ngn
        growth_curve = [{"month": 0, "value": round(req.amount_ngn, 2)}]

        for m in range(1, months + 1):
            final_value *= (1 + monthly_rate)
            growth_curve.append({"month": m, "value": round(final_value, 2)})

        total_return = final_value - req.amount_ngn
        return_pct = (total_return / req.amount_ngn) * 100

        results.append({
            "key": key,
            "name": info["name"],
            "category": info["category"],
            "risk": info["risk"],
            "annual_rate": annual_rate,
            "final_value": round(final_value, 2),
            "total_return": round(total_return, 2),
            "return_percent": round(return_pct, 2),
            "growth_curve": growth_curve,
        })

    # Sort by return descending
    results.sort(key=lambda x: x["total_return"], reverse=True)

    return {
        "amount_ngn": req.amount_ngn,
        "duration": req.duration,
        "months": months,
        "results": results,
        "winner": results[0] if results else None,
    }
