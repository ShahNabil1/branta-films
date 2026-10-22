ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare _phone text := new.raw_user_meta_data->>'phone';
begin
  if _phone is not null and _phone !~ '^01[3-9][0-9]{8}$' then _phone := null; end if;
  insert into public.profiles (id, full_name, email, avatar_url, phone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', ''), ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    _phone
  )
  on conflict (id) do nothing;
  return new;
end $function$;
CREATE OR REPLACE FUNCTION public.validate_profile_phone() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^01[3-9][0-9]{8}$' THEN RAISE EXCEPTION 'Invalid Bangladeshi mobile number'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS profiles_validate_phone ON public.profiles;
CREATE TRIGGER profiles_validate_phone BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_profile_phone();