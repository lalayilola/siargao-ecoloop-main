-- Add municipality enum
CREATE TYPE public.municipality AS ENUM (
  'burgos',
  'dapa',
  'general_luna',
  'pilar',
  'san_benito',
  'san_isidro',
  'santa_monica',
  'socorro',
  'del_carmen'
);

-- Add municipality to profiles table
ALTER TABLE public.profiles 
ADD COLUMN municipality public.municipality NOT NULL DEFAULT 'general_luna';

-- Add municipality to marketplace_listings table
ALTER TABLE public.marketplace_listings 
ADD COLUMN municipality public.municipality NOT NULL DEFAULT 'general_luna';

-- Add super_admin role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Update profiles to add is_super_admin field
ALTER TABLE public.profiles 
ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT false;

-- Add index on municipality for faster queries
CREATE INDEX idx_profiles_municipality ON public.profiles(municipality);
CREATE INDEX idx_marketplace_listings_municipality ON public.marketplace_listings(municipality);
