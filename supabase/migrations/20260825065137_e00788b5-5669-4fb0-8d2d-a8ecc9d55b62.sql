CREATE POLICY "app config no client access"
ON public.app_config
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);