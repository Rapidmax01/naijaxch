"""Add referral fields to users table

Revision ID: 002_add_referral
Revises: 001_add_google_oauth_fields
Create Date: 2026-02-12
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = "002_add_referral"
down_revision = "001_add_google_oauth_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("referral_code", sa.String(10), nullable=True))
    op.add_column("users", sa.Column("referred_by", sa.String(36), nullable=True))
    op.add_column("users", sa.Column("referral_count", sa.Integer(), server_default="0", nullable=True))

    op.create_index("ix_users_referral_code", "users", ["referral_code"], unique=True)
    op.create_foreign_key(
        "fk_users_referred_by",
        "users",
        "users",
        ["referred_by"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_users_referred_by", "users", type_="foreignkey")
    op.drop_index("ix_users_referral_code", "users")
    op.drop_column("users", "referral_count")
    op.drop_column("users", "referred_by")
    op.drop_column("users", "referral_code")
