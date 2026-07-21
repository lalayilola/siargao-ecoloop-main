-- Add RLS policy to allow users to update their own messages (for image_urls)
-- This is needed because the current update policy only allows updating messages you didn't send

CREATE POLICY "Users update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);
