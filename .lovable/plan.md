# Browse Resources Flow — Implementation Plan

## Overview
Build a guided flow: **Login → Browse Resources → Level → Trimester → Courses → Resources**. Currently `resources` has loose `level`, `semester`, `course_code` strings and no `courses` table. I'll introduce a proper `courses` table so levels/trimesters/courses are database-driven and scalable.

## Database Changes (single migration)

Create `public.courses`:
- `code` (text, unique) — e.g. "CS101"
- `title` (text)
- `level` (text) — "100" | "200" | "300" | "400" (free-form text so future levels work)
- `trimester` (text) — "1" | "2" | "3"
- `lecturer` (text, nullable)
- standard `id`, `created_at`, `updated_at`

Plus:
- GRANTs (SELECT for anon + authenticated, ALL for service_role)
- RLS: public SELECT; INSERT/UPDATE/DELETE restricted to `has_role(auth.uid(),'admin')`
- updated_at trigger
- Add nullable `file_size` (bigint) and `file_type` (text) columns to `resources` so resource cards can show size/type
- Backfill `courses` from existing `resources` via `INSERT … SELECT DISTINCT course_code, level, semester …` so current data keeps working
- (Keep `resources.course_code` as the link — no FK rename, minimizes risk)

## Frontend Changes

### New page: `src/pages/Browse.tsx`
A single page that holds the entire wizard with internal step state (`level | trimester | courses`), driven by URL search params (`?level=100&trimester=1`) for shareability and back-button support.

Sections rendered per step:
1. **Level picker** — fetch `SELECT DISTINCT level FROM courses` → grid of large level cards (100/200/300/400). Loading skeleton + empty state.
2. **Trimester picker** — fetch `SELECT DISTINCT trimester FROM courses WHERE level = ?` → only show trimesters that have courses.
3. **Courses grid** — fetch courses for (level, trimester), join resource counts via a grouped query (`SELECT course_code, count(*) FROM resources WHERE verified GROUP BY course_code`). Reuse existing `CourseCard`, extend props for lecturer + lastUpdated. Includes a search input filtering by code/title.

Breadcrumb header (Level › Trimester › Courses) with back navigation between steps.

### Update existing `src/pages/Course.tsx`
- Fetch course meta (title, lecturer) from new `courses` table by `course_code` and display in header instead of hardcoded "Data Structures and Algorithms".
- Resource cards already exist; extend `ResourceCard` to show `file_type` and human-readable `file_size` when present.
- Keep existing empty state, improve copy: "No resources have been uploaded for this course yet."

### Update `src/pages/Index.tsx` (dashboard)
- Add a prominent **Browse Resources** hero card/button that links to `/browse`.

### Routing (`src/App.tsx`)
- Add `<Route path="/browse" element={<Browse />} />`.

### Admin
- Extend `src/pages/Upload.tsx` (and/or admin) so new resources can pick from existing courses (dropdown sourced from `courses`) instead of free-typing course_code. Out of scope for "browse" flow but mentioned so admins can add new courses; I'll add a small "Add course" form on the Admin page.

## UX Details
- Loading: shadcn `Skeleton` grids.
- Empty states: friendly messages at each step ("No levels available yet", "No courses for this trimester", etc.).
- Responsive: Tailwind grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Transitions: subtle `animate-in fade-in` between steps.
- Caching: per-session in-memory cache keyed by step inputs to avoid refetching when navigating back.

## Out of Scope
- Server-side pagination (course list is small).
- Reworking the entire upload UI beyond exposing a course dropdown.

## Order of Execution
1. Run the migration (adds `courses`, columns, backfill).
2. After migration approval & types regen: write `Browse.tsx`, update `Index.tsx`, `App.tsx`, `Course.tsx`, `ResourceCard.tsx`, and a small admin "create course" form.
3. Smoke-test via Playwright (level → trimester → courses → resource).
