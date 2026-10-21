DO $$
DECLARE owner_id uuid;
BEGIN
  SELECT id INTO owner_id FROM auth.users WHERE lower(email) = 'shahriarnabil94@gmail.com';
  IF owner_id IS NULL THEN RAISE EXCEPTION 'No existing account found for the requested owner email'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (owner_id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
END $$;