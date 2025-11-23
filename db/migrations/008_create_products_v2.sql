-- Full products table schema (v2) using brand as slug (string)
-- This script creates the products table with the desired columns and indexes.
-- CAUTION: If you already have a `products` table with data, dropping it will delete all data.
--          Use this script for a fresh table or adapt it to your migration strategy.

-- DROP TABLE IF EXISTS `products`; -- Uncomment if you want to drop and recreate

CREATE TABLE IF NOT EXISTS `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `productname` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,           -- category slug
  `brand` VARCHAR(100) NULL,                   -- brand slug (string)
  `outerbarcode` VARCHAR(32) NOT NULL,
  `caseSize` INT UNSIGNED NOT NULL,
  `palletSize` INT UNSIGNED NOT NULL,
  `picture` VARCHAR(2048) NOT NULL,           -- URL or local public path
  `picture_key` VARCHAR(512) NULL,            -- optional object storage key/path
  `mime_type` VARCHAR(100) NULL,
  `size_bytes` BIGINT UNSIGNED NULL,
  `width` SMALLINT UNSIGNED NULL,
  `height` SMALLINT UNSIGNED NULL,
  `itemquery` INT UNSIGNED NOT NULL,
  `status` ENUM('AVAILABLE','UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_outerbarcode` (`outerbarcode`),
  KEY `idx_products_productname` (`productname`),
  KEY `idx_products_category` (`category`),
  KEY `idx_products_brand` (`brand`),
  KEY `idx_products_itemquery` (`itemquery`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_category_itemquery` (`category`, `itemquery`),
  KEY `idx_products_brand_itemquery` (`brand`, `itemquery`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
