"""extend channel_type enum with new marketplace values

Revision ID: f5d0e3f6c745
Revises: e4c9d2e5b634
Create Date: 2026-03-28 00:00:00.000000

Kontekst:
  e4c9d2e5b634 migrasiyasında channel_type ENUM yalnız 4 dəyər ilə yaradılmışdı:
    store, marketplace, wholesale, api
  Python domain modelindəki ChannelType enum isə 11 dəyər ehtiva edir.
  Bu migrasiya çatışmayan 7 dəyəri PostgreSQL ENUM tipinə əlavə edir.
"""
from alembic import op


revision = 'f5d0e3f6c745'
down_revision = 'e4c9d2e5b634'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL ENUM-a yeni dəyər əlavəsi üçün ALTER TYPE ... ADD VALUE istifadə edilir.
    # IF NOT EXISTS (PostgreSQL 9.3+) — idempotent icra üçün əlavə edilib.
    op.execute("ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'manual'")
    op.execute("ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'shopify'")
    op.execute("ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'woocommerce'")
    op.execute("ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'trendyol'")
    op.execute("ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'amazon'")
    op.execute("ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'ebay'")
    op.execute("ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'custom'")


def downgrade() -> None:
    # PostgreSQL ENUM tipindən dəyər silmək mümkün deyil.
    # Tam rollback üçün aşağıdakı addımlar lazımdır (manual):
    #   1. channels.channel_type sütununu TEXT-ə çevir
    #   2. DROP TYPE channel_type
    #   3. Yalnız 4 köhnə dəyərlə yeni ENUM yarat: store, marketplace, wholesale, api
    #   4. Sütunu yenidən ENUM-a çevir
    # Bu proses production-da data itkisi riskini artırır, buna görə
    # downgrade burda icra edilmir.
    pass
