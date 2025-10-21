-- Create downloads table to track resource downloads
CREATE TABLE IF NOT EXISTS public.downloads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_downloads_resource_id ON public.downloads(resource_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON public.downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_created_at ON public.downloads(created_at DESC);

-- Enable RLS
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own downloads
CREATE POLICY "Users can record their own downloads"
  ON public.downloads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own download history
CREATE POLICY "Users can view their own downloads"
  ON public.downloads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins to view all downloads
CREATE POLICY "Admins can view all downloads"
  ON public.downloads
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create a function to get download count for a resource
CREATE OR REPLACE FUNCTION public.get_download_count(resource_uuid uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*) FROM public.downloads WHERE resource_id = resource_uuid;
$$;