-- Migration: Create products table (v3)
-- Description: Redesigned products table using slugs for brand/category and text fields for caseSize, gross_weight, volume.

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  productname VARCHAR(255) NOT NULL,
  brand VARCHAR(191) NOT NULL,      -- slug from brands table
  category VARCHAR(191) NOT NULL,   -- slug from categories table
  picture VARCHAR(512) NULL,

  caseSize VARCHAR(64) NOT NULL,    -- stored as text per requirement
  barcode VARCHAR(64) NOT NULL,     -- unique identifier for item (EAN/UPC)
  gross_weight VARCHAR(64) NULL,    -- stored as text per requirement
  volume VARCHAR(64) NULL,          -- stored as text per requirement

  palletQty INT NULL,
  layerQty INT NULL,

  status ENUM('AVAILABLE','UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
  promotion_type ENUM('MONTHLY','SEASONAL') NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_barcode (barcode),
  KEY idx_brand (brand),
  KEY idx_category (category),
  KEY idx_status (status),
  KEY idx_promotion_type (promotion_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
