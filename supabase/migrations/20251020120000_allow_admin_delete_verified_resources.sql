-- Allow admins to delete approved (verified) resources
-- Run this migration to permit users with the 'admin' app_role to DELETE
-- rows in public.resources when they are verified (or change condition as needed).

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows admins to delete resources regardless of contributor
CREATE POLICY "Admins can delete resources"
  ON public.resources FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Note: This policy allows admins to delete any resource. If you'd like to
-- restrict deletes to only approved (verified) resources, replace the USING
-- clause with:
--   USING (public.has_role(auth.uid(), 'admin') AND verified = true);
