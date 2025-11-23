-- Products table schema matching app/data/inventory.ts InventoryProduct fields
-- Fields: productname, category, outerbarcode, caseSize, palletSize, picture, itemquery
-- Plus: id, created_at, updated_at, indexes

CREATE TABLE IF NOT EXISTS `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `productname` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `outerbarcode` VARCHAR(32) NOT NULL,
  `caseSize` INT UNSIGNED NOT NULL,
  `palletSize` INT UNSIGNED NOT NULL,
  `picture` VARCHAR(2048) NOT NULL, -- store URL to object storage or CDN
  `picture_key` VARCHAR(512) NULL,  -- optional object storage key/path
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
  KEY `idx_products_itemquery` (`itemquery`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_category_itemquery` (`category`, `itemquery`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;