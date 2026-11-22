import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Award, CheckCircle2, Compass, Eye, Play, Trophy } from "lucide-react";
import { getDifficultyBadgeColor } from "@/lib/utils";
import { effectiveLevelStatus, isChapterUnlocked } from "@/lib/chapters";

export default async function DashboardPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: chapters }, { data: levels }, { data: progress }, { data: userAch }, { count: achievementCount }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("chapters").select("*").order("chapter_number"),
      supabase.from("levels").select("*").order("level_number"),
      supabase.from("player_progress").select("*").eq("user_id", user.id),
      supabase.from("user_achievements").select("*, achievements(*)").eq("user_id", user.id),
      supabase.from("achievements").select("id", { count: "exact", head: true }),
    ]);

  const progressMap = new Map((progress || []).map((p) => [p.level_id, p]));
  const completedLevels = (progress || []).filter((p) => p.status === "completed").length;
  // Admins have view-only access: they never play challenges.
  const isAdmin = profile?.role === "admin";

  // Hidden chapters stay out of the dashboard until the previous chapter is cleared.
  const unlockCtx = {
    chapters: (chapters || []) as any[],
    levels: (levels || []) as any[],
    progressMap,
    isAdmin,
  };
  const shownChapters = (chapters || []).filter((c) => isChapterUnlocked(c as any, unlockCtx));
  const playableLevels = (levels || []).filter((l) =>
    shownChapters.some((c) => c.id === l.chapter_id)
  );

  // Only count levels the player can actually see, so hidden chapters never
  // leak into the "CHAMBERS SOLVED" total before they are revealed.
  const totalLevels = playableLevels.length || 12;

  const nextUnlockedLevel =
    playableLevels.find((l) => effectiveLevelStatus(l, levels || [], progressMap) === "unlocked") ||
    playableLevels[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Welcome back, {profile?.username || "Explorer"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Your expedition through the Astral Engine continues.
          </p>
        </div>
        {nextUnlockedLevel && !isAdmin && (
          <Link
            href={`/levels/${nextUnlockedLevel.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25"
          >
            <Play className="h-4 w-4" />
            Continue Level {nextUnlockedLevel.level_number}: {nextUnlockedLevel.title}
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/chapters"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25"
          >
            <Eye className="h-4 w-4" />
            Preview Challenges
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>TOTAL SCORE</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">{profile?.total_score ?? 0}</div>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>CHAMBERS SOLVED</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {completedLevels} / {totalLevels}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>ACHIEVEMENTS</span>
            <Award className="h-4 w-4 text-violet-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">{userAch?.length ?? 0} / {achievementCount ?? 6}</div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Story Chapters</h2>
          <Link href="/chapters" className="text-xs font-semibold text-cyan-300 hover:underline">
            Full Expedition Map →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {shownChapters.map((chapter) => {
            const chapterLevels = (levels || []).filter((l) => l.chapter_id === chapter.id);
            const solvedInChapter = chapterLevels.filter(
              (l) => progressMap.get(l.id)?.status === "completed"
            ).length;
            return (
              <div key={chapter.id} className="glass-panel rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                    Chapter {chapter.chapter_number}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${getDifficultyBadgeColor(
                      chapter.difficulty
                    )}`}
                  >
                    {chapter.difficulty}
                  </span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-white">{chapter.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{chapter.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
                  <span className="text-slate-300">
                    Progress: {solvedInChapter} / {chapterLevels.length} solved
                  </span>
                  <Link
                    href="/chapters"
                    className="inline-flex items-center gap-1 font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    Explore
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
