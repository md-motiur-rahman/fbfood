-- Add brand slug column to products, similar to category slug
-- Keep it nullable for backward compatibility; add index for lookup/filtering

ALTER TABLE `products`
  ADD COLUMN `brand` VARCHAR(100) NULL AFTER `category`,
  ADD KEY `idx_products_brand` (`brand`);
