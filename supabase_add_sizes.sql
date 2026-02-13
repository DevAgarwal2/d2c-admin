-- ============================================
-- MIGRATION: Add Size Support to Products
-- ============================================

-- Step 1: Add new columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS has_sizes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS size_variants JSONB DEFAULT '[]';

-- Step 2: Mark products that currently have sizes in their names
UPDATE products 
SET has_sizes = true 
WHERE title ~* '\((Small|Medium|Big)\)'
   OR title ~* '^(Small|Medium|Big)\s'
   OR title ~* '(Small|Medium|Big)\s+(Box|Grinder|Bucket|Planter|Chari|Door|Dhoopdani|Bird Box)'
   OR title ~* '(Small|Medium|Big)\s*$';

-- Step 3: Create a view to help identify products that need merging
CREATE OR REPLACE VIEW products_needing_merge AS
WITH sized_products AS (
  SELECT 
    id,
    title,
    price,
    in_stock,
    image_url,
    CASE 
      WHEN title ~* 'Small' THEN 'Small'
      WHEN title ~* 'Medium' THEN 'Medium'
      WHEN title ~* 'Big' THEN 'Big'
      WHEN title ~* 'Large' THEN 'Large'
    END as size_name,
    -- Extract base name by removing size indicators
    TRIM(REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(title, '\s*\(?Small\)?\s*$', '', 'i'),
          '\s*\(?Medium\)?\s*$', '', 'i'
        ),
        '\s*\(?Big\)?\s*$', '', 'i'
      ),
      '\s*\(?Large\)?\s*$', '', 'i'
    )) as base_name
  FROM products
  WHERE has_sizes = true
)
SELECT 
  base_name,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'id', id,
      'title', title,
      'price', price,
      'in_stock', in_stock,
      'size_name', size_name,
      'image_url', image_url
    )
  ) as variants,
  COUNT(*) as variant_count
FROM sized_products
GROUP BY base_name
HAVING COUNT(*) > 1
ORDER BY base_name;

-- ============================================
-- MANUAL MERGE INSTRUCTIONS:
-- ============================================
-- After running this migration:
-- 1. Check products_needing_merge view to see which products need merging
-- 2. For each base_name group:
--    - Create ONE product with has_sizes=true
--    - Set size_variants to array of all size options with prices
--    - Delete the old separate products
--
-- Example size_variants JSON:
-- [
--   {"size": "Small", "price": 1550, "in_stock": true},
--   {"size": "Medium", "price": 1850, "in_stock": true},
--   {"size": "Big", "price": 2250, "in_stock": true}
-- ]
-- ============================================
