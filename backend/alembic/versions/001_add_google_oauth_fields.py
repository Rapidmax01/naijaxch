"""Add Google OAuth fields to users table

Revision ID: 001_google_oauth
Revises:
Create Date: 2026-02-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_google_oauth'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make password_hash nullable (Google users don't have a password)
    op.alter_column('users', 'password_hash',
                     existing_type=sa.String(255),
                     nullable=True)

    # Add auth_provider column with default "email"
    op.add_column('users',
                  sa.Column('auth_provider', sa.String(20), nullable=False, server_default='email'))

    # Add google_id column with unique index
    op.add_column('users',
                  sa.Column('google_id', sa.String(255), nullable=True))
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_column('users', 'google_id')
    op.drop_column('users', 'auth_provider')
    op.alter_column('users', 'password_hash',
                     existing_type=sa.String(255),
                     nullable=False)
