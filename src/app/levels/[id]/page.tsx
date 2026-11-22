import { redirect } from "next/navigation";
import { createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";
import { fetchAccountFlags, isAdminRole } from "@/lib/admin";
import { isPreviousChapterCleared } from "@/lib/chapters";
import { PuzzleRoom } from "@/components/puzzle/PuzzleRoom";
import type { PlayerProgress } from "@/types/database";

export default async function LevelPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createServiceRoleClient();
  const [{ data: level }, { data: puzzle }, flags] = await Promise.all([
    admin.from("levels").select("*").eq("id", params.id).single(),
    admin.from("puzzles").select("*").eq("level_id", params.id).single(),
    fetchAccountFlags(admin, user.id),
  ]);

  if (!level || !puzzle) redirect("/chapters");

  if (flags.isBanned) redirect("/login?banned=1");

  const isAdmin = isAdminRole(flags.role);

  // Hidden chapters (The Critical Terminal) only open once the previous
  // chapter has been fully cleared.
  if (!isAdmin) {
    const { data: chapter } = await admin
      .from("chapters")
      .select("*")
      .eq("id", level.chapter_id)
      .maybeSingle();

    if (chapter?.is_hidden) {
      const cleared = await isPreviousChapterCleared(admin, user.id, chapter.chapter_number);
      if (!cleared) redirect("/chapters");
    }
  }

  let { data: progress } = await admin
    .from("player_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("level_id", level.id)
    .maybeSingle();

  // Admins never play challenges: no progress rows are created for them.
  // Otherwise create the row when the player has genuinely earned it: either
  // this is the first level, or the preceding level is already completed.
  // (Covers players who cleared Chapter 4 before Chapter 5 existed.)
  if (!progress && !isAdmin) {
    let shouldUnlock = level.level_number === 1;

    if (!shouldUnlock) {
      const { data: previousLevel } = await admin
        .from("levels")
        .select("id")
        .eq("level_number", level.level_number - 1)
        .maybeSingle();

      if (previousLevel) {
        const { data: previousProgress } = await admin
          .from("player_progress")
          .select("status")
          .eq("user_id", user.id)
          .eq("level_id", previousLevel.id)
          .maybeSingle();
        shouldUnlock = previousProgress?.status === "completed";
      }
    }

    if (shouldUnlock) {
      const { data: created } = await admin
        .from("player_progress")
        .insert({
          user_id: user.id,
          level_id: level.id,
          status: "unlocked",
          lives_remaining: puzzle.max_lives,
        })
        .select()
        .single();
      progress = created;
    }
  }

  // Admins can preview every challenge (view-only), even locked ones.
  if (!isAdmin && (!progress || progress.status === "locked")) {
    redirect("/chapters");
  }

  const { count: hintsCount } = await admin
    .from("puzzle_hints")
    .select("*", { count: "exact", head: true })
    .eq("puzzle_id", puzzle.id);

  const previewProgress: PlayerProgress = progress ?? {
    id: "",
    user_id: user.id,
    level_id: level.id,
    status: "unlocked",
    attempts_count: 0,
    incorrect_attempts: 0,
    hints_revealed: 0,
    lives_remaining: puzzle.max_lives,
    best_score: 0,
    best_time_seconds: null,
    started_at: null,
    completed_at: null,
    updated_at: new Date().toISOString(),
  };

  return (
    <PuzzleRoom
      level={level}
      puzzle={puzzle}
      initialProgress={previewProgress}
      totalHintsCount={hintsCount || 0}
      readOnly={isAdmin}
    />
  );
}
