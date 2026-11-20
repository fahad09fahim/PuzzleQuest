import { createServerSupabase } from "@/lib/supabase/server";
import { Medal, Trophy } from "lucide-react";

export default async function LeaderboardPage() {
  const supabase = createServerSupabase();
  const { data: leaders } = await supabase
    .from("profiles")
    .select("id, username, total_score, levels_completed")
    .order("total_score", { ascending: false })
    .order("levels_completed", { ascending: false })
    .limit(25);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Hall of Seekers</h1>
          <p className="text-sm text-slate-400">Top puzzle solvers ranked by cumulative points</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/70 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-5 py-3.5">Rank</th>
              <th className="px-5 py-3.5">Explorer</th>
              <th className="px-5 py-3.5">Solved</th>
              <th className="px-5 py-3.5 text-right">Total Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {(leaders || []).map((player, idx) => (
              <tr key={player.id} className="hover:bg-slate-800/30">
                <td className="px-5 py-4 font-bold text-slate-200">
                  {idx < 3 ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-300">
                      <Medal className="h-4 w-4" /> #{idx + 1}
                    </span>
                  ) : (
                    `#${idx + 1}`
                  )}
                </td>
                <td className="px-5 py-4 font-semibold text-white">{player.username}</td>
                <td className="px-5 py-4 text-slate-300">{player.levels_completed} / 12</td>
                <td className="px-5 py-4 text-right font-bold text-cyan-300">
                  {player.total_score} pts
                </td>
              </tr>
            ))}
            {(!leaders || leaders.length === 0) && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                  No explorers ranked yet. Be the first to solve Chapter 1!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
