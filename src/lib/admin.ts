import type { createServiceRoleClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

export type UserRole = "player" | "admin";

export interface AccountFlags {
  role: UserRole | null;
  isBanned: boolean;
}

/**
 * Look up a user's role and ban status using the service-role client.
 * Admins have view-only access to challenges: they can never play,
 * submit answers, reveal hints, or appear on the leaderboard.
 */
export async function fetchAccountFlags(
  admin: ServiceClient,
  userId: string
): Promise<AccountFlags> {
  const { data } = await admin
    .from("profiles")
    .select("role, is_banned")
    .eq("id", userId)
    .maybeSingle();
  return {
    role: (data?.role as UserRole) ?? null,
    isBanned: Boolean(data?.is_banned),
  };
}

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === "admin";
}
