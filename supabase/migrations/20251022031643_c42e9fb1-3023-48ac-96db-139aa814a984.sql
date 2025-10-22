-- Enable authenticated users to upload files to resources bucket

-- Allow authenticated users to upload files (organized by user_id)
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resources' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resources' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resources' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all files in resources bucket
CREATE POLICY "Public read access to resources"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resources');