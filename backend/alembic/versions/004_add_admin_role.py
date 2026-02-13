"""Add admin role and auto-curated fields

Revision ID: 004_add_admin_role
Revises: 003_eight_features
Create Date: 2026-02-13
"""
from alembic import op
import sqlalchemy as sa

revision = "004_add_admin_role"
down_revision = "003_eight_features"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), server_default="0", nullable=False))
    op.add_column("airdrops", sa.Column("is_auto_curated", sa.Boolean(), server_default="0", nullable=False))


def downgrade():
    op.drop_column("users", "is_admin")
    op.drop_column("airdrops", "is_auto_curated")
