-- Add additional fields to resources table for complete upload metadata
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS year text,
ADD COLUMN IF NOT EXISTS semester text,
ADD COLUMN IF NOT EXISTS level text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS tags text[];