import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";

const CreatePuzzleSchema = z.object({
  chapterId: z.string().uuid(),
  levelNumber: z.number().int().min(1),
  orderInChapter: z.number().int().min(1),
  levelTitle: z.string().min(2),
  locationName: z.string().min(2),
  storyContext: z.string().min(5),
  puzzleType: z.string(),
  puzzleTitle: z.string().min(2),
  instructions: z.string().min(2),
  prompt: z.string().min(2),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  basePoints: z.number().int().min(10).max(2000),
  maxLives: z.number().int().min(1).max(10),
  canonicalAnswer: z.string().min(1),
  validationMode: z.enum(["exact_insensitive", "numeric", "json_steps", "memory_token", "keywords"]),
  explanation: z.string().min(2),
  hint1: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createServiceRoleClient();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const parsed = CreatePuzzleSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;
    const { data: level, error: levelErr } = await admin
      .from("levels")
      .insert({
        chapter_id: d.chapterId,
        level_number: d.levelNumber,
        order_in_chapter: d.orderInChapter,
        title: d.levelTitle,
        location_name: d.locationName,
        story_context: d.storyContext,
        is_published: true,
      })
      .select()
      .single();

    if (levelErr || !level) {
      return NextResponse.json({ error: levelErr?.message || "Failed to create level" }, { status: 400 });
    }

    const { data: puzzle, error: puzzleErr } = await admin
      .from("puzzles")
      .insert({
        level_id: level.id,
        puzzle_type: d.puzzleType,
        title: d.puzzleTitle,
        instructions: d.instructions,
        prompt: d.prompt,
        config: {},
        difficulty: d.difficulty,
        base_points: d.basePoints,
        max_lives: d.maxLives,
        is_published: true,
      })
      .select()
      .single();

    if (puzzleErr || !puzzle) {
      return NextResponse.json({ error: puzzleErr?.message || "Failed to create puzzle" }, { status: 400 });
    }

    await admin.from("puzzle_answers").insert({
      puzzle_id: puzzle.id,
      canonical_answer: d.canonicalAnswer,
      accepted_variations: [],
      validation_mode: d.validationMode,
      explanation: d.explanation,
    });

    if (d.hint1 && d.hint1.trim().length > 0) {
      await admin.from("puzzle_hints").insert({
        puzzle_id: puzzle.id,
        hint_order: 1,
        hint_text: d.hint1.trim(),
      });
    }

    return NextResponse.json({ level, puzzle });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

const UpdateChallengeSchema = z.object({
  levelId: z.string().uuid(),
  chapterId: z.string().uuid().optional(),
  levelNumber: z.number().int().min(1).optional(),
  orderInChapter: z.number().int().min(1).optional(),
  levelTitle: z.string().min(2).optional(),
  locationName: z.string().min(2).optional(),
  storyContext: z.string().min(5).optional(),
  puzzleTitle: z.string().min(2).optional(),
  puzzleType: z.string().optional(),
  instructions: z.string().min(2).optional(),
  prompt: z.string().min(2).optional(),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]).optional(),
  basePoints: z.number().int().min(10).max(2000).optional(),
  maxLives: z.number().int().min(1).max(10).optional(),
  canonicalAnswer: z.string().min(1).optional(),
  validationMode: z.enum(["exact_insensitive", "numeric", "json_steps", "memory_token", "keywords"]).optional(),
  explanation: z.string().min(2).optional(),
  hint1: z.string().optional(),
});

/**
 * PATCH — admins edit an existing challenge (level + puzzle + answer + first hint).
 * Only fields present in the payload are updated.
 */
export async function PATCH(req: Request) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createServiceRoleClient();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const parsed = UpdateChallengeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;

    const { data: existingPuzzle } = await admin
      .from("puzzles")
      .select("id")
      .eq("level_id", d.levelId)
      .single();
    if (!existingPuzzle) {
      return NextResponse.json({ error: "No puzzle found for this level" }, { status: 404 });
    }

    const levelPatch: Record<string, any> = {};
    if (d.chapterId) levelPatch.chapter_id = d.chapterId;
    if (d.levelNumber !== undefined) levelPatch.level_number = d.levelNumber;
    if (d.orderInChapter !== undefined) levelPatch.order_in_chapter = d.orderInChapter;
    if (d.levelTitle) levelPatch.title = d.levelTitle;
    if (d.locationName) levelPatch.location_name = d.locationName;
    if (d.storyContext) levelPatch.story_context = d.storyContext;

    if (Object.keys(levelPatch).length > 0) {
      const { error } = await admin.from("levels").update(levelPatch).eq("id", d.levelId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const puzzlePatch: Record<string, any> = {};
    if (d.puzzleTitle) puzzlePatch.title = d.puzzleTitle;
    if (d.puzzleType) puzzlePatch.puzzle_type = d.puzzleType;
    if (d.instructions) puzzlePatch.instructions = d.instructions;
    if (d.prompt) puzzlePatch.prompt = d.prompt;
    if (d.difficulty) puzzlePatch.difficulty = d.difficulty;
    if (d.basePoints !== undefined) puzzlePatch.base_points = d.basePoints;
    if (d.maxLives !== undefined) puzzlePatch.max_lives = d.maxLives;

    if (Object.keys(puzzlePatch).length > 0) {
      const { error } = await admin.from("puzzles").update(puzzlePatch).eq("id", existingPuzzle.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const answerPatch: Record<string, any> = {};
    if (d.canonicalAnswer) answerPatch.canonical_answer = d.canonicalAnswer;
    if (d.validationMode) answerPatch.validation_mode = d.validationMode;
    if (d.explanation) answerPatch.explanation = d.explanation;

    if (Object.keys(answerPatch).length > 0) {
      const { data: answerRow } = await admin
        .from("puzzle_answers")
        .select("id")
        .eq("puzzle_id", existingPuzzle.id)
        .maybeSingle();

      if (answerRow) {
        const { error } = await admin
          .from("puzzle_answers")
          .update(answerPatch)
          .eq("id", answerRow.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      } else {
        const { error } = await admin
          .from("puzzle_answers")
          .insert({ puzzle_id: existingPuzzle.id, ...answerPatch });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // First hint: non-empty string sets it, empty string clears it.
    if (d.hint1 !== undefined) {
      const { data: hintRow } = await admin
        .from("puzzle_hints")
        .select("id")
        .eq("puzzle_id", existingPuzzle.id)
        .eq("hint_order", 1)
        .maybeSingle();

      if (d.hint1.trim() === "") {
        if (hintRow) {
          const { error } = await admin.from("puzzle_hints").delete().eq("id", hintRow.id);
          if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        }
      } else if (hintRow) {
        const { error } = await admin
          .from("puzzle_hints")
          .update({ hint_text: d.hint1.trim() })
          .eq("id", hintRow.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      } else {
        const { error } = await admin.from("puzzle_hints").insert({
          puzzle_id: existingPuzzle.id,
          hint_order: 1,
          hint_text: d.hint1.trim(),
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
