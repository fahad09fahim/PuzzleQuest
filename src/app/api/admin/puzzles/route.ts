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
  validationMode: z.enum(["exact_insensitive", "numeric", "json_steps", "memory_token"]),
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
