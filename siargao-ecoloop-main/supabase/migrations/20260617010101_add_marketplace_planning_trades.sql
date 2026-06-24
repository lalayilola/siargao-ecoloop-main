-- Create enums and tables for marketplace, planning, and trade features.
CREATE TYPE public.listing_kind AS ENUM ('produce', 'waste');
CREATE TYPE public.trade_status AS ENUM ('pending', 'approved', 'completed');

CREATE TABLE public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'farmer',
  author TEXT NOT NULL,
  barangay TEXT NOT NULL,
  body TEXT NOT NULL,
  image TEXT NULL,
  kg INTEGER NULL,
  price TEXT NULL,
  date TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feed_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.feed_posts TO authenticated;
GRANT ALL ON public.feed_posts TO service_role;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feed posts are viewable by anyone" ON public.feed_posts
  FOR SELECT USING (true);
CREATE POLICY "Users insert own feed posts" ON public.feed_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own feed posts" ON public.feed_posts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own feed posts" ON public.feed_posts
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind public.listing_kind NOT NULL DEFAULT 'produce',
  seller TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'farmer',
  barangay TEXT NOT NULL,
  kg INTEGER NOT NULL,
  price TEXT NULL,
  available_at TEXT NOT NULL DEFAULT 'Today',
  image TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marketplace_listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplace_listings TO authenticated;
GRANT ALL ON public.marketplace_listings TO service_role;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marketplace listings are viewable by anyone" ON public.marketplace_listings
  FOR SELECT USING (true);
CREATE POLICY "Users insert own marketplace listings" ON public.marketplace_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own marketplace listings" ON public.marketplace_listings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own marketplace listings" ON public.marketplace_listings
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.planning_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'farmer',
  author TEXT NOT NULL,
  need TEXT NOT NULL,
  "when" TEXT NOT NULL,
  kg INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.planning_entries TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.planning_entries TO authenticated;
GRANT ALL ON public.planning_entries TO service_role;
ALTER TABLE public.planning_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Planning entries are viewable by anyone" ON public.planning_entries
  FOR SELECT USING (true);
CREATE POLICY "Users insert own planning entries" ON public.planning_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own planning entries" ON public.planning_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own planning entries" ON public.planning_entries
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_role public.app_role NOT NULL DEFAULT 'farmer',
  from_name TEXT NOT NULL,
  from_gives TEXT NOT NULL,
  to_user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_role public.app_role NOT NULL DEFAULT 'resident',
  to_name TEXT NOT NULL,
  to_gives TEXT NOT NULL,
  status public.trade_status NOT NULL DEFAULT 'pending',
  trade_date TEXT NOT NULL DEFAULT 'Today',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trades TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades are viewable by anyone" ON public.trades
  FOR SELECT USING (true);
CREATE POLICY "Users insert own trades" ON public.trades
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users update own trades" ON public.trades
  FOR UPDATE USING (auth.uid() = from_user_id) WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users delete own trades" ON public.trades
  FOR DELETE USING (auth.uid() = from_user_id);

CREATE TRIGGER feed_posts_touch BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER marketplace_listings_touch BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER planning_entries_touch BEFORE UPDATE ON public.planning_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trades_touch BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
