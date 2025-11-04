-- Ensure authenticated role has proper access to storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Recreate upload policy with explicit checks
DROP POLICY IF EXISTS "Users can upload their own resources" ON storage.objects;
CREATE POLICY "Users can upload their own resources"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resources' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );