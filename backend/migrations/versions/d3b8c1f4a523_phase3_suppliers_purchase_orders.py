"""phase3_suppliers_purchase_orders

Revision ID: d3b8c1f4a523
Revises: c2a7f9e3b412
Create Date: 2026-03-26 11:00:00.000000

Yeni cədvəllər:
- suppliers
- purchase_orders
- purchase_order_items
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'd3b8c1f4a523'
down_revision = 'c2a7f9e3b412'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE purchase_order_status AS ENUM ('draft','sent','confirmed','partial_received','received','cancelled');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
    """)

    # --- suppliers ---
    op.create_table(
        'suppliers',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', UUID(as_uuid=True),
                  sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('contact_name', sa.String(255), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('address', sa.Text, nullable=True),
        sa.Column('tax_number', sa.String(50), nullable=True),
        sa.Column('payment_terms_days', sa.Integer, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('ix_suppliers_tenant_id', 'suppliers', ['tenant_id'])

    # --- purchase_orders ---
    op.create_table(
        'purchase_orders',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', UUID(as_uuid=True),
                  sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('po_number', sa.String(100), nullable=False),
        sa.Column('supplier_id', UUID(as_uuid=True),
                  sa.ForeignKey('suppliers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('warehouse_id', UUID(as_uuid=True),
                  sa.ForeignKey('warehouses.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('status', sa.Text, nullable=False, server_default='draft'),
        sa.Column('expected_delivery_date', sa.Date, nullable=True),
        sa.Column('total_amount', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_by', UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('received_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
    )
    op.execute("ALTER TABLE purchase_orders ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE purchase_orders ALTER COLUMN status TYPE purchase_order_status USING status::purchase_order_status")
    op.execute("ALTER TABLE purchase_orders ALTER COLUMN status SET DEFAULT 'draft'::purchase_order_status")
    op.create_index('ix_purchase_orders_tenant_id', 'purchase_orders', ['tenant_id'])
    op.create_index('ix_purchase_orders_supplier_id', 'purchase_orders', ['supplier_id'])
    op.create_index('ix_purchase_orders_status', 'purchase_orders', ['status'])

    # --- purchase_order_items ---
    op.create_table(
        'purchase_order_items',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', UUID(as_uuid=True),
                  sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('purchase_order_id', UUID(as_uuid=True),
                  sa.ForeignKey('purchase_orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('variant_id', UUID(as_uuid=True),
                  sa.ForeignKey('product_variants.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('ordered_quantity', sa.Integer, nullable=False),
        sa.Column('received_quantity', sa.Integer, nullable=False, server_default='0'),
        sa.Column('unit_cost', sa.Numeric(12, 2), nullable=False),
        sa.Column('line_total', sa.Numeric(12, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('ix_purchase_order_items_po_id', 'purchase_order_items', ['purchase_order_id'])
    op.create_index('ix_purchase_order_items_variant_id', 'purchase_order_items', ['variant_id'])


def downgrade() -> None:
    op.drop_table('purchase_order_items')
    op.drop_table('purchase_orders')
    op.drop_table('suppliers')
    op.execute("DROP TYPE IF EXISTS purchase_order_status")
