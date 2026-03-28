"""add notes field to suppliers

Revision ID: g6e1f4g7d856
Revises: f5d0e3f6c745
Create Date: 2026-03-28 00:01:00.000000

Frontend Supplier tipi notes field gözləyirdi, lakin suppliers cədvəlində
həmin sütun mövcud deyildi. Bu migrasiya nullable Text sütunu əlavə edir.
"""
from alembic import op
import sqlalchemy as sa


revision = 'g6e1f4g7d856'
down_revision = 'f5d0e3f6c745'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('suppliers', sa.Column('notes', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('suppliers', 'notes')
