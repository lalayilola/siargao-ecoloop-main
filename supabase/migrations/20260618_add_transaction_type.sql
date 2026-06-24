-- Add transaction type enum and enhance marketplace listings for circular economy
CREATE TYPE public.transaction_type AS ENUM ('sell_only', 'barter_only', 'sell_and_barter');

-- Update trade_status enum to include more statuses
DROP TYPE IF EXISTS public.trade_status CASCADE;
CREATE TYPE public.trade_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');

-- Add transaction type and acceptable exchanges to marketplace_listings
ALTER TABLE public.marketplace_listings
ADD COLUMN IF NOT EXISTS transaction_type public.transaction_type NOT NULL DEFAULT 'sell_and_barter',
ADD COLUMN IF NOT EXISTS acceptable_exchanges TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Update existing listings to have default transaction type
UPDATE public.marketplace_listings
SET transaction_type = 'sell_and_barter'
WHERE transaction_type IS NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_transaction_type ON public.marketplace_listings(transaction_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON public.marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_role ON public.marketplace_listings(role);
