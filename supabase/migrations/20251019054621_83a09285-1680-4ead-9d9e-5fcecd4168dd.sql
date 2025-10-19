-- Create storage bucket for resource uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true);

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own resources"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resources' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view uploaded resources
CREATE POLICY "Anyone can view uploaded resources"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'resources');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own resources"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resources' AND
  auth.uid()::text = (storage.foldername(name))[1]
);