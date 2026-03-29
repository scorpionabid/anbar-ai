"""add updated_at to refresh_tokens

Revision ID: 4912a821d07a
Revises: 4dc70fd29dcb
Create Date: 2026-03-29 13:37:50.045641

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4912a821d07a'
down_revision: Union[str, None] = '4dc70fd29dcb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('refresh_tokens', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))


def downgrade() -> None:
    op.drop_column('refresh_tokens', 'updated_at')
