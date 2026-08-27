DROP POLICY IF EXISTS "settings public read" ON public.restaurant_settings;
REVOKE SELECT ON public.restaurant_settings FROM anon;

CREATE POLICY "settings admin read" ON public.restaurant_settings
FOR SELECT TO authenticated USING (is_admin());

CREATE OR REPLACE VIEW public.public_restaurant_settings
WITH (security_invoker = off) AS
SELECT id, name, tagline, logo_url, banner_url, address, phone,
       opening_time, closing_time, tax_percent, packing_charge,
       delivery_charge, currency, theme
FROM public.restaurant_settings;

GRANT SELECT ON public.public_restaurant_settings TO anon, authenticated;