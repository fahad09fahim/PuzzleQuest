import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";

const ManageUserSchema = z.object({
  userId: z.string().uuid(),
  /** Set an exact total score (use 0 to reset). */
  totalScore: z.number().int().min(0).max(1_000_000).optional(),
  /** Ban / unban the account. */
  isBanned: z.boolean().optional(),
});

/**
 * PATCH — admin user management: edit points, reset points, ban / unban.
 * Requires the caller to be an admin; targets are validated server-side.
 */
export async function PATCH(req: Request) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createServiceRoleClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const parsed = ManageUserSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { userId, totalScore, isBanned } = parsed.data;

    if (userId === user.id) {
      return NextResponse.json(
        { error: "You cannot manage your own account from this panel." },
        { status: 400 }
      );
    }

    if (totalScore === undefined && isBanned === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data: target } = await admin
      .from("profiles")
      .select("id, username")
      .eq("id", userId)
      .maybeSingle();
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (totalScore !== undefined) {
      const { error } = await admin
        .from("profiles")
        .update({ total_score: totalScore, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (isBanned !== undefined) {
      const { error } = await admin
        .from("profiles")
        .update({ is_banned: isBanned, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      // Also ban the auth account so the user cannot sign in again.
      try {
        const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
          ban_duration: isBanned ? "876600h" : "none",
        });
        if (authErr) {
          return NextResponse.json({ error: authErr.message }, { status: 500 });
        }
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "Failed to update auth account" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
