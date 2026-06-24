-- Expand trade status values used by the app so purchase and trade approvals can be saved
ALTER TYPE public.trade_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE public.trade_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.trade_status ADD VALUE IF NOT EXISTS 'cancelled';
