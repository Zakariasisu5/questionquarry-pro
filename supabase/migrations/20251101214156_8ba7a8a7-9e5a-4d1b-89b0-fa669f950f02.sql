-- Grant necessary permissions to authenticated users on resources table
GRANT SELECT, INSERT ON public.resources TO authenticated;

-- Also grant usage on the sequence for the id column if it exists
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;