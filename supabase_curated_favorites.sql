-- =============================================================================
-- Add curated favorites support to products
-- =============================================================================
-- Run this once in the Supabase SQL editor (Project → SQL → New query).
-- Idempotent — safe to re-run.

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured    BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_featured
  ON products (is_featured, featured_order);
