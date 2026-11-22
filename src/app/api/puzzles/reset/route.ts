import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";
import { fetchAccountFlags, isAdminRole } from "@/lib/admin";

const ResetSchema = z.object({
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

    const admin = createServiceRoleClient();

    const { role, isBanned } = await fetchAccountFlags(admin, user.id);
    if (isBanned) {
      return NextResponse.json({ error: "This account has been suspended." }, { status: 403 });
    }

    // Admins have view-only access: no playing, so no chamber resets.
    if (isAdminRole(role)) {
      return NextResponse.json(
        { error: "Admin accounts have view-only access and cannot play challenges." },
        { status: 403 }
      );
    }

    const parsed = ResetSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { puzzleId, levelId } = parsed.data;

    const [{ data: puzzle }, { data: progress }] = await Promise.all([
      admin.from("puzzles").select("max_lives").eq("id", puzzleId).single(),
      admin
        .from("player_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("level_id", levelId)
        .single(),
    ]);

    if (!puzzle || !progress || progress.status === "locked") {
      return NextResponse.json({ error: "Cannot reset chamber" }, { status: 400 });
    }

    await admin
      .from("player_progress")
      .update({
        lives_remaining: puzzle.max_lives,
        updated_at: new Date().toISOString(),
      })
      .eq("id", progress.id);

    return NextResponse.json({ livesRemaining: puzzle.max_lives });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
