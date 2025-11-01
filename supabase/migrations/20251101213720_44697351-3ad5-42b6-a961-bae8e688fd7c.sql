-- Drop and recreate the insert policy as explicitly PERMISSIVE
DROP POLICY IF EXISTS "Users can insert their own resources" ON public.resources;

-- Create PERMISSIVE policy allowing authenticated users to insert resources
CREATE POLICY "Users can insert their own resources"
  ON public.resources
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = contributor_id);