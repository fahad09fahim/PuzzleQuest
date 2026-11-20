export type DifficultyLevel = "easy" | "medium" | "hard" | "expert";
export type PuzzleCategory =
  | "riddle"
  | "math"
  | "logic"
  | "sequence"
  | "pattern"
  | "multiple_choice"
  | "word"
  | "caesar_cipher"
  | "substitution_cipher"
  | "memory"
  | "hidden_clues"
  | "multi_step";
export type ProgressStatus = "locked" | "unlocked" | "completed";
export type ValidationMode = "exact_insensitive" | "numeric" | "json_steps" | "memory_token";

export interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  role: "player" | "admin";
  total_score: number;
  levels_completed: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  subtitle: string;
  story_intro: string;
  description: string;
  theme: string;
  difficulty: DifficultyLevel;
  reward_title: string;
  reward_description: string;
  is_published: boolean;
}

export interface Level {
  id: string;
  chapter_id: string;
  level_number: number;
  order_in_chapter: number;
  title: string;
  story_context: string;
  location_name: string;
  is_published: boolean;
}

export interface Puzzle {
  id: string;
  level_id: string;
  puzzle_type: PuzzleCategory;
  title: string;
  instructions: string;
  prompt: string;
  config: Record<string, any>;
  difficulty: DifficultyLevel;
  base_points: number;
  first_attempt_bonus: number;
  no_hints_bonus: number;
  max_time_bonus: number;
  hint_penalty: number;
  max_lives: number;
  time_limit_seconds: number | null;
  target_time_seconds: number | null;
  is_published: boolean;
}

export interface PlayerProgress {
  id: string;
  user_id: string;
  level_id: string;
  status: ProgressStatus;
  attempts_count: number;
  incorrect_attempts: number;
  hints_revealed: number;
  lives_remaining: number;
  best_score: number;
  best_time_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface ScoreBreakdown {
  basePoints: number;
  firstAttemptBonus: number;
  noHintsBonus: number;
  timeBonus: number;
  hintPenalty: number;
  totalPoints: number;
}
