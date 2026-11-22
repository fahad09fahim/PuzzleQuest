"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Ban,
  CheckCircle2,
  Loader2,
  Pencil,
  RotateCcw,
  Search,
  ShieldCheck,
  Undo2,
  Users,
} from "lucide-react";

interface UserRow {
  id: string;
  username: string;
  email: string;
  role: string;
  total_score: number;
  levels_completed: number;
  is_banned: boolean;
  created_at: string;
}

export function UserManagement() {
  const supabase = createClient();
  const router = useRouter();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [pointsDraft, setPointsDraft] = useState("0");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("profiles")
      .select(
        "id, username, email, role, total_score, levels_completed, is_banned, created_at"
      )
      .order("created_at", { ascending: true });

    if (err) {
      setError(
        `${err.message} — if the column is missing, run supabase/migrations/002_admin_user_management.sql in the Supabase SQL Editor.`
      );
    } else {
      setError(null);
      setUsers((data as UserRow[]) || []);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patch(body: { userId: string; totalScore?: number; isBanned?: boolean }) {
    setBusyId(body.userId);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
        return;
      }
      setNotice(
        body.isBanned === true
          ? "User banned — they can no longer sign in."
          : body.isBanned === false
          ? "User unbanned — they can sign in again."
          : body.totalScore === 0
          ? "Points reset to 0."
          : "Points updated."
      );
      await load();
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setBusyId(null);
    }
  }

  function savePoints(id: string) {
    const value = Number(pointsDraft);
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
      setError("Points must be a whole number of 0 or more.");
      return;
    }
    setEditingId(null);
    patch({ userId: id, totalScore: value });
  }

  function confirmReset(user: UserRow) {
    if (window.confirm(`Reset ${user.username}'s total score to 0?`)) {
      patch({ userId: user.id, totalScore: 0 });
    }
  }

  function confirmBan(user: UserRow) {
    if (user.is_banned) {
      if (window.confirm(`Unban ${user.username}? They will be able to sign in again.`)) {
        patch({ userId: user.id, isBanned: false });
      }
    } else if (
      window.confirm(
        `Ban ${user.username}? They will be signed out immediately and cannot play challenges.`
      )
    ) {
      patch({ userId: user.id, isBanned: true });
    }
  }

  const filtered = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="glass-panel rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-violet-300" />
          <h2 className="text-lg font-bold text-white">User Management</h2>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="w-48 rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {notice && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading users...
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/70 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3">Solved</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                const busy = busyId === u.id;
                const editing = editingId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{u.username}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
                          <ShieldCheck className="h-3 w-3" /> admin
                        </span>
                      ) : (
                        <span className="text-slate-400">player</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            value={pointsDraft}
                            onChange={(e) => setPointsDraft(e.target.value)}
                            className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white outline-none focus:border-cyan-400"
                          />
                          <button
                            onClick={() => savePoints(u.id)}
                            disabled={busy}
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-cyan-300">{u.total_score} pts</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{u.levels_completed}</td>
                    <td className="px-4 py-3">
                      {u.is_banned ? (
                        <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-300">
                          Banned
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : (
                          <>
                            <button
                              disabled={isSelf}
                              title={isSelf ? "You cannot edit your own points here" : "Edit points"}
                              onClick={() => {
                                setEditingId(u.id);
                                setPointsDraft(String(u.total_score));
                                setNotice(null);
                                setError(null);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-500 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Points
                            </button>
                            <button
                              disabled={isSelf || u.total_score === 0}
                              title={isSelf ? "You cannot reset your own points" : "Reset points to 0"}
                              onClick={() => confirmReset(u)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-amber-500 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Reset
                            </button>
                            <button
                              disabled={isSelf}
                              title={isSelf ? "You cannot ban yourself" : "Ban / unban"}
                              onClick={() => confirmBan(u)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                u.is_banned
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                                  : "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                              }`}
                            >
                              {u.is_banned ? (
                                <>
                                  <Undo2 className="h-3.5 w-3.5" /> Unban
                                </>
                              ) : (
                                <>
                                  <Ban className="h-3.5 w-3.5" /> Ban
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
