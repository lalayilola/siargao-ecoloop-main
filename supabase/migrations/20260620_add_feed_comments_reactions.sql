-- Add comments and reactions for feed posts
-- This enables social interaction features on EcoFeed posts

-- Create feed_comments table
CREATE TABLE IF NOT EXISTS feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feed_reactions table
CREATE TABLE IF NOT EXISTS feed_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'helpful', 'support')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feed_comments_post_id ON feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_user_id ON feed_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_created_at ON feed_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_post_id ON feed_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_user_id ON feed_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_type ON feed_reactions(reaction_type);

-- Enable Row Level Security
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feed_comments
CREATE POLICY "Anyone can view comments"
  ON feed_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON feed_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON feed_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON feed_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for feed_reactions
CREATE POLICY "Anyone can view reactions"
  ON feed_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reactions"
  ON feed_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
  ON feed_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON feed_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_feed_comments_updated_at
  BEFORE UPDATE ON feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
