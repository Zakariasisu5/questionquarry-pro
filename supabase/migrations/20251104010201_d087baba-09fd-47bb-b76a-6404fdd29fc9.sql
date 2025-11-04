
-- Revoke any existing problematic grants first
REVOKE ALL ON public.resources FROM authenticated;

-- Grant necessary permissions to authenticated users on resources table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;

-- Grant usage and select on all sequences in public schema (needed for serial/uuid generation)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure the policy is correctly set
DROP POLICY IF EXISTS "Users can insert their own resources" ON public.resources;
CREATE POLICY "Users can insert their own resources"
  ON public.resources
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = contributor_id);
