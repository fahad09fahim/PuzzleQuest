"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, LayoutDashboard, Trophy, User, Shield, LogOut, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(user);
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (mounted) setProfile(data);
      }
    }
    load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, auth: true },
    { href: "/chapters", label: "Chapters", icon: Compass, auth: true },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy, auth: false },
    { href: "/profile", label: "Profile", icon: User, auth: true },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070913]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-lg font-bold tracking-tight text-transparent">
            PuzzleQuest
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks
            .filter((item) => !item.auth || user)
            .map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-violet-500/15 text-violet-200"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname.startsWith("/admin")
                  ? "bg-amber-500/15 text-amber-200"
                  : "text-amber-400/80 hover:bg-slate-800/60 hover:text-amber-200"
              )}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {profile && (
                profile.role === "admin" ? (
                  <div className="hidden items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200 sm:flex">
                    <Shield className="h-3.5 w-3.5" />
                    Admin
                  </div>
                ) : (
                  <div className="hidden rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200 sm:block">
                    {profile.total_score} pts
                  </div>
                )
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-md shadow-violet-600/20 hover:opacity-95"
              >
                Start Quest
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
