-- Create policies to allow LGU admins to view purchase and trade requests in their municipality

-- Drop existing policies if they already exist to avoid errors during local execution
DROP POLICY IF EXISTS "LGU admins can view trade requests for listings in their municipality" ON public.trade_requests;
DROP POLICY IF EXISTS "LGU admins can view purchase requests for listings in their municipality" ON public.purchase_requests;

-- Create policy for trade_requests
CREATE POLICY "LGU admins can view trade requests for listings in their municipality" ON public.trade_requests
  FOR SELECT USING (
    auth.uid() IN (
      SELECT admin_p.id FROM public.profiles admin_p
      JOIN public.marketplace_listings l ON l.id = listing_id
      WHERE admin_p.primary_role = 'lgu_admin'
        AND admin_p.municipality = l.municipality
    )
  );

-- Create policy for purchase_requests
CREATE POLICY "LGU admins can view purchase requests for listings in their municipality" ON public.purchase_requests
  FOR SELECT USING (
    auth.uid() IN (
      SELECT admin_p.id FROM public.profiles admin_p
      JOIN public.marketplace_listings l ON l.id = listing_id
      WHERE admin_p.primary_role = 'lgu_admin'
        AND admin_p.municipality = l.municipality
    )
  );
