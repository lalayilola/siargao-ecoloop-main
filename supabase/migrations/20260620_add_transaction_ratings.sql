-- Add transaction ratings table
-- This enables users to rate and review completed transactions

-- Create transaction_ratings table
CREATE TABLE IF NOT EXISTS transaction_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('trade', 'purchase')),
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(transaction_id, rater_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_ratings_transaction_id ON transaction_ratings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_ratings_rater_id ON transaction_ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_transaction_ratings_rated_user_id ON transaction_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_ratings_rating ON transaction_ratings(rating);

-- Enable Row Level Security
ALTER TABLE transaction_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transaction_ratings
CREATE POLICY "Anyone can view ratings"
  ON transaction_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create ratings"
  ON transaction_ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Users can update their own ratings"
  ON transaction_ratings FOR UPDATE
  USING (auth.uid() = rater_id);

CREATE POLICY "Users can delete their own ratings"
  ON transaction_ratings FOR DELETE
  USING (auth.uid() = rater_id);

-- Add average rating column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Create function to update user average rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the rated user's average rating and total ratings count
  UPDATE profiles
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM transaction_ratings
      WHERE rated_user_id = NEW.rated_user_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM transaction_ratings
      WHERE rated_user_id = NEW.rated_user_id
    )
  WHERE id = NEW.rated_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update user rating when a rating is inserted
CREATE TRIGGER update_user_rating_on_insert
  AFTER INSERT ON transaction_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();

-- Create trigger to update user rating when a rating is updated
CREATE TRIGGER update_user_rating_on_update
  AFTER UPDATE ON transaction_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();

-- Create trigger to update user rating when a rating is deleted
CREATE TRIGGER update_user_rating_on_delete
  AFTER DELETE ON transaction_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();
