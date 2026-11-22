import Link from "next/link";
import {
  Compass,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authenticated explorers continue their journey instead of being
  // bounced back to the sign-in / register pages.
  const isSignedIn = !!user;
  const expeditionHref = isSignedIn ? "/dashboard" : "/register";
  const resumeHref = isSignedIn ? "/dashboard" : "/login";

  const features = [
    {
      icon: KeyRound,
      title: "12 Distinct Puzzle Mechanics",
      desc: "Caesar & substitution ciphers, anagram tile builders, memory relic grids, interactive hotspot rooms, and multi-stage overrides.",
    },
    {
      icon: ShieldCheck,
      title: "Server-Verified Security",
      desc: "Answers stay locked behind PostgreSQL Row-Level Security and are validated exclusively on the server.",
    },
    {
      icon: Zap,
      title: "Dynamic Bonus Scoring",
      desc: "Earn multipliers for first-attempt solves, zero-hint mastery, and speed par runs.",
    },
    {
      icon: Trophy,
      title: "Global Leaderboard & Badges",
      desc: "Unlock 6 progression achievements and compete for top rank across Aethelgard.",
    },
  ];

  return (
    <div className="space-y-16 py-6">
      <section className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-b from-[#131b33]/90 to-[#0d1224]/95 p-8 sm:p-14">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />4 Chapters • 12 Mystery Chambers
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Unravel the Secrets of the{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              Astral Engine
            </span>
          </h1>
          <p className="text-lg leading-relaxed text-slate-300">
            Step into a story-driven mystery adventure where cryptography,
            deductive paradoxes, and ancient mechanisms guard the wisdom of
            Aethelgard.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href={expeditionHref}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:scale-[1.01]"
            >
              <Compass className="h-4 w-4" />
              {isSignedIn ? "Continue Expedition" : "Begin Expedition"}
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              View Leaderboard
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="glass-panel rounded-2xl p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {f.desc}
              </p>
            </div>
          );
        })}
      </section>

      <section className="glass-panel rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-white">
              Four Chapters of Escalating Mystery
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Complete each chamber sequentially to unlock deeper vaults of the
              Astral Engine.
            </p>
          </div>
          <Link
            href={resumeHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            <Lock className="h-4 w-4" />
            {isSignedIn ? "Resume Saved Progress →" : "Sign in to Resume Progress →"}
          </Link>
        </div>
      </section>
    </div>
  );
}
