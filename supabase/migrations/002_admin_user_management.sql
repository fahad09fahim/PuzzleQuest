-- ============================================================
-- 002 — Admin user management
-- Adds ban support to profiles and lets admins manage any row.
-- Run this in the Supabase SQL Editor after 001_initial_schema.sql.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.is_banned IS
  'Set by admins. Banned users are signed out and cannot play challenges.';

-- Admins may read and write any profile (points, ban status, role).
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
