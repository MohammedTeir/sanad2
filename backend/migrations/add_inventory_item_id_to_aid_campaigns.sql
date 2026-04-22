-- Migration: Add inventory_item_id to aid_campaigns table
-- This links aid campaigns to specific inventory items for better tracking

-- Add inventory_item_id column to aid_campaigns table
ALTER TABLE aid_campaigns ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL;

-- Add index for faster joins and lookups
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_inventory_item_id ON aid_campaigns(inventory_item_id);

-- Add comment
COMMENT ON COLUMN aid_campaigns.inventory_item_id IS 'The inventory item linked to this campaign (NULL if not specified)';
