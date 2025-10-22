-- Fix: Restrict user_roles visibility to own roles only
-- This prevents unauthorized users from seeing who has admin/moderator privileges

DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);