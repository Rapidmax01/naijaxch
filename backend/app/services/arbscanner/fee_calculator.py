import logging
from typing import Dict
from decimal import Decimal

logger = logging.getLogger(__name__)


class FeeCalculator:
    """
    Calculates fees for crypto trading operations.

    Maintains an accurate fee database for all supported exchanges.
    Fees should be updated regularly as exchanges may change them.
    """

    # Fee structure for all exchanges
    # trading_fee_percent: Fee as a percentage of trade value
    # withdrawal_<crypto>: Flat fee in crypto units for withdrawals
    FEES = {
        "binance_p2p": {
            "trading_fee_percent": Decimal("0"),  # No trading fee on P2P
            "withdrawal_usdt_trc20": Decimal("1"),
            "withdrawal_usdt_bep20": Decimal("0.29"),
            "withdrawal_btc": Decimal("0.0000012"),
            "withdrawal_eth": Decimal("0.0016"),
            "ngn_deposit_fee": Decimal("0"),
            "ngn_withdrawal_fee": Decimal("0"),
        },
        "quidax": {
            "trading_fee_percent": Decimal("0.005"),  # 0.5%
            "withdrawal_usdt": Decimal("2"),
            "withdrawal_btc": Decimal("0.0002"),
            "withdrawal_eth": Decimal("0.005"),
            "ngn_deposit_fee": Decimal("0"),
            "ngn_withdrawal_fee_percent": Decimal("0.005"),  # 0.5%
        },
        "luno": {
            "trading_fee_percent": Decimal("0.001"),  # 0.1%
            "withdrawal_usdt": Decimal("1"),
            "withdrawal_btc": Decimal("0.0001"),
            "withdrawal_eth": Decimal("0.005"),
            "ngn_deposit_fee": Decimal("0"),
            "ngn_withdrawal_fee": Decimal("0"),
        },
        "bybit_p2p": {
            "trading_fee_percent": Decimal("0"),  # No trading fee on P2P
            "withdrawal_usdt_trc20": Decimal("1"),
            "withdrawal_usdt_bep20": Decimal("0.3"),
            "withdrawal_btc": Decimal("0.0002"),
            "withdrawal_eth": Decimal("0.0015"),
            "ngn_deposit_fee": Decimal("0"),
            "ngn_withdrawal_fee": Decimal("0"),
        },
        "remitano": {
            "trading_fee_percent": Decimal("0.01"),  # 1%
            "withdrawal_usdt": Decimal("2"),
            "withdrawal_btc": Decimal("0.0005"),
            "withdrawal_eth": Decimal("0.005"),
            "ngn_deposit_fee": Decimal("0"),
            "ngn_withdrawal_fee_percent": Decimal("0.005"),  # 0.5%
        },
        "patricia": {
            "trading_fee_percent": Decimal("0.005"),  # 0.5%
            "withdrawal_usdt": Decimal("2"),
            "withdrawal_btc": Decimal("0.0003"),
            "withdrawal_eth": Decimal("0.005"),
            "ngn_deposit_fee": Decimal("0"),
            "ngn_withdrawal_fee_percent": Decimal("0.01"),  # 1%
        },
        "paxful": {
            "trading_fee_percent": Decimal("0.01"),  # 1% (seller pays)
            "withdrawal_usdt": Decimal("2"),
            "withdrawal_btc": Decimal("0.0005"),
            "withdrawal_eth": Decimal("0.005"),
            "ngn_deposit_fee": Decimal("0"),
            "ngn_withdrawal_fee": Decimal("0"),
        },
    }

    def get_trading_fee(
        self,
        exchange: str,
        trade_amount_ngn: float
    ) -> float:
        """
        Get trading fee for an exchange.

        Args:
            exchange: Exchange name
            trade_amount_ngn: Trade amount in NGN

        Returns:
            Trading fee in NGN
        """
        exchange_fees = self.FEES.get(exchange)
        if exchange_fees is None:
            logger.warning(f"Unknown exchange '{exchange}', using conservative 0.5% default fee")
            fee_percent = Decimal("0.005")
        else:
            fee_percent = exchange_fees.get("trading_fee_percent", Decimal("0"))
        return float(Decimal(str(trade_amount_ngn)) * fee_percent)

    def get_withdrawal_fee(
        self,
        exchange: str,
        crypto: str,
        crypto_amount: float,
        crypto_price_ngn: float,
        network: str = "trc20"
    ) -> float:
        """
        Get withdrawal fee for an exchange.

        Args:
            exchange: Exchange name
            crypto: Cryptocurrency (USDT, BTC, ETH)
            crypto_amount: Amount of crypto being withdrawn
            crypto_price_ngn: Current price of crypto in NGN
            network: Network for withdrawal (trc20, bep20, etc.)

        Returns:
            Withdrawal fee in NGN equivalent
        """
        exchange_fees = self.FEES.get(exchange)
        if exchange_fees is None:
            logger.warning(f"Unknown exchange '{exchange}' for withdrawal fee, using conservative estimate")
            # Conservative default withdrawal fees in crypto units
            defaults = {"usdt": Decimal("2"), "btc": Decimal("0.0005"), "eth": Decimal("0.005")}
            crypto_fee = defaults.get(crypto.lower(), Decimal("2"))
            fee_ngn = float(crypto_fee) * crypto_price_ngn
            return fee_ngn

        fees = exchange_fees

        # Try network-specific fee first
        fee_key = f"withdrawal_{crypto.lower()}_{network.lower()}"
        crypto_fee = fees.get(fee_key)

        # Fall back to general crypto fee
        if crypto_fee is None:
            fee_key = f"withdrawal_{crypto.lower()}"
            crypto_fee = fees.get(fee_key, Decimal("0"))

        # Convert crypto fee to NGN
        fee_ngn = float(crypto_fee) * crypto_price_ngn
        return fee_ngn

    def calculate_total_fees(
        self,
        buy_exchange: str,
        sell_exchange: str,
        crypto: str,
        trade_amount_ngn: float,
        crypto_amount: float,
        sell_price: float
    ) -> Dict:
        """
        Calculate total fees for an arbitrage operation.

        Includes:
        - Buy trading fee
        - Sell trading fee
        - Withdrawal fee (to move crypto between exchanges)

        Args:
            buy_exchange: Exchange buying from
            sell_exchange: Exchange selling on
            crypto: Cryptocurrency
            trade_amount_ngn: Amount in NGN for buying
            crypto_amount: Amount of crypto being traded
            sell_price: Sell price in NGN (for fee calculation)

        Returns:
            Dict with fee breakdown
        """

        # Trading fees
        buy_fee = self.get_trading_fee(buy_exchange, trade_amount_ngn)
        sell_revenue = crypto_amount * sell_price
        sell_fee = self.get_trading_fee(sell_exchange, sell_revenue)

        # Withdrawal fee (moving from buy exchange to sell exchange)
        withdrawal_fee = self.get_withdrawal_fee(
            exchange=buy_exchange,
            crypto=crypto,
            crypto_amount=crypto_amount,
            crypto_price_ngn=sell_price
        )

        total = buy_fee + sell_fee + withdrawal_fee

        return {
            "buy_fee": round(buy_fee, 2),
            "sell_fee": round(sell_fee, 2),
            "withdrawal_fee": round(withdrawal_fee, 2),
            "total": round(total, 2)
        }

    def get_exchange_fees(self, exchange: str) -> Dict:
        """Get all fees for an exchange."""
        return dict(self.FEES.get(exchange, {}))

    def get_all_fees(self) -> Dict:
        """Get fee structure for all exchanges."""
        return {
            exchange: dict(fees)
            for exchange, fees in self.FEES.items()
        }
