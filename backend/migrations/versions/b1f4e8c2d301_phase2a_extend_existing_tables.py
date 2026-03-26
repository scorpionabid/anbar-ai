"""phase2a_extend_existing_tables

Revision ID: b1f4e8c2d301
Revises: a233d9240102
Create Date: 2026-03-26 10:00:00.000000

Əlavə edilənlər:
- product_variants: cost_price, barcode, weight, attributes TEXT→JSONB
- products: unit_of_measure
- inventory: reorder_point, last_counted_at
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = 'b1f4e8c2d301'
down_revision = 'a233d9240102'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- product_variants ---
    op.add_column('product_variants',
        sa.Column('cost_price', sa.Numeric(12, 2), nullable=True)
    )
    op.add_column('product_variants',
        sa.Column('barcode', sa.String(100), nullable=True)
    )
    op.add_column('product_variants',
        sa.Column('weight', sa.Numeric(8, 3), nullable=True)
    )
    # attributes: TEXT → JSONB (mövcud data JSON string kimi saxlanırdı)
    op.execute("""
        ALTER TABLE product_variants
        ALTER COLUMN attributes TYPE JSONB
        USING CASE
            WHEN attributes IS NULL THEN NULL
            ELSE attributes::jsonb
        END
    """)

    # --- products ---
    op.add_column('products',
        sa.Column('unit_of_measure', sa.String(50), nullable=True)
    )

    # --- inventory ---
    op.add_column('inventory',
        sa.Column('reorder_point', sa.Integer(), nullable=False, server_default='0')
    )
    op.add_column('inventory',
        sa.Column('last_counted_at', sa.DateTime(timezone=True), nullable=True)
    )


def downgrade() -> None:
    # inventory
    op.drop_column('inventory', 'last_counted_at')
    op.drop_column('inventory', 'reorder_point')

    # products
    op.drop_column('products', 'unit_of_measure')

    # product_variants — JSONB → TEXT
    op.execute("""
        ALTER TABLE product_variants
        ALTER COLUMN attributes TYPE TEXT
        USING attributes::text
    """)
    op.drop_column('product_variants', 'weight')
    op.drop_column('product_variants', 'barcode')
    op.drop_column('product_variants', 'cost_price')
