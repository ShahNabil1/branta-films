ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_to text;
UPDATE public.payment_settings SET bkash='01790736863', nagad='01790736863', rocket='';