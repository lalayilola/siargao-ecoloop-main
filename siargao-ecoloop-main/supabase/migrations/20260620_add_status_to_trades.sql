-- Add status column to trades table if it doesn't exist
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS status public.trade_status NOT NULL DEFAULT 'pending';

-- Create the trade_status enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.trade_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing trades to have pending status if status is null
UPDATE public.trades SET status = 'pending' WHERE status IS NULL;
