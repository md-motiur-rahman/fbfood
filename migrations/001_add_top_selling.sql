-- Add is_top_selling column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_top_selling BOOLEAN DEFAULT FALSE;
-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_is_top_selling ON products(is_top_selling);
