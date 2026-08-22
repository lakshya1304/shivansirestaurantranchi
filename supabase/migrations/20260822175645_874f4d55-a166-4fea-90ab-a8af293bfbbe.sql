ALTER VIEW public.public_restaurant_settings SET (security_invoker = on);

GRANT SELECT (id, name, tagline, logo_url, banner_url, address, phone,
  opening_time, closing_time, tax_percent, packing_charge, delivery_charge,
  currency, theme) ON public.restaurant_settings TO anon, authenticated;

CREATE POLICY "settings public display read" ON public.restaurant_settings
FOR SELECT TO anon, authenticated USING (true);