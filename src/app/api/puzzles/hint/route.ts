import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";

const HintSchema = z.object({
  puzzleId: z.string().uuid(),
  levelId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = HintSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { puzzleId, levelId } = parsed.data;
    const admin = createServiceRoleClient();

    const [{ data: hints }, { data: progress }] = await Promise.all([
      admin
        .from("puzzle_hints")
        .select("*")
        .eq("puzzle_id", puzzleId)
        .order("hint_order", { ascending: true }),
      admin
        .from("player_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("level_id", levelId)
        .single(),
    ]);

    if (!progress || progress.status === "locked") {
      return NextResponse.json({ error: "Level locked" }, { status: 403 });
    }

    const allHints = hints || [];
    const currentRevealed = progress.hints_revealed || 0;

    if (currentRevealed >= allHints.length) {
      return NextResponse.json({
        hints: allHints.map((h) => ({ hint_order: h.hint_order, hint_text: h.hint_text })),
        totalHints: allHints.length,
        hintsRevealed: currentRevealed,
      });
    }

    const nextCount = currentRevealed + 1;
    await admin
      .from("player_progress")
      .update({ hints_revealed: nextCount, updated_at: new Date().toISOString() })
      .eq("id", progress.id);

    return NextResponse.json({
      hints: allHints
        .slice(0, nextCount)
        .map((h) => ({ hint_order: h.hint_order, hint_text: h.hint_text })),
      totalHints: allHints.length,
      hintsRevealed: nextCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
