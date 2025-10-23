-- Ensure the policy for inserting resources exists and is correct
-- Drop existing policy if it exists to recreate it fresh
DROP POLICY IF EXISTS "Users can insert their own resources" ON public.resources;

-- Create policy allowing authenticated users to insert resources
CREATE POLICY "Users can insert their own resources"
  ON public.resources
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = contributor_id);