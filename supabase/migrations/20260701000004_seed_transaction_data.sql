-- SQL Script to create missing tables, set up RLS policies, and seed real transaction data.
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/ientovkdqwiqqlphqgrr/sql/new

-- ==========================================
-- 1. Create missing tables if they don't exist
-- ==========================================

CREATE TABLE IF NOT EXISTS public.food_waste_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  waste_type TEXT NOT NULL,
  quantity_kg NUMERIC NOT NULL,
  collection_date DATE NOT NULL,
  collection_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'collected', 'processed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.waste_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waste_report_id UUID NOT NULL REFERENCES public.food_waste_reports(id) ON DELETE CASCADE,
  collector_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collector_name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 2. Configure RLS & Policies
-- ==========================================

ALTER TABLE public.food_waste_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_collections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplication errors
DROP POLICY IF EXISTS "Allow authenticated users select food_waste_reports" ON public.food_waste_reports;
DROP POLICY IF EXISTS "Allow authenticated users insert food_waste_reports" ON public.food_waste_reports;
DROP POLICY IF EXISTS "Allow LGU admins update food_waste_reports" ON public.food_waste_reports;
DROP POLICY IF EXISTS "Allow authenticated users select waste_collections" ON public.waste_collections;
DROP POLICY IF EXISTS "Allow LGU admins insert waste_collections" ON public.waste_collections;
DROP POLICY IF EXISTS "Allow LGU admins update waste_collections" ON public.waste_collections;

-- Create policies for food_waste_reports
CREATE POLICY "Allow authenticated users select food_waste_reports" ON public.food_waste_reports
  FOR SELECT TO authenticated USING (auth.uid() = restaurant_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND primary_role = 'lgu_admin'
  ));

CREATE POLICY "Allow authenticated users insert food_waste_reports" ON public.food_waste_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = restaurant_id);

CREATE POLICY "Allow LGU admins update food_waste_reports" ON public.food_waste_reports
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND primary_role = 'lgu_admin'
  ));

-- Create policies for waste_collections
CREATE POLICY "Allow authenticated users select waste_collections" ON public.waste_collections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow LGU admins insert waste_collections" ON public.waste_collections
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND primary_role = 'lgu_admin'
  ));

CREATE POLICY "Allow LGU admins update waste_collections" ON public.waste_collections
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND primary_role = 'lgu_admin'
  ));

-- ==========================================
-- 3. Add LGU Transaction SELECT Policies
-- ==========================================

DROP POLICY IF EXISTS "LGU admins can view trade requests for listings in their municipality" ON public.trade_requests;
DROP POLICY IF EXISTS "LGU admins can view purchase requests for listings in their municipality" ON public.purchase_requests;

CREATE POLICY "LGU admins can view trade requests for listings in their municipality" ON public.trade_requests
  FOR SELECT USING (
    auth.uid() IN (
      SELECT admin_p.id FROM public.profiles admin_p
      JOIN public.marketplace_listings l ON l.id = listing_id
      WHERE admin_p.primary_role = 'lgu_admin'
        AND admin_p.municipality = l.municipality
    )
  );

CREATE POLICY "LGU admins can view purchase requests for listings in their municipality" ON public.purchase_requests
  FOR SELECT USING (
    auth.uid() IN (
      SELECT admin_p.id FROM public.profiles admin_p
      JOIN public.marketplace_listings l ON l.id = listing_id
      WHERE admin_p.primary_role = 'lgu_admin'
        AND admin_p.municipality = l.municipality
    )
  );

-- ==========================================
-- 4. Seed Data for Transactions & Reports
-- ==========================================

-- Clean up existing mock records if any, to allow clean re-runs of this script
DELETE FROM public.purchase_requests WHERE buyer_name IN ('zozo11', 'Junuel', 'Elmo');
DELETE FROM public.food_waste_reports WHERE restaurant_name = 'Junuel';

-- Seed completed purchases for General Luna (claire is LGU Admin)
-- 1. Completed purchase request for Elmo's Eggplant (588421d4-9350-4025-bbe8-1aa79985d990) by resident zozo11
INSERT INTO public.purchase_requests (id, listing_id, buyer_user_id, buyer_name, buyer_role, message, quantity_kg, status, created_at, updated_at)
VALUES (
  'a7b4c6e8-2345-4b3f-a32b-36b07c890123',
  '588421d4-9350-4025-bbe8-1aa79985d990',
  'ec759eb2-94e0-4fd7-a17f-8b9bf507f7e7',
  'zozo11',
  'resident',
  'Interested to buy fresh eggplants!',
  15,
  'completed',
  now() - INTERVAL '2 days',
  now() - INTERVAL '2 days'
) ON CONFLICT DO NOTHING;

-- 2. Completed purchase request for Elmo's Gulay (78264bd1-8aaa-4940-8728-629eee5038b9) by restaurant Junuel
INSERT INTO public.purchase_requests (id, listing_id, buyer_user_id, buyer_name, buyer_role, message, quantity_kg, status, created_at, updated_at)
VALUES (
  'b8c5d7f9-3456-4c4f-b43c-47c18d9a1234',
  '78264bd1-8aaa-4940-8728-629eee5038b9',
  '2b8ee5b9-46ad-433d-9072-b3c61fe0758e',
  'Junuel',
  'restaurant',
  'Looking to buy fresh greens for the restaurant.',
  20,
  'completed',
  now() - INTERVAL '1 day',
  now() - INTERVAL '1 day'
) ON CONFLICT DO NOTHING;

-- 3. Completed purchase request for claire's Organic Fertilizer (a2046a34-9290-4d3a-acb6-19a2b1d4e18c) by farmer Elmo
INSERT INTO public.purchase_requests (id, listing_id, buyer_user_id, buyer_name, buyer_role, message, quantity_kg, status, created_at, updated_at)
VALUES (
  'c9d6e8f0-4567-4d5f-c54d-58d29eab2345',
  'a2046a34-9290-4d3a-acb6-19a2b1d4e18c',
  '51f3fde5-ba73-4edb-8a0f-b6244fc1f339',
  'Elmo',
  'farmer',
  'Need compost for my vegetable plot.',
  2,
  'completed',
  now() - INTERVAL '12 hours',
  now() - INTERVAL '12 hours'
) ON CONFLICT DO NOTHING;

-- Seed completed purchases for Dapa (DAPA LGU is Admin)
-- 4. Completed purchase request for Louie's Chilis (73adc646-a98a-45fc-8a42-5d229ee6c3d5) by resident zozo11
INSERT INTO public.purchase_requests (id, listing_id, buyer_user_id, buyer_name, buyer_role, message, quantity_kg, status, created_at, updated_at)
VALUES (
  'd0e7f9a1-5678-4e6f-d65e-69e30fbc3456',
  '73adc646-a98a-45fc-8a42-5d229ee6c3d5',
  'ec759eb2-94e0-4fd7-a17f-8b9bf507f7e7',
  'zozo11',
  'resident',
  'Buying some spicy chilis!',
  3,
  'completed',
  now() - INTERVAL '3 days',
  now() - INTERVAL '3 days'
) ON CONFLICT DO NOTHING;

-- Seed food waste reports for General Luna
INSERT INTO public.food_waste_reports (id, restaurant_id, restaurant_name, waste_type, quantity_kg, collection_date, collection_address, status, created_at, updated_at)
VALUES 
(
  'e1f8a0b2-6789-4f7f-e76f-7af41fcd4567',
  '2b8ee5b9-46ad-433d-9072-b3c61fe0758e',
  'Junuel',
  'Vegetable peels and food scraps',
  25.0,
  CURRENT_DATE - 2,
  'General Luna, Siargao',
  'collected',
  now() - INTERVAL '2 days',
  now() - INTERVAL '2 days'
),
(
  'f2d9b1c3-7890-4f8f-f87a-8ba52fde5678',
  '2b8ee5b9-46ad-433d-9072-b3c61fe0758e',
  'Junuel',
  'Kitchen prep waste',
  35.0,
  CURRENT_DATE - 1,
  'General Luna, Siargao',
  'processed',
  now() - INTERVAL '1 day',
  now() - INTERVAL '1 day'
) ON CONFLICT DO NOTHING;
