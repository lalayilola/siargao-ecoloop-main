-- Fix feed_reactions table schema cache issue
-- Add reaction_type column if it doesn't exist
ALTER TABLE public.feed_reactions 
ADD COLUMN IF NOT EXISTS reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'helpful', 'support'));

-- Update existing reactions to have default reaction_type if null
UPDATE public.feed_reactions SET reaction_type = 'like' WHERE reaction_type IS NULL;
