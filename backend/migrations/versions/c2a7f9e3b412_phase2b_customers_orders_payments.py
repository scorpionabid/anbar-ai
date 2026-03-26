"""phase2b_customers_orders_payments

Revision ID: c2a7f9e3b412
Revises: b1f4e8c2d301
Create Date: 2026-03-26 10:30:00.000000

Yeni cədvəllər:
- customers
- orders
- order_items
- payments
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'c2a7f9e3b412'
down_revision = 'b1f4e8c2d301'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ENUM tipləri — idempotent DO block (asyncpg IF NOT EXISTS dəstəkləmir)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE customer_type AS ENUM ('individual', 'company');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE order_status AS ENUM ('draft','confirmed','processing','shipped','delivered','completed','cancelled','returned');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE payment_status AS ENUM ('unpaid','partial','paid','refunded');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE payment_method AS ENUM ('cash','card','bank_transfer','online','marketplace');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE payment_state AS ENUM ('pending','completed','failed','refunded');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
    """)

    # --- customers ---
    op.create_table(
        'customers',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', UUID(as_uuid=True),
                  sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('customer_type', sa.Text, nullable=False, server_default='individual'),
        sa.Column('tax_number', sa.String(50), nullable=True),
        sa.Column('address', sa.Text, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
    )
    # customer_type TEXT → ENUM cast (default əvvəl drop, sonra geri qoy)
    op.execute("ALTER TABLE customers ALTER COLUMN customer_type DROP DEFAULT")
    op.execute("ALTER TABLE customers ALTER COLUMN customer_type TYPE customer_type USING customer_type::customer_type")
    op.execute("ALTER TABLE customers ALTER COLUMN customer_type SET DEFAULT 'individual'::customer_type")
    op.create_index('ix_customers_tenant_id', 'customers', ['tenant_id'])
    op.create_index('ix_customers_email', 'customers', ['email'])

    # --- orders ---
    op.create_table(
        'orders',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', UUID(as_uuid=True),
                  sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('order_number', sa.String(100), nullable=False),
        sa.Column('customer_id', UUID(as_uuid=True),
                  sa.ForeignKey('customers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('warehouse_id', UUID(as_uuid=True),
                  sa.ForeignKey('warehouses.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('external_order_id', sa.String(255), nullable=True),
        sa.Column('status', sa.Text, nullable=False, server_default='draft'),
        sa.Column('payment_status', sa.Text, nullable=False, server_default='unpaid'),
        sa.Column('subtotal', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('discount_amount', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('tax_amount', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('total_amount', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('currency', sa.String(3), nullable=False, server_default='AZN'),
        sa.Column('shipping_address', sa.Text, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_by', UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('shipped_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
    )
    op.execute("ALTER TABLE orders ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status")
    op.execute("ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'draft'::order_status")
    op.execute("ALTER TABLE orders ALTER COLUMN payment_status DROP DEFAULT")
    op.execute("ALTER TABLE orders ALTER COLUMN payment_status TYPE payment_status USING payment_status::payment_status")
    op.execute("ALTER TABLE orders ALTER COLUMN payment_status SET DEFAULT 'unpaid'::payment_status")
    op.create_index('ix_orders_tenant_id', 'orders', ['tenant_id'])
    op.create_index('ix_orders_customer_id', 'orders', ['customer_id'])
    op.create_index('ix_orders_status', 'orders', ['status'])
    op.create_index('ix_orders_external_order_id', 'orders', ['external_order_id'])

    # --- order_items ---
    op.create_table(
        'order_items',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', UUID(as_uuid=True),
                  sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('order_id', UUID(as_uuid=True),
                  sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('variant_id', UUID(as_uuid=True),
                  sa.ForeignKey('product_variants.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('quantity', sa.Integer, nullable=False),
        sa.Column('unit_price', sa.Numeric(12, 2), nullable=False),
        sa.Column('cost_price', sa.Numeric(12, 2), nullable=True),
        sa.Column('discount_amount', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('line_total', sa.Numeric(12, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('ix_order_items_order_id', 'order_items', ['order_id'])
    op.create_index('ix_order_items_variant_id', 'order_items', ['variant_id'])

    # --- payments ---
    op.create_table(
        'payments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', UUID(as_uuid=True),
                  sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('order_id', UUID(as_uuid=True),
                  sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('payment_method', sa.Text, nullable=False),
        sa.Column('status', sa.Text, nullable=False, server_default='pending'),
        sa.Column('external_payment_id', sa.String(255), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
    )
    op.execute("ALTER TABLE payments ALTER COLUMN payment_method TYPE payment_method USING payment_method::payment_method")
    op.execute("ALTER TABLE payments ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE payments ALTER COLUMN status TYPE payment_state USING status::payment_state")
    op.execute("ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending'::payment_state")
    op.create_index('ix_payments_tenant_id', 'payments', ['tenant_id'])
    op.create_index('ix_payments_order_id', 'payments', ['order_id'])


def downgrade() -> None:
    op.drop_table('payments')
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('customers')

    op.execute("DROP TYPE IF EXISTS payment_state")
    op.execute("DROP TYPE IF EXISTS payment_method")
    op.execute("DROP TYPE IF EXISTS payment_status")
    op.execute("DROP TYPE IF EXISTS order_status")
    op.execute("DROP TYPE IF EXISTS customer_type")
