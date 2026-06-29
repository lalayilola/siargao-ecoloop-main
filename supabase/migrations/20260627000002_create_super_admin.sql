-- Create Super Admin account
-- Email: siargaoadmin@gmail.com
-- Password: Ecoloopsiargao2026
-- 
-- INSTRUCTIONS:
-- 1. First, sign up for an account at /auth with email: siargaoadmin@gmail.com and password: Ecoloopsiargao2026
-- 2. Select any municipality (e.g., General Luna)
-- 3. Select "LGU Admin" as the role
-- 4. After signing up, run this SQL to upgrade the account to Super Admin

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user ID by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'siargaoadmin@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please sign up first at /auth with email siargaoadmin@gmail.com';
  END IF;
  
  -- Update profile to be super admin
  UPDATE public.profiles
  SET 
    is_super_admin = true,
    primary_role = 'super_admin',
    lgu_approved = true,
    full_name = 'Super Admin'
  WHERE id = v_user_id;
    
  -- Assign super_admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Super Admin account created successfully for siargaoadmin@gmail.com';
END $$;
