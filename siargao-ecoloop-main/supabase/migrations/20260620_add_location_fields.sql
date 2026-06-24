-- Add location fields to feed_posts and marketplace_listings tables
-- This enables location-based functionality for both EcoFeed and Marketplace

-- Add location fields to feed_posts table
ALTER TABLE feed_posts 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Add location fields to marketplace_listings table
ALTER TABLE marketplace_listings
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Create indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_feed_posts_location ON feed_posts(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_location ON marketplace_listings(latitude, longitude);
