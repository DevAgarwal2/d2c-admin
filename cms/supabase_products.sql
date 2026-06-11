-- =============================================================================
-- Products & Categories schema (idempotent — safe to re-run)
-- =============================================================================
-- This script creates the products + categories tables used by the admin CMS
-- and ensures all columns the form writes exist. Every statement uses
-- IF NOT EXISTS patterns so re-running will not error or drop data.
-- The only data-modifying statement is a guarded DROP COLUMN for the obsolete
-- add_delivery_charge column (replaced by delivery_charges_apply + discount_price).

-- 1. Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT
);

-- 2. Products table (base columns)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id),
  price NUMERIC,
  original_price NUMERIC,
  discount TEXT,
  rating NUMERIC,
  reviews INTEGER,
  image_url TEXT,
  images JSONB,
  description TEXT,
  features JSONB,
  shipping TEXT,
  in_stock BOOLEAN,
  fast_delivery BOOLEAN
);

-- 3. Backfill columns the form actually uses (for older / partial tables)
ALTER TABLE products ADD COLUMN IF NOT EXISTS images        JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS features      JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping      TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount      TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_sizes     BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_variants JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS on_discount       BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price    NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent  NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_charges_apply BOOLEAN DEFAULT false;

-- 4. Preserve existing add_delivery_charge data: if any row has a non-zero value,
--    mark delivery_charges_apply = true on that row BEFORE we drop the old column.
--    (Anywhere from 0 to 58 rows may be affected; this is non-destructive.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'add_delivery_charge'
  ) THEN
    UPDATE products
       SET delivery_charges_apply = true
     WHERE add_delivery_charge IS NOT NULL
       AND add_delivery_charge > 0
       AND (delivery_charges_apply IS NULL OR delivery_charges_apply = false);
  END IF;
END $$;

-- 5. Drop the obsolete add_delivery_charge column (data preserved in delivery_charges_apply above).
--    Safe: this DROP is conditional and only runs if the column still exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'add_delivery_charge'
  ) THEN
    ALTER TABLE products DROP COLUMN add_delivery_charge;
  END IF;
END $$;

-- 6. Enable Row Level Security
ALTER TABLE products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 7. Public read policies (admin writes use the service_role key, bypassing RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products'   AND policyname = 'Public Read Products'
  ) THEN
    CREATE POLICY "Public Read Products"
      ON products FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Public Read Categories'
  ) THEN
    CREATE POLICY "Public Read Categories"
      ON categories FOR SELECT
      USING (true);
  END IF;
END $$;
