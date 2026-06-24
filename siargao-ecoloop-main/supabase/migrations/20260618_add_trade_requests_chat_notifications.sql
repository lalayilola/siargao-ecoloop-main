-- Create tables for trade requests, purchase requests, conversations, messages, and notifications

-- Trade requests table (for barter requests)
CREATE TABLE public.trade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_role public.app_role NOT NULL,
  offered_item_id UUID NULL REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  offered_item_title TEXT NULL,
  message TEXT NOT NULL,
  status public.trade_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trade_requests TO anon, authenticated;
GRANT INSERT, UPDATE ON public.trade_requests TO authenticated;
GRANT ALL ON public.trade_requests TO service_role;
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trade requests are viewable by participants" ON public.trade_requests
  FOR SELECT USING (auth.uid() = requester_user_id OR auth.uid() IN (SELECT user_id FROM public.marketplace_listings WHERE id = listing_id));
CREATE POLICY "Users insert own trade requests" ON public.trade_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_user_id);
CREATE POLICY "Listing owners update trade requests" ON public.trade_requests
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.marketplace_listings WHERE id = listing_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM public.marketplace_listings WHERE id = listing_id));

-- Purchase requests table (for buy requests)
CREATE TABLE public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_role public.app_role NOT NULL,
  message TEXT NULL,
  status public.trade_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.purchase_requests TO anon, authenticated;
GRANT INSERT, UPDATE ON public.purchase_requests TO authenticated;
GRANT ALL ON public.purchase_requests TO service_role;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Purchase requests are viewable by participants" ON public.purchase_requests
  FOR SELECT USING (auth.uid() = buyer_user_id OR auth.uid() IN (SELECT user_id FROM public.marketplace_listings WHERE id = listing_id));
CREATE POLICY "Users insert own purchase requests" ON public.purchase_requests
  FOR INSERT WITH CHECK (auth.uid() = buyer_user_id);
CREATE POLICY "Listing owners update purchase requests" ON public.purchase_requests
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.marketplace_listings WHERE id = listing_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM public.marketplace_listings WHERE id = listing_id));

-- Conversations table (for chat/messenger)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_request_id UUID NULL REFERENCES public.trade_requests(id) ON DELETE CASCADE,
  purchase_request_id UUID NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  listing_id UUID NULL REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_conversation UNIQUE (trade_request_id, purchase_request_id)
);
GRANT SELECT ON public.conversations TO anon, authenticated;
GRANT INSERT ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversations are viewable by participants" ON public.conversations
  FOR SELECT USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);
CREATE POLICY "Users insert conversations as participant" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Messages table (for chat messages)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT NULL,
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.messages TO anon, authenticated;
GRANT INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by conversation participants" ON public.messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT participant_1_id FROM public.conversations WHERE id = conversation_id
      UNION
      SELECT participant_2_id FROM public.conversations WHERE id = conversation_id
    )
  );
CREATE POLICY "Users insert own messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users update own messages read status" ON public.messages
  FOR UPDATE USING (auth.uid() != sender_id) WITH CHECK (auth.uid() != sender_id);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT NULL,
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notifications TO anon, authenticated;
GRANT INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trade_requests_listing_id ON public.trade_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_requester_user_id ON public.trade_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON public.trade_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_listing_id ON public.purchase_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_buyer_user_id ON public.purchase_requests(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON public.purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1_id ON public.conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2_id ON public.conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_trade_request_id ON public.conversations(trade_request_id);
CREATE INDEX IF NOT EXISTS idx_conversations_purchase_request_id ON public.conversations(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);

-- Create triggers for updated_at
CREATE TRIGGER trade_requests_touch BEFORE UPDATE ON public.trade_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER purchase_requests_touch BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER conversations_touch BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
