"""
Fallback price data for when live APIs are unavailable.

These are realistic sample prices based on typical Nigerian crypto market rates.
They ensure the UI always shows data, clearly marked as sample data.
"""

from datetime import datetime
from typing import Dict, Optional


# Realistic NGN prices for Nigerian crypto market (approximate mid-market rates)
FALLBACK_PRICES = {
    "USDT": {
        "binance_p2p": {"buy_price": 1580.0, "sell_price": 1575.0, "display_name": "Binance P2P", "type": "p2p"},
        "bybit_p2p": {"buy_price": 1582.0, "sell_price": 1573.0, "display_name": "Bybit P2P", "type": "p2p"},
        "quidax": {"buy_price": 1585.0, "sell_price": 1570.0, "display_name": "Quidax", "type": "exchange"},
        "luno": {"buy_price": 1583.0, "sell_price": 1572.0, "display_name": "Luno", "type": "exchange"},
        "remitano": {"buy_price": 1588.0, "sell_price": 1568.0, "display_name": "Remitano", "type": "p2p"},
        "patricia": {"buy_price": 1590.0, "sell_price": 1565.0, "display_name": "Patricia", "type": "exchange"},
        "paxful": {"buy_price": 1592.0, "sell_price": 1563.0, "display_name": "Paxful", "type": "p2p"},
    },
    "BTC": {
        "binance_p2p": {"buy_price": 155_000_000.0, "sell_price": 154_500_000.0, "display_name": "Binance P2P", "type": "p2p"},
        "bybit_p2p": {"buy_price": 155_200_000.0, "sell_price": 154_300_000.0, "display_name": "Bybit P2P", "type": "p2p"},
        "quidax": {"buy_price": 155_500_000.0, "sell_price": 154_000_000.0, "display_name": "Quidax", "type": "exchange"},
        "luno": {"buy_price": 155_100_000.0, "sell_price": 154_400_000.0, "display_name": "Luno", "type": "exchange"},
        "remitano": {"buy_price": 155_800_000.0, "sell_price": 153_800_000.0, "display_name": "Remitano", "type": "p2p"},
        "patricia": {"buy_price": 156_000_000.0, "sell_price": 153_500_000.0, "display_name": "Patricia", "type": "exchange"},
        "paxful": {"buy_price": 156_200_000.0, "sell_price": 153_300_000.0, "display_name": "Paxful", "type": "p2p"},
    },
    "ETH": {
        "binance_p2p": {"buy_price": 4_100_000.0, "sell_price": 4_080_000.0, "display_name": "Binance P2P", "type": "p2p"},
        "bybit_p2p": {"buy_price": 4_110_000.0, "sell_price": 4_070_000.0, "display_name": "Bybit P2P", "type": "p2p"},
        "quidax": {"buy_price": 4_120_000.0, "sell_price": 4_060_000.0, "display_name": "Quidax", "type": "exchange"},
        "luno": {"buy_price": 4_105_000.0, "sell_price": 4_075_000.0, "display_name": "Luno", "type": "exchange"},
        "remitano": {"buy_price": 4_130_000.0, "sell_price": 4_050_000.0, "display_name": "Remitano", "type": "p2p"},
        "patricia": {"buy_price": 4_140_000.0, "sell_price": 4_040_000.0, "display_name": "Patricia", "type": "exchange"},
        "paxful": {"buy_price": 4_150_000.0, "sell_price": 4_030_000.0, "display_name": "Paxful", "type": "p2p"},
    },
}


def get_fallback_price(
    exchange: str,
    crypto: str = "USDT",
    fiat: str = "NGN",
) -> Optional[Dict]:
    """
    Get fallback price data for an exchange/crypto pair.

    Returns a properly formatted exchange price dict with is_sample_data=True,
    or None if the exchange/crypto combination isn't in fallback data.
    """
    crypto_data = FALLBACK_PRICES.get(crypto.upper(), {})
    exchange_data = crypto_data.get(exchange)

    if not exchange_data:
        return None

    buy_price = exchange_data["buy_price"]
    sell_price = exchange_data["sell_price"]
    spread = sell_price - buy_price
    spread_percent = (spread / buy_price) * 100 if buy_price else 0

    return {
        "exchange": exchange,
        "display_name": exchange_data["display_name"],
        "type": exchange_data["type"],
        "crypto": crypto.upper(),
        "fiat": fiat.upper(),
        "buy_price": buy_price,
        "sell_price": sell_price,
        "spread": spread,
        "spread_percent": round(spread_percent, 4),
        "updated_at": datetime.utcnow().isoformat(),
        "is_sample_data": True,
    }
