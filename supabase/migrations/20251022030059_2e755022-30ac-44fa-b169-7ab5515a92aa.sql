-- Fix: Restrict profile visibility to owner only
-- This prevents unauthorized access to user email addresses

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);