"""add currency field to payments

Revision ID: h7f2g5h8e967
Revises: g6e1f4g7d856
Create Date: 2026-03-28 00:02:00.000000

Frontend Payment tipi currency field gözləyirdi, lakin payments cədvəlində
həmin sütun mövcud deyildi. Bu migrasiya NOT NULL String(3) sütunu əlavə edir;
mövcud sətirlər üçün default dəyər AZN-dir.
"""
from alembic import op
import sqlalchemy as sa


revision = 'h7f2g5h8e967'
down_revision = 'g6e1f4g7d856'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'payments',
        sa.Column('currency', sa.String(3), nullable=False, server_default='AZN'),
    )


def downgrade() -> None:
    op.drop_column('payments', 'currency')
