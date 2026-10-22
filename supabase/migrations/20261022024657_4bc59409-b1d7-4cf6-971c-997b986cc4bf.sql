REVOKE EXECUTE ON FUNCTION public.active_offers() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.active_offers() TO service_role;