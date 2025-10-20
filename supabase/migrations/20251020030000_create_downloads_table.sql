-- Create downloads table to record each time a user downloads a resource
CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own download records
CREATE POLICY "Users can insert their own downloads"
ON public.downloads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own downloads (for personal history)
CREATE POLICY "Users can view their own downloads"
ON public.downloads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all downloads (optional)
CREATE POLICY "Admins can view all downloads"
ON public.downloads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON public.downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_resource_id ON public.downloads(resource_id);
