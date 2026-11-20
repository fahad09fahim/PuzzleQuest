CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard', 'expert');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE puzzle_category AS ENUM (
    'riddle', 'math', 'logic', 'sequence', 'pattern', 'multiple_choice',
    'word', 'caesar_cipher', 'substitution_cipher', 'memory', 'hidden_clues', 'multi_step'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE progress_status AS ENUM ('locked', 'unlocked', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 32),
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT DEFAULT 'explorer-1',
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  total_score INTEGER NOT NULL DEFAULT 0 CHECK (total_score >= 0),
  levels_completed INTEGER NOT NULL DEFAULT 0 CHECK (levels_completed >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_total_score ON public.profiles(total_score DESC);

CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_number INTEGER UNIQUE NOT NULL CHECK (chapter_number > 0),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  story_intro TEXT NOT NULL,
  description TEXT NOT NULL,
  theme TEXT NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'easy',
  reward_title TEXT NOT NULL,
  reward_description TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  level_number INTEGER UNIQUE NOT NULL CHECK (level_number > 0),
  order_in_chapter INTEGER NOT NULL CHECK (order_in_chapter > 0),
  title TEXT NOT NULL,
  story_context TEXT NOT NULL,
  location_name TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chapter_id, order_in_chapter)
);

CREATE TABLE IF NOT EXISTS public.puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID UNIQUE NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  puzzle_type puzzle_category NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  prompt TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  difficulty difficulty_level NOT NULL DEFAULT 'easy',
  base_points INTEGER NOT NULL DEFAULT 100 CHECK (base_points >= 0),
  first_attempt_bonus INTEGER NOT NULL DEFAULT 50 CHECK (first_attempt_bonus >= 0),
  no_hints_bonus INTEGER NOT NULL DEFAULT 25 CHECK (no_hints_bonus >= 0),
  max_time_bonus INTEGER NOT NULL DEFAULT 50 CHECK (max_time_bonus >= 0),
  hint_penalty INTEGER NOT NULL DEFAULT 20 CHECK (hint_penalty >= 0),
  max_lives INTEGER NOT NULL DEFAULT 3 CHECK (max_lives >= 1 AND max_lives <= 10),
  time_limit_seconds INTEGER NULL CHECK (time_limit_seconds IS NULL OR time_limit_seconds >= 15),
  target_time_seconds INTEGER NULL CHECK (target_time_seconds IS NULL OR target_time_seconds >= 10),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.puzzle_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id UUID UNIQUE NOT NULL REFERENCES public.puzzles(id) ON DELETE CASCADE,
  canonical_answer TEXT NOT NULL,
  accepted_variations JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_mode TEXT NOT NULL DEFAULT 'exact_insensitive'
    CHECK (validation_mode IN ('exact_insensitive', 'numeric', 'json_steps', 'memory_token')),
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.puzzle_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id UUID NOT NULL REFERENCES public.puzzles(id) ON DELETE CASCADE,
  hint_order INTEGER NOT NULL CHECK (hint_order >= 1),
  hint_text TEXT NOT NULL,
  penalty_override INTEGER NULL CHECK (penalty_override IS NULL OR penalty_override >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (puzzle_id, hint_order)
);

CREATE TABLE IF NOT EXISTS public.player_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  status progress_status NOT NULL DEFAULT 'locked',
  attempts_count INTEGER NOT NULL DEFAULT 0 CHECK (attempts_count >= 0),
  incorrect_attempts INTEGER NOT NULL DEFAULT 0 CHECK (incorrect_attempts >= 0),
  hints_revealed INTEGER NOT NULL DEFAULT 0 CHECK (hints_revealed >= 0),
  lives_remaining INTEGER NOT NULL DEFAULT 3 CHECK (lives_remaining >= 0),
  best_score INTEGER NOT NULL DEFAULT 0 CHECK (best_score >= 0),
  best_time_seconds INTEGER NULL,
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, level_id)
);

CREATE TABLE IF NOT EXISTS public.puzzle_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  puzzle_id UUID NOT NULL REFERENCES public.puzzles(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  submitted_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
  hints_used INTEGER NOT NULL DEFAULT 0,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  base_points INTEGER NOT NULL DEFAULT 0,
  first_attempt_bonus INTEGER NOT NULL DEFAULT 0,
  no_hints_bonus INTEGER NOT NULL DEFAULT 0,
  time_bonus INTEGER NOT NULL DEFAULT 0,
  hint_penalty INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  completion_time_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, level_id)
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Award',
  badge_color TEXT NOT NULL DEFAULT 'purple',
  points_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  generated_username TEXT;
  first_level_id UUID;
BEGIN
  generated_username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
    'seeker_' || substr(replace(NEW.id::text, '-', ''), 1, 8)
  );
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (NEW.id, generated_username, COALESCE(NEW.email, ''), 'player')
  ON CONFLICT (id) DO NOTHING;

  SELECT id INTO first_level_id FROM public.levels WHERE level_number = 1 AND is_published = TRUE LIMIT 1;
  IF first_level_id IS NOT NULL THEN
    INSERT INTO public.player_progress (user_id, level_id, status, lives_remaining)
    VALUES (NEW.id, first_level_id, 'unlocked', 4)
    ON CONFLICT (user_id, level_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzle_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzle_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzle_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles readable" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND total_score = (SELECT total_score FROM public.profiles WHERE id = auth.uid())
    AND levels_completed = (SELECT levels_completed FROM public.profiles WHERE id = auth.uid())
  );
CREATE POLICY "Published chapters readable" ON public.chapters FOR SELECT USING (is_published = TRUE OR public.is_admin());
CREATE POLICY "Admins manage chapters" ON public.chapters FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Published levels readable" ON public.levels FOR SELECT USING (is_published = TRUE OR public.is_admin());
CREATE POLICY "Admins manage levels" ON public.levels FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Published puzzles readable" ON public.puzzles FOR SELECT USING ((is_published = TRUE AND auth.role() = 'authenticated') OR public.is_admin());
CREATE POLICY "Admins manage puzzles" ON public.puzzles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Only admins read answers" ON public.puzzle_answers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Only admins read hints directly" ON public.puzzle_hints FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Players read own progress" ON public.player_progress FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Players read own attempts" ON public.puzzle_attempts FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Scores readable" ON public.scores FOR SELECT USING (TRUE);
CREATE POLICY "Achievements readable" ON public.achievements FOR SELECT USING (TRUE);
CREATE POLICY "User achievements readable" ON public.user_achievements FOR SELECT USING (TRUE);
