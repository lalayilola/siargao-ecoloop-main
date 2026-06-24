ALTER TABLE public.purchase_requests
ADD COLUMN IF NOT EXISTS quantity_kg NUMERIC(10,2) DEFAULT 1;

COMMENT ON COLUMN public.purchase_requests.quantity_kg IS 'Requested quantity in kilograms for the purchase request';
