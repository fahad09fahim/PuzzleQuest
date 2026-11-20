import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Award, CheckCircle2, Sparkles, User } from "lucide-react";

export default async function ProfilePage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: allAchievements }, { data: unlocked }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("achievements").select("*").order("points_reward"),
    supabase.from("user_achievements").select("achievement_id, unlocked_at").eq("user_id", user.id),
  ]);

  const unlockedMap = new Map((unlocked || []).map((u) => [u.achievement_id, u.unlocked_at]));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="glass-panel flex flex-col justify-between gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{profile?.username}</h1>
            <p className="text-sm text-slate-400">{profile?.email}</p>
            <span className="mt-1 inline-block rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase text-violet-300">
              {profile?.role}
            </span>
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <div className="text-xs text-slate-400">Total Score</div>
            <div className="text-2xl font-extrabold text-cyan-300">{profile?.total_score ?? 0}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Levels Solved</div>
            <div className="text-2xl font-extrabold text-emerald-300">
              {profile?.levels_completed ?? 0} / 12
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <Award className="h-5 w-5 text-amber-400" />
          Achievements
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(allAchievements || []).map((ach) => {
            const isUnlocked = unlockedMap.has(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-2xl border p-5 ${
                  isUnlocked
                    ? "border-amber-500/35 bg-amber-500/10"
                    : "border-slate-800 bg-slate-900/40 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Sparkles
                    className={`h-5 w-5 ${isUnlocked ? "text-amber-300" : "text-slate-500"}`}
                  />
                  <span className="text-xs font-bold text-amber-300">+{ach.points_reward} pts</span>
                </div>
                <h3 className="mt-3 font-bold text-white">{ach.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{ach.description}</p>
                {isUnlocked && (
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Unlocked
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
