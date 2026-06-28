
-- 1) courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  level text NOT NULL,
  trimester text NOT NULL,
  lecturer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX courses_level_trimester_idx ON public.courses (level, trimester);

-- 2) extend resources with file metadata
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS file_size bigint,
  ADD COLUMN IF NOT EXISTS file_type text;

-- 3) backfill courses from existing resources so current data stays browseable
INSERT INTO public.courses (code, title, level, trimester)
SELECT DISTINCT
  r.course_code,
  r.course_code AS title,
  COALESCE(NULLIF(r.level, ''), '100') AS level,
  COALESCE(NULLIF(r.semester, ''), '1') AS trimester
FROM public.resources r
WHERE r.course_code IS NOT NULL
ON CONFLICT (code) DO NOTHING;
