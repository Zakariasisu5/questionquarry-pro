If authenticated users' inserts into `public.resources` are blocked by Row-Level Security (RLS), run the following in the Supabase SQL editor (Project → SQL).

-- Ensure RLS is enabled on the table (migrations here already enable it):
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert resources where they are the contributor
CREATE POLICY "Allow authenticated users to insert their own resources"
  ON public.resources
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = contributor_id);

-- Allow users to delete their own unverified resources (example)
CREATE POLICY "Allow delete of own unverified resources"
  ON public.resources
  FOR DELETE
  TO authenticated
  USING (auth.uid() = contributor_id AND verified = false);

Notes:
- The `contributor_id` column references `public.profiles(id)`. Ensure the user's `profiles` row exists (the project creates a profile automatically via a trigger on `auth.users` at signup).
- If you still see issues, check existing policies:
  SELECT polname, polcmd, polqual, polwithcheck FROM pg_policy WHERE polrelid = 'resources'::regclass;

If you prefer a single admin-managed insert endpoint instead of client-side inserts, create a server function or endpoint that inserts resources with elevated privileges and authenticates the user separately.