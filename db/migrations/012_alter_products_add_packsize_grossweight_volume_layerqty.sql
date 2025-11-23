-- Migration: Add pack_size, gross_weight, volume, layer_qty to products
-- Description: Adds nullable columns to products table for packaging and logistics metadata

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS pack_size TEXT,
  ADD COLUMN IF NOT EXISTS gross_weight TEXT,
  ADD COLUMN IF NOT EXISTS volume NUMERIC,
  ADD COLUMN IF NOT EXISTS layer_qty NUMERIC;
