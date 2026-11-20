import { redirect } from "next/navigation";
import { createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";
import { PuzzleRoom } from "@/components/puzzle/PuzzleRoom";

export default async function LevelPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createServiceRoleClient();
  const [{ data: level }, { data: puzzle }] = await Promise.all([
    admin.from("levels").select("*").eq("id", params.id).single(),
    admin.from("puzzles").select("*").eq("level_id", params.id).single(),
  ]);

  if (!level || !puzzle) redirect("/chapters");

  let { data: progress } = await admin
    .from("player_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("level_id", level.id)
    .maybeSingle();

  if (!progress && level.level_number === 1) {
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

  if (!progress || progress.status === "locked") {
    redirect("/chapters");
  }

  const { count: hintsCount } = await admin
    .from("puzzle_hints")
    .select("*", { count: "exact", head: true })
    .eq("puzzle_id", puzzle.id);

  return (
    <PuzzleRoom
      level={level}
      puzzle={puzzle}
      initialProgress={progress}
      totalHintsCount={hintsCount || 0}
    />
  );
}
