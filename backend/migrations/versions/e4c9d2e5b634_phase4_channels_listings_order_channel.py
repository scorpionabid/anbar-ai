"""phase4_channels_listings_order_channel

Revision ID: e4c9d2e5b634
Revises: d3b8c1f4a523
Create Date: 2026-03-26 11:30:00.000000

Yeni cədvəllər:
- channels
- channel_listings

Mövcud cədvəl dəyişikliyi:
- orders.channel_id FK əlavəsi
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = 'e4c9d2e5b634'
down_revision = 'd3b8c1f4a523'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE channel_type AS ENUM ('store','marketplace','wholesale','api');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
    """)

    # --- channels ---
    op.create_table(
        'channels',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', UUID(as_uuid=True),
                  sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('channel_type', sa.Text, nullable=False, server_default='store'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('config', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
    )
    op.execute("ALTER TABLE channels ALTER COLUMN channel_type DROP DEFAULT")
    op.execute("ALTER TABLE channels ALTER COLUMN channel_type TYPE channel_type USING channel_type::channel_type")
    op.execute("ALTER TABLE channels ALTER COLUMN channel_type SET DEFAULT 'store'::channel_type")
    op.create_index('ix_channels_tenant_id', 'channels', ['tenant_id'])

    # --- channel_listings ---
    op.create_table(
        'channel_listings',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', UUID(as_uuid=True),
                  sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('channel_id', UUID(as_uuid=True),
                  sa.ForeignKey('channels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('variant_id', UUID(as_uuid=True),
                  sa.ForeignKey('product_variants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('external_sku', sa.String(100), nullable=True),
        sa.Column('external_product_id', sa.String(255), nullable=True),
        sa.Column('list_price', sa.Numeric(12, 2), nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('last_synced_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint('channel_id', 'variant_id', name='uq_channel_listing_channel_variant'),
    )
    op.create_index('ix_channel_listings_tenant_id', 'channel_listings', ['tenant_id'])
    op.create_index('ix_channel_listings_channel_id', 'channel_listings', ['channel_id'])
    op.create_index('ix_channel_listings_variant_id', 'channel_listings', ['variant_id'])

    # --- orders.channel_id əlavəsi ---
    op.add_column('orders',
        sa.Column('channel_id', UUID(as_uuid=True),
                  sa.ForeignKey('channels.id', ondelete='SET NULL'), nullable=True)
    )
    op.create_index('ix_orders_channel_id', 'orders', ['channel_id'])


def downgrade() -> None:
    op.drop_index('ix_orders_channel_id', 'orders')
    op.drop_column('orders', 'channel_id')
    op.drop_table('channel_listings')
    op.drop_table('channels')
    op.execute("DROP TYPE IF EXISTS channel_type")
