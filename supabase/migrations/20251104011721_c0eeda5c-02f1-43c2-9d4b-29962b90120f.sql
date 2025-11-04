-- Ensure authenticated role can access auth schema functions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticated;

-- Drop and recreate the INSERT policy to ensure it's properly configured
DROP POLICY IF EXISTS "Users can insert their own resources" ON public.resources;

CREATE POLICY "Users can insert their own resources"
  ON public.resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = contributor_id
  );

-- Also ensure SELECT on profiles for the foreign key check
GRANT SELECT ON public.profiles TO authenticated;