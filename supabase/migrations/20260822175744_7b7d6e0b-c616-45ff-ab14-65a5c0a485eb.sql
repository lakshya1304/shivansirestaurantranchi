REVOKE SELECT ON public.restaurant_settings FROM authenticated;
GRANT SELECT (id, name, tagline, logo_url, banner_url, address, phone,
  opening_time, closing_time, tax_percent, packing_charge, delivery_charge,
  currency, theme) ON public.restaurant_settings TO authenticated;