-- Fix search_path for get_download_count function
DROP FUNCTION IF EXISTS public.get_download_count(uuid);

CREATE OR REPLACE FUNCTION public.get_download_count(resource_uuid uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*) FROM public.downloads WHERE resource_id = resource_uuid;
$$;