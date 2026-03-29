"""merge_rbac_and_auth_heads

Revision ID: 4dc70fd29dcb
Revises: d2607bd2042b, i8h3j6k9l0m1
Create Date: 2026-03-29 08:53:48.481094

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4dc70fd29dcb'
down_revision: Union[str, None] = ('d2607bd2042b', 'i8h3j6k9l0m1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
