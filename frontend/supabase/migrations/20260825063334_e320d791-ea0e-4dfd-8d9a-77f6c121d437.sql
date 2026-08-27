ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.phone_verifications FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.phone_verifications TO service_role;

DROP POLICY IF EXISTS "phone_verifications deny all clients" ON public.phone_verifications;
CREATE POLICY "phone_verifications deny all clients"
ON public.phone_verifications
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);