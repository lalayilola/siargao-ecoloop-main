-- Add hotel_restaurant to the application role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hotel_restaurant';
