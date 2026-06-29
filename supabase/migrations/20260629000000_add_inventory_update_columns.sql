-- Add quantity_kg column to trade_requests for barter transactions
ALTER TABLE public.trade_requests
ADD COLUMN IF NOT EXISTS quantity_kg NUMERIC(10,2) DEFAULT 1;

COMMENT ON COLUMN public.trade_requests.quantity_kg IS 'Quantity in kilograms for the trade request';

-- Add listing_status field to marketplace_listings to track sold out listings
ALTER TABLE public.marketplace_listings
ADD COLUMN IF NOT EXISTS listing_status TEXT DEFAULT 'available' CHECK (listing_status IN ('available', 'sold_out'));

COMMENT ON COLUMN public.marketplace_listings.listing_status IS 'Status of the listing: available or sold_out';
