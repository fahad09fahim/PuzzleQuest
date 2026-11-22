import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { CheckCircle2, Eye, Lock, Play, Sparkles } from "lucide-react";
import { formatPuzzleCategory, getDifficultyBadgeColor } from "@/lib/utils";
import { AddChallengeButton, EditChallengeButton } from "@/components/admin/ChallengeEditor";

export default async function ChaptersPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: chapters }, { data: levels }, { data: puzzles }, { data: progress }, { data: me }] =
    await Promise.all([
      supabase.from("chapters").select("*").order("chapter_number"),
      supabase.from("levels").select("*").order("level_number"),
      supabase.from("puzzles").select("id, level_id, puzzle_type, difficulty, base_points"),
      supabase.from("player_progress").select("*").eq("user_id", user.id),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);

  // Admins can view every challenge but never play them.
  const isAdmin = me?.role === "admin";

  const progressMap = new Map((progress || []).map((p) => [p.level_id, p]));
  const puzzleByLevel = new Map((puzzles || []).map((pz) => [pz.level_id, pz]));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Expedition Chapters</h1>
          <p className="mt-1 text-sm text-slate-400">
            Unlock each chamber sequentially by solving its mystery puzzle.
          </p>
        </div>
        {isAdmin && (
          <AddChallengeButton
            chapters={chapters || []}
            nextLevelNumber={(levels?.[levels.length - 1]?.level_number ?? 0) + 1}
          />
        )}
      </div>

      {(chapters || []).map((chapter) => {
        const chapterLevels = (levels || []).filter((l) => l.chapter_id === chapter.id);
        return (
          <section key={chapter.id} className="glass-panel rounded-3xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Chapter {chapter.chapter_number} • {chapter.theme}
                </div>
                <h2 className="mt-1 text-2xl font-bold text-white">{chapter.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{chapter.story_intro}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getDifficultyBadgeColor(
                  chapter.difficulty
                )}`}
              >
                {chapter.difficulty}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {chapterLevels.map((level) => {
                const prog = progressMap.get(level.id);
                const status = prog?.status || (level.level_number === 1 ? "unlocked" : "locked");
                const pz = puzzleByLevel.get(level.id);
                const isLocked = status === "locked" && !isAdmin;

                return (
                  <div
                    key={level.id}
                    className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
                      isLocked
                        ? "border-slate-800/80 bg-slate-900/40 opacity-65"
                        : status === "completed"
                        ? "border-emerald-500/30 bg-emerald-950/15"
                        : "border-violet-500/35 bg-slate-900/75"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-400">
                          Level {level.level_number}
                        </span>
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                            <Eye className="h-3.5 w-3.5" /> View Only
                          </span>
                        ) : status === "completed" ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Solved
                          </span>
                        ) : isLocked ? (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <Lock className="h-3.5 w-3.5" /> Locked
                          </span>
                        ) : (
                          <span className="font-semibold text-cyan-300">Unlocked</span>
                        )}
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-white">{level.title}</h3>
                      <p className="mt-1 text-xs text-slate-400">{level.location_name}</p>
                      {pz && (
                        <div className="mt-3 inline-block rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-violet-200">
                          {formatPuzzleCategory(pz.puzzle_type)} • {pz.base_points} pts
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex items-stretch gap-2">
                      {isLocked ? (
                        <div className="w-full rounded-xl bg-slate-800/70 py-2 text-center text-xs font-medium text-slate-500">
                          Complete Previous Level
                        </div>
                      ) : (
                        <Link
                          href={`/levels/${level.id}`}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-2.5 text-xs font-semibold text-white hover:opacity-95"
                        >
                          {isAdmin ? (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              View Chamber
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5" />
                              {status === "completed" ? "Replay Chamber" : "Enter Chamber"}
                            </>
                          )}
                        </Link>
                      )}
                      {isAdmin && (
                        <EditChallengeButton levelId={level.id} chapters={chapters || []} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
