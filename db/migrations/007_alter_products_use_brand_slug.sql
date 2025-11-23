-- Redesign products to use brand slug (string) instead of brand_id FK
-- Assumes migration 005 added brand_id and migration 006 added brand slug (optional)
-- This migration removes brand_id and ensures brand slug + indexes exist.

-- 1) Drop FK and index on brand_id if present
ALTER TABLE `products`
  DROP FOREIGN KEY `fk_products_brand_id`;

ALTER TABLE `products`
  DROP INDEX `idx_products_brand_id`;

-- 2) Drop the brand_id column
ALTER TABLE `products`
  DROP COLUMN `brand_id`;

-- 3) Ensure brand slug column exists (nullable for backward compatibility)
ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `brand` VARCHAR(100) NULL AFTER `category`;

-- 4) Index on brand slug for filtering/sorting was added in migration 006.
--    Skipping re-creation here to avoid duplicate key errors.

-- 5) (Optional) Composite index to speed queries by brand + itemquery
ALTER TABLE `products`
  ADD INDEX `idx_products_brand_itemquery` (`brand`, `itemquery`);
