-- Alter products to add brand reference to brands table
-- Adds nullable foreign key brand_id referencing brands(id)
-- Keeps existing fields intact (e.g., category) for backward compatibility

ALTER TABLE `products`
  ADD COLUMN `brand_id` BIGINT UNSIGNED NULL AFTER `category`,
  ADD KEY `idx_products_brand_id` (`brand_id`),
  ADD CONSTRAINT `fk_products_brand_id`
    FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`)
    ON UPDATE CASCADE ON DELETE SET NULL;
