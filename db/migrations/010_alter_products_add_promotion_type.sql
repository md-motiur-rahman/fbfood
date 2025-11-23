-- Add promotion type to products so items can be flagged for Monthly or Seasonal promotions
-- Uses ENUM('MONTHLY','SEASONAL'), nullable to indicate no promotion by default

ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `promotion_type` ENUM('MONTHLY','SEASONAL') NULL AFTER `status`;

-- Index for filtering/sorting by promotion type
ALTER TABLE `products`
  ADD INDEX `idx_products_promotion_type` (`promotion_type`);
