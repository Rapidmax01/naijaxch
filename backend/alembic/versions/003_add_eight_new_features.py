"""Add eight new features tables

Revision ID: 003_eight_features
Revises: 002_add_referral
Create Date: 2026-02-12
"""
from alembic import op
import sqlalchemy as sa


revision = "003_eight_features"
down_revision = "002_add_referral"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Portfolios
    op.create_table(
        "portfolios",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )

    # Portfolio Holdings
    op.create_table(
        "portfolio_holdings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("portfolio_id", sa.String(36), sa.ForeignKey("portfolios.id"), nullable=False, index=True),
        sa.Column("crypto", sa.String(10), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("buy_price_ngn", sa.Float(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("added_at", sa.DateTime()),
    )

    # DCA Plans
    op.create_table(
        "dca_plans",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("crypto", sa.String(10), nullable=False),
        sa.Column("target_amount_ngn", sa.Float(), nullable=True),
        sa.Column("frequency", sa.String(20), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )

    # DCA Entries
    op.create_table(
        "dca_entries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("plan_id", sa.String(36), sa.ForeignKey("dca_plans.id"), nullable=False, index=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("amount_ngn", sa.Float(), nullable=False),
        sa.Column("price_per_unit_ngn", sa.Float(), nullable=False),
        sa.Column("crypto_amount", sa.Float(), nullable=False),
        sa.Column("exchange", sa.String(50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime()),
    )

    # News Items
    op.create_table(
        "news_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("source", sa.String(100), nullable=False),
        sa.Column("url", sa.String(1000), unique=True, nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(1000), nullable=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("fetched_at", sa.DateTime()),
    )

    # Trading Signals
    op.create_table(
        "trading_signals",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("asset_type", sa.String(20), nullable=False),
        sa.Column("asset_symbol", sa.String(20), nullable=False),
        sa.Column("direction", sa.String(10), nullable=False),
        sa.Column("entry_price", sa.Float(), nullable=False),
        sa.Column("target_price", sa.Float(), nullable=True),
        sa.Column("stop_loss", sa.Float(), nullable=True),
        sa.Column("reasoning", sa.Text(), nullable=True),
        sa.Column("timeframe", sa.String(20), nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("result", sa.String(20), nullable=True),
        sa.Column("result_percent", sa.Float(), nullable=True),
        sa.Column("is_premium", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )

    # Airdrops
    op.create_table(
        "airdrops",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("project", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("reward_estimate", sa.String(100), nullable=True),
        sa.Column("reward_token", sa.String(20), nullable=True),
        sa.Column("requirements", sa.Text(), nullable=True),
        sa.Column("steps", sa.Text(), nullable=True),
        sa.Column("url", sa.String(1000), nullable=True),
        sa.Column("image_url", sa.String(1000), nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("difficulty", sa.String(20), nullable=False),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("is_verified", sa.Boolean(), default=False),
        sa.Column("is_featured", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )


def downgrade() -> None:
    op.drop_table("airdrops")
    op.drop_table("trading_signals")
    op.drop_table("news_items")
    op.drop_table("dca_entries")
    op.drop_table("dca_plans")
    op.drop_table("portfolio_holdings")
    op.drop_table("portfolios")
