-- Update handle_new_user function to handle municipality and super_admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.app_role;
  v_municipality public.municipality;
  v_meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  BEGIN
    v_role := (v_meta->>'role')::public.app_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'resident';
  END;
  IF v_role IS NULL THEN v_role := 'resident'; END IF;

  BEGIN
    v_municipality := (v_meta->>'municipality')::public.municipality;
  EXCEPTION WHEN OTHERS THEN
    v_municipality := 'general_luna';
  END;
  IF v_municipality IS NULL THEN v_municipality := 'general_luna'; END IF;

  INSERT INTO public.profiles (id, full_name, barangay, address, phone, primary_role, lgu_approved, municipality, is_super_admin)
  VALUES (
    NEW.id,
    COALESCE(v_meta->>'full_name', ''),
    COALESCE(v_meta->>'barangay', ''),
    COALESCE(v_meta->>'address', ''),
    COALESCE(v_meta->>'phone', ''),
    v_role,
    false,
    v_municipality,
    v_role = 'super_admin'
  );

  -- Assign non-admin role immediately. LGU requests stay pending until approval.
  IF v_role <> 'lgu_admin' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Also assign super_admin role immediately
  IF v_role = 'super_admin' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
