import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";
import { calculatePuzzleScore, validatePuzzleSubmission } from "@/lib/puzzle-engine";

const SubmitSchema = z.object({
  puzzleId: z.string().uuid(),
  levelId: z.string().uuid(),
  answer: z.string().min(1).max(2000),
  elapsedSeconds: z.number().int().min(0).max(86400),
});

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission payload" }, { status: 400 });
    }

    const { puzzleId, levelId, answer, elapsedSeconds } = parsed.data;
    const admin = createServiceRoleClient();

    const [{ data: puzzle }, { data: answerRow }, { data: level }] = await Promise.all([
      admin.from("puzzles").select("*").eq("id", puzzleId).single(),
      admin.from("puzzle_answers").select("*").eq("puzzle_id", puzzleId).single(),
      admin.from("levels").select("*").eq("id", levelId).single(),
    ]);

    if (!puzzle || !answerRow || !level) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    let { data: progress } = await admin
      .from("player_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("level_id", levelId)
      .single();

    if (!progress) {
      if (level.level_number === 1) {
        const { data: created } = await admin
          .from("player_progress")
          .insert({
            user_id: user.id,
            level_id: levelId,
            status: "unlocked",
            lives_remaining: puzzle.max_lives,
          })
          .select()
          .single();
        progress = created;
      } else {
        return NextResponse.json({ error: "Level is locked" }, { status: 403 });
      }
    }

    if (progress.status === "locked") {
      return NextResponse.json({ error: "Level is locked" }, { status: 403 });
    }

    const isCorrect = validatePuzzleSubmission({
      submittedAnswer: answer,
      canonicalAnswer: answerRow.canonical_answer,
      acceptedVariations: Array.isArray(answerRow.accepted_variations)
        ? answerRow.accepted_variations
        : [],
      validationMode: answerRow.validation_mode,
    });

    const nextAttemptNumber = (progress.attempts_count || 0) + 1;

    if (!isCorrect) {
      const nextIncorrect = (progress.incorrect_attempts || 0) + 1;
      const remainingLives = Math.max(0, (progress.lives_remaining ?? puzzle.max_lives) - 1);

      await admin.from("puzzle_attempts").insert({
        user_id: user.id,
        puzzle_id: puzzleId,
        level_id: levelId,
        submitted_answer: answer.slice(0, 500),
        is_correct: false,
        attempt_number: nextAttemptNumber,
        hints_used: progress.hints_revealed || 0,
        elapsed_seconds: elapsedSeconds,
        points_awarded: 0,
      });

      await admin
        .from("player_progress")
        .update({
          attempts_count: nextAttemptNumber,
          incorrect_attempts: nextIncorrect,
          lives_remaining: remainingLives,
          updated_at: new Date().toISOString(),
        })
        .eq("id", progress.id);

      return NextResponse.json({
        correct: false,
        livesRemaining: remainingLives,
        outOfLives: remainingLives === 0,
        message:
          remainingLives === 0
            ? "All energy seals depleted! Reset the chamber to try again."
            : `Incorrect solution. ${remainingLives} attempt${remainingLives === 1 ? "" : "s"} remaining.`,
      });
    }

    const breakdown = calculatePuzzleScore({
      basePoints: puzzle.base_points,
      firstAttemptBonus: puzzle.first_attempt_bonus,
      noHintsBonus: puzzle.no_hints_bonus,
      maxTimeBonus: puzzle.max_time_bonus,
      hintPenalty: puzzle.hint_penalty,
      attemptNumber: nextAttemptNumber,
      hintsRevealed: progress.hints_revealed || 0,
      elapsedSeconds,
      targetTimeSeconds: puzzle.target_time_seconds,
    });

    await admin.from("puzzle_attempts").insert({
      user_id: user.id,
      puzzle_id: puzzleId,
      level_id: levelId,
      submitted_answer: answer.slice(0, 500),
      is_correct: true,
      attempt_number: nextAttemptNumber,
      hints_used: progress.hints_revealed || 0,
      elapsed_seconds: elapsedSeconds,
      points_awarded: breakdown.totalPoints,
    });

    const wasAlreadyCompleted = progress.status === "completed";
    const newBestScore = Math.max(progress.best_score || 0, breakdown.totalPoints);
    const newBestTime =
      progress.best_time_seconds == null
        ? elapsedSeconds
        : Math.min(progress.best_time_seconds, elapsedSeconds);

    await admin
      .from("player_progress")
      .update({
        status: "completed",
        attempts_count: nextAttemptNumber,
        best_score: newBestScore,
        best_time_seconds: newBestTime,
        completed_at: progress.completed_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", progress.id);

    if (!wasAlreadyCompleted || breakdown.totalPoints > (progress.best_score || 0)) {
      await admin.from("scores").upsert(
        {
          user_id: user.id,
          level_id: levelId,
          base_points: breakdown.basePoints,
          first_attempt_bonus: breakdown.firstAttemptBonus,
          no_hints_bonus: breakdown.noHintsBonus,
          time_bonus: breakdown.timeBonus,
          hint_penalty: breakdown.hintPenalty,
          total_points: newBestScore,
          completion_time_seconds: newBestTime,
        },
        { onConflict: "user_id,level_id" }
      );
    }

    // Unlock next level
    const { data: nextLevel } = await admin
      .from("levels")
      .select("id, puzzles(max_lives)")
      .eq("level_number", level.level_number + 1)
      .eq("is_published", true)
      .maybeSingle();

    if (nextLevel) {
      const nextMaxLives = Array.isArray(nextLevel.puzzles)
        ? nextLevel.puzzles[0]?.max_lives ?? 3
        : (nextLevel.puzzles as any)?.max_lives ?? 3;
      await admin.from("player_progress").upsert(
        {
          user_id: user.id,
          level_id: nextLevel.id,
          status: "unlocked",
          lives_remaining: nextMaxLives,
        },
        { onConflict: "user_id,level_id", ignoreDuplicates: true }
      );
    }

    // Evaluate achievements
    const { data: allCompleted } = await admin
      .from("player_progress")
      .select("level_id")
      .eq("user_id", user.id)
      .eq("status", "completed");

    const completedCount = allCompleted?.length || 0;
    const { data: allAchievements } = await admin.from("achievements").select("*");
    const { data: existingUserAch } = await admin
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", user.id);

    const unlockedSet = new Set((existingUserAch || []).map((a) => a.achievement_id));
    const newlyUnlocked: any[] = [];

    for (const ach of allAchievements || []) {
      if (unlockedSet.has(ach.id)) continue;
      let qualifies = false;
      if (ach.slug === "first_step" && completedCount >= 1) qualifies = true;
      if (ach.slug === "brain_starter" && completedCount >= 5) qualifies = true;
      if (ach.slug === "perfect_mind" && (progress.hints_revealed || 0) === 0) qualifies = true;
      if (
        ach.slug === "speed_solver" &&
        puzzle.target_time_seconds &&
        elapsedSeconds <= puzzle.target_time_seconds
      ) {
        qualifies = true;
      }
      if (ach.slug === "puzzle_legend" && completedCount >= 12) qualifies = true;
      if (ach.slug === "chapter_master") {
        const { data: chapterLevels } = await admin
          .from("levels")
          .select("id")
          .eq("chapter_id", level.chapter_id);
        const completedIds = new Set((allCompleted || []).map((c) => c.level_id));
        if (chapterLevels && chapterLevels.every((cl) => completedIds.has(cl.id))) {
          qualifies = true;
        }
      }

      if (qualifies) {
        await admin.from("user_achievements").insert({
          user_id: user.id,
          achievement_id: ach.id,
        });
        newlyUnlocked.push(ach);
      }
    }

    // Recalculate profile totals
    const { data: userScores } = await admin
      .from("scores")
      .select("total_points")
      .eq("user_id", user.id);
    const { data: userAchievementsFull } = await admin
      .from("user_achievements")
      .select("achievements(points_reward)")
      .eq("user_id", user.id);

    const levelPointsSum = (userScores || []).reduce((acc, s) => acc + (s.total_points || 0), 0);
    const achPointsSum = (userAchievementsFull || []).reduce((acc, ua: any) => {
      const pts = Array.isArray(ua.achievements)
        ? ua.achievements[0]?.points_reward ?? 0
        : ua.achievements?.points_reward ?? 0;
      return acc + pts;
    }, 0);

    await admin
      .from("profiles")
      .update({
        total_score: levelPointsSum + achPointsSum,
        levels_completed: completedCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({
      correct: true,
      explanation: answerRow.explanation,
      scoreBreakdown: breakdown,
      nextLevelId: nextLevel?.id ?? null,
      newlyUnlockedAchievements: newlyUnlocked,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
