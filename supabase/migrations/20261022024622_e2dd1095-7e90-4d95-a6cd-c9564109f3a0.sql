ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS price_bdt integer CHECK (price_bdt IS NULL OR price_bdt >= 0);

CREATE TABLE public.episode_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  episode_id uuid NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'manual_payment',
  order_id uuid,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, episode_id)
);
GRANT SELECT ON public.episode_unlocks TO authenticated;
GRANT ALL ON public.episode_unlocks TO service_role;
ALTER TABLE public.episode_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own episode unlocks or staff" ON public.episode_unlocks FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Restrict episode unlock access" ON public.episode_unlocks AS RESTRICTIVE FOR ALL TO authenticated USING (private.account_access_allowed()) WITH CHECK (private.account_access_allowed());

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9]{3,24}$'),
  name text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','flat')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  cap_amount numeric CHECK (cap_amount IS NULL OR cap_amount > 0),
  min_spend numeric NOT NULL DEFAULT 0 CHECK (min_spend >= 0),
  max_uses_total integer CHECK (max_uses_total IS NULL OR max_uses_total > 0),
  max_uses_per_customer integer CHECK (max_uses_per_customer IS NULL OR max_uses_per_customer > 0),
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','series','episodes')),
  auto_apply boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (discount_type <> 'percent' OR discount_value <= 100),
  CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at),
  CHECK (NOT auto_apply OR applies_to <> 'all')
);
CREATE TABLE public.coupon_targets (
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('series','episode')),
  target_id uuid NOT NULL,
  PRIMARY KEY (coupon_id, target_type, target_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons, public.coupon_targets TO authenticated;
GRANT ALL ON public.coupons, public.coupon_targets TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage coupon targets" ON public.coupon_targets FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER coupons_touch BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  subtotal_bdt integer NOT NULL CHECK (subtotal_bdt >= 0),
  discount_bdt integer NOT NULL DEFAULT 0 CHECK (discount_bdt >= 0),
  total_bdt integer NOT NULL CHECK (total_bdt >= 0),
  coupon_code text,
  method text NOT NULL CHECK (method IN ('bkash','nagad','rocket')),
  sender_phone text NOT NULL,
  trx_id text NOT NULL,
  reject_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (method, trx_id)
);
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('series','episode')),
  item_id uuid NOT NULL,
  title text NOT NULL,
  unit_price_bdt integer NOT NULL,
  discount_bdt integer NOT NULL DEFAULT 0,
  final_price_bdt integer NOT NULL,
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
CREATE INDEX order_items_coupon_idx ON public.order_items(coupon_id);
GRANT SELECT ON public.orders, public.order_items TO authenticated;
GRANT ALL ON public.orders, public.order_items TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own orders or staff" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Read own order items or staff" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE POLICY "Restrict order access" ON public.orders AS RESTRICTIVE FOR ALL TO authenticated USING (private.account_access_allowed()) WITH CHECK (private.account_access_allowed());
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.payment_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  bkash text NOT NULL DEFAULT '',
  nagad text NOT NULL DEFAULT '',
  rocket text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT 'Send Money to the number below, then enter your number and Transaction ID.',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.payment_settings (id) VALUES (true) ON CONFLICT DO NOTHING;
GRANT SELECT, UPDATE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read payment numbers" ON public.payment_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins update payment numbers" ON public.payment_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_key text CHECK (image_key IS NULL OR image_key LIKE 'images/popups/%'),
  alt text NOT NULL DEFAULT '',
  action_type text NOT NULL DEFAULT 'none' CHECK (action_type IN ('none','url','series','episode')),
  action_url text,
  action_target uuid,
  placement text NOT NULL DEFAULT 'site' CHECK (placement IN ('site','dashboard','everywhere')),
  delay_seconds integer NOT NULL DEFAULT 5 CHECK (delay_seconds BETWEEN 0 AND 600),
  frequency text NOT NULL DEFAULT 'session' CHECK (frequency IN ('session','once','every_visit')),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at)
);
GRANT SELECT ON public.popups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.popups TO authenticated;
GRANT ALL ON public.popups TO service_role;
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active popups are public" ON public.popups FOR SELECT TO anon, authenticated USING ((is_active AND image_key IS NOT NULL) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert popups" ON public.popups FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update popups" ON public.popups FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete popups" ON public.popups FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER popups_touch BEFORE UPDATE ON public.popups FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Number of non-rejected orders that used a coupon (total or for one viewer).
CREATE OR REPLACE FUNCTION public.coupon_use_count(_coupon uuid, _user uuid DEFAULT NULL)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(DISTINCT o.id)::int FROM public.order_items i JOIN public.orders o ON o.id = i.order_id
  WHERE i.coupon_id = _coupon AND o.status <> 'rejected' AND (_user IS NULL OR o.user_id = _user)
$$;
REVOKE EXECUTE ON FUNCTION public.coupon_use_count(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.coupon_use_count(uuid, uuid) TO service_role;

-- Public auto-apply offers: only the fields needed to show sale prices.
CREATE OR REPLACE FUNCTION public.active_offers()
RETURNS TABLE (coupon_id uuid, code text, name text, discount_type text, discount_value numeric, cap_amount numeric, target_type text, target_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.code, c.name, c.discount_type, c.discount_value, c.cap_amount, t.target_type, t.target_id
  FROM public.coupons c JOIN public.coupon_targets t ON t.coupon_id = c.id
  WHERE c.auto_apply AND c.is_active AND c.deleted_at IS NULL AND c.min_spend = 0
    AND (c.starts_at IS NULL OR c.starts_at <= now()) AND (c.ends_at IS NULL OR c.ends_at > now())
    AND (c.max_uses_total IS NULL OR public.coupon_use_count(c.id) < c.max_uses_total)
$$;
GRANT EXECUTE ON FUNCTION public.active_offers() TO anon, authenticated, service_role;

-- Move existing series discounted prices into auto-apply coupons.
DO $$
DECLARE s record; cid uuid;
BEGIN
  FOR s IN SELECT id, slug, title, price_bdt, discount_price_bdt FROM public.series WHERE discount_price_bdt IS NOT NULL AND discount_price_bdt < price_bdt LOOP
    INSERT INTO public.coupons (code, name, discount_type, discount_value, applies_to, auto_apply)
    VALUES (left('SALE' || upper(regexp_replace(s.slug, '[^a-zA-Z0-9]', '', 'g')), 20) || substr(md5(s.id::text), 1, 4), s.title || ' offer', 'flat', s.price_bdt - s.discount_price_bdt, 'series', true)
    RETURNING id INTO cid;
    INSERT INTO public.coupon_targets VALUES (cid, 'series', s.id);
  END LOOP;
END $$;
ALTER TABLE public.series DROP CONSTRAINT IF EXISTS series_discount_below_price;
ALTER TABLE public.series DROP COLUMN IF EXISTS discount_price_bdt;