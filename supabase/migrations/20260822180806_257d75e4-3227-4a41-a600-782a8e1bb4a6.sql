CREATE UNIQUE INDEX IF NOT EXISTS user_roles_single_admin_idx
  ON public.user_roles ((role))
  WHERE role = 'admin';