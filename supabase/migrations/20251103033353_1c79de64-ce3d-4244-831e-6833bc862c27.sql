-- Grant permissions to authenticated role for resources table
GRANT SELECT, INSERT ON public.resources TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;