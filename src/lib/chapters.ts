import type { createServiceRoleClient } from "@/lib/supabase/server";
import type { Chapter, Level, PlayerProgress } from "@/types/database";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

export interface ChapterUnlockContext {
  chapters: Chapter[];
  levels: Level[];
  progressMap: Map<string, PlayerProgress>;
  isAdmin: boolean;
}

/**
 * A chapter is visible when it is published and either:
 *  - not hidden, or
 *  - the player (or admin) has fully cleared the previous chapter.
 *
 * This is what keeps Chapter 5 ("The Critical Terminal") out of sight
 * until Chapter 4 is completed.
 */
export function isChapterUnlocked(chapter: Chapter, ctx: ChapterUnlockContext): boolean {
  if (!chapter.is_hidden) return true;
  if (ctx.isAdmin) return true;

  const previous = ctx.chapters.find((c) => c.chapter_number === chapter.chapter_number - 1);
  if (!previous) return false;

  const previousLevels = ctx.levels.filter((l) => l.chapter_id === previous.id);
  if (previousLevels.length === 0) return false;

  return previousLevels.every((l) => ctx.progressMap.get(l.id)?.status === "completed");
}

/** Chapters the given player is allowed to see. */
export function visibleChapters(chapters: Chapter[], ctx: ChapterUnlockContext): Chapter[] {
  return chapters.filter((c) => isChapterUnlocked(c, ctx));
}

/** Whether a level belongs to a chapter the player may enter. */
export function isLevelAccessible(level: Level, ctx: ChapterUnlockContext): boolean {
  const chapter = ctx.chapters.find((c) => c.id === level.chapter_id);
  if (!chapter) return true;
  return isChapterUnlocked(chapter, ctx);
}

/**
 * The status a level should display, tolerating a missing progress row.
 *
 * The normal flow creates an "unlocked" row when the previous level is
 * completed. If that row is absent (for example a player who finished
 * Chapter 4 before the hidden Chapter 5 migration ran), we still derive
 * the correct status from the preceding level instead of showing a
 * permanent "Complete Previous Level" dead end.
 */
export function effectiveLevelStatus(
  level: Level,
  levels: Level[],
  progressMap: Map<string, PlayerProgress>
): PlayerProgress["status"] {
  const existing = progressMap.get(level.id)?.status;
  if (existing) return existing;
  if (level.level_number === 1) return "unlocked";

  const previous = levels.find((l) => l.level_number === level.level_number - 1);
  if (previous && progressMap.get(previous.id)?.status === "completed") return "unlocked";

  return "locked";
}

/**
 * Server-side check (service role) used by the level page: has the player
 * fully completed the chapter preceding `chapterNumber`?
 */
export async function isPreviousChapterCleared(
  admin: ServiceClient,
  userId: string,
  chapterNumber: number
): Promise<boolean> {
  const { data: previous } = await admin
    .from("chapters")
    .select("id")
    .eq("chapter_number", chapterNumber - 1)
    .maybeSingle();
  if (!previous) return false;

  const { data: previousLevels } = await admin
    .from("levels")
    .select("id")
    .eq("chapter_id", previous.id);

  const levelIds = (previousLevels || []).map((l) => l.id);
  if (levelIds.length === 0) return false;

  const { data: rows } = await admin
    .from("player_progress")
    .select("level_id, status")
    .eq("user_id", userId)
    .in("level_id", levelIds);

  const completed = new Set(
    (rows || []).filter((r) => r.status === "completed").map((r) => r.level_id)
  );
  return levelIds.every((id) => completed.has(id));
}
