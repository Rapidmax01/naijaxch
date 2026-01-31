from typing import Dict, List, Optional
from decimal import Decimal

from app.services.arbscanner.fee_calculator import FeeCalculator


class ArbitrageCalculator:
    """
    Calculates arbitrage opportunities between exchanges.

    Takes prices from multiple exchanges and calculates the potential
    profit after accounting for all fees.
    """

    def __init__(self):
        self.fee_calculator = FeeCalculator()

    def calculate_opportunity(
        self,
        buy_exchange: str,
        sell_exchange: str,
        buy_price: float,
        sell_price: float,
        crypto: str = "USDT",
        trade_amount_ngn: float = 100000
    ) -> Dict:
        """
        Calculate profit for an arbitrage opportunity.

        Args:
            buy_exchange: Exchange to buy from
            sell_exchange: Exchange to sell on
            buy_price: Price in NGN to buy 1 unit of crypto
            sell_price: Price in NGN to sell 1 unit of crypto
            crypto: Cryptocurrency (USDT, BTC, ETH)
            trade_amount_ngn: Amount in NGN to trade

        Returns:
            Dict with profit calculations
        """

        buy_price = Decimal(str(buy_price))
        sell_price = Decimal(str(sell_price))
        trade_amount = Decimal(str(trade_amount_ngn))

        # Calculate gross spread
        gross_spread = sell_price - buy_price
        gross_spread_percent = (gross_spread / buy_price) * 100 if buy_price else Decimal(0)

        # Calculate crypto amount bought
        crypto_amount = trade_amount / buy_price if buy_price else Decimal(0)

        # Calculate fees
        fees = self.fee_calculator.calculate_total_fees(
            buy_exchange=buy_exchange,
            sell_exchange=sell_exchange,
            crypto=crypto,
            trade_amount_ngn=float(trade_amount),
            crypto_amount=float(crypto_amount),
            sell_price=float(sell_price)
        )

        total_fees_ngn = Decimal(str(fees["total"]))

        # Calculate net profit
        gross_revenue = crypto_amount * sell_price
        net_profit = gross_revenue - trade_amount - total_fees_ngn
        net_profit_percent = (net_profit / trade_amount) * 100 if trade_amount else Decimal(0)

        # Determine if profitable
        is_profitable = net_profit > 0

        return {
            "buy_exchange": buy_exchange,
            "sell_exchange": sell_exchange,
            "crypto": crypto,
            "buy_price": float(buy_price),
            "sell_price": float(sell_price),
            "trade_amount_ngn": float(trade_amount),
            "crypto_amount": float(crypto_amount),
            "gross_spread": float(gross_spread),
            "gross_spread_percent": float(round(gross_spread_percent, 4)),
            "fees": fees,
            "net_profit": float(round(net_profit, 2)),
            "net_profit_percent": float(round(net_profit_percent, 4)),
            "is_profitable": is_profitable,
            "roi": float(round(net_profit_percent, 4))
        }

    def find_opportunities(
        self,
        prices: Dict[str, Dict],
        min_spread_percent: float = 1.0,
        trade_amount_ngn: float = 100000
    ) -> List[Dict]:
        """
        Find all profitable arbitrage opportunities.

        Args:
            prices: Dict of exchange prices
                {"binance_p2p": {"buy_price": 1580, "sell_price": 1595}, ...}
            min_spread_percent: Minimum spread to consider
            trade_amount_ngn: Trade amount for calculations

        Returns:
            List of opportunities sorted by profit
        """

        opportunities = []
        exchanges = list(prices.keys())

        # Compare all exchange pairs
        for buy_exchange in exchanges:
            for sell_exchange in exchanges:
                if buy_exchange == sell_exchange:
                    continue

                buy_price = prices[buy_exchange].get("buy_price")
                sell_price = prices[sell_exchange].get("sell_price")

                if not buy_price or not sell_price:
                    continue

                # Quick spread check
                if sell_price <= buy_price:
                    continue

                spread_percent = ((sell_price - buy_price) / buy_price) * 100

                if spread_percent < min_spread_percent:
                    continue

                # Calculate full opportunity
                opp = self.calculate_opportunity(
                    buy_exchange=buy_exchange,
                    sell_exchange=sell_exchange,
                    buy_price=buy_price,
                    sell_price=sell_price,
                    trade_amount_ngn=trade_amount_ngn
                )

                opportunities.append(opp)

        # Sort by net profit (descending)
        opportunities.sort(key=lambda x: x["net_profit_percent"], reverse=True)

        return opportunities

    async def find_best_opportunity(
        self,
        prices: Dict[str, Dict],
        trade_amount_ngn: float = 100000
    ) -> Optional[Dict]:
        """Find the single best arbitrage opportunity."""

        opportunities = self.find_opportunities(
            prices=prices,
            min_spread_percent=0,
            trade_amount_ngn=trade_amount_ngn
        )

        if opportunities and opportunities[0]["is_profitable"]:
            return opportunities[0]

        return None
