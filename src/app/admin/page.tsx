"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, PlusCircle, CheckCircle2 } from "lucide-react";

export default function AdminPage() {
  const supabase = createClient();
  const [chapters, setChapters] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    chapterId: "",
    levelNumber: 13,
    orderInChapter: 4,
    levelTitle: "",
    locationName: "",
    storyContext: "",
    puzzleType: "riddle",
    puzzleTitle: "",
    instructions: "",
    prompt: "",
    difficulty: "medium",
    basePoints: 120,
    maxLives: 3,
    canonicalAnswer: "",
    validationMode: "exact_insensitive",
    explanation: "",
    hint1: "",
  });

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setIsAdmin(false);
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setIsAdmin(prof?.role === "admin");

      const { data: chaps } = await supabase.from("chapters").select("*").order("chapter_number");
      setChapters(chaps || []);
      if (chaps && chaps.length > 0) {
        setForm((f) => ({ ...f, chapterId: chaps[0].id }));
      }
    }
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setStatusMsg(null);
    const res = await fetch("/api/admin/puzzles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusMsg(`Error: ${JSON.stringify(data.error)}`);
      return;
    }
    setStatusMsg("New level and puzzle published successfully!");
  }

  if (isAdmin === null) return <div className="py-12 text-center text-slate-400">Verifying clearance...</div>;
  if (!isAdmin) {
    return (
      <div className="glass-panel mx-auto max-w-lg rounded-2xl p-8 text-center">
        <Shield className="mx-auto h-10 w-10 text-amber-400" />
        <h1 className="mt-3 text-xl font-bold text-white">Admin Clearance Required</h1>
        <p className="mt-2 text-sm text-slate-400">
          Promote your user role to <code>admin</code> in Supabase <code>public.profiles</code> to
          access the Puzzle Builder Studio.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Puzzle Builder</h1>
          <p className="text-sm text-slate-400">Create and publish new levels, puzzles, answers & hints</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="glass-panel space-y-4 rounded-2xl p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-slate-300">Chapter</label>
            <select
              value={form.chapterId}
              onChange={(e) => setForm({ ...form, chapterId: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  Ch {c.chapter_number}: {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-300">Global Level #</label>
            <input
              type="number"
              value={form.levelNumber}
              onChange={(e) => setForm({ ...form, levelNumber: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-300">Order in Chapter</label>
            <input
              type="number"
              value={form.orderInChapter}
              onChange={(e) => setForm({ ...form, orderInChapter: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Level Title"
            value={form.levelTitle}
            onChange={(e) => setForm({ ...form, levelTitle: e.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
          <input
            required
            placeholder="Location Name"
            value={form.locationName}
            onChange={(e) => setForm({ ...form, locationName: e.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </div>

        <textarea
          required
          placeholder="Story Context"
          value={form.storyContext}
          onChange={(e) => setForm({ ...form, storyContext: e.target.value })}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Puzzle Title"
            value={form.puzzleTitle}
            onChange={(e) => setForm({ ...form, puzzleTitle: e.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
          <select
            value={form.validationMode}
            onChange={(e) => setForm({ ...form, validationMode: e.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <option value="exact_insensitive">Exact (Case-Insensitive)</option>
            <option value="numeric">Numeric</option>
          </select>
        </div>

        <input
          required
          placeholder="Instructions"
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />

        <textarea
          required
          placeholder="Puzzle Prompt / Question"
          value={form.prompt}
          onChange={(e) => setForm({ ...form, prompt: e.target.value })}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Canonical Answer"
            value={form.canonicalAnswer}
            onChange={(e) => setForm({ ...form, canonicalAnswer: e.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
          <input
            placeholder="Hint #1 (Optional)"
            value={form.hint1}
            onChange={(e) => setForm({ ...form, hint1: e.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </div>

        <textarea
          required
          placeholder="Solution Explanation (shown after solving)"
          value={form.explanation}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />

        {statusMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {statusMsg}
          </div>
        )}

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          <PlusCircle className="h-4 w-4" />
          Publish Puzzle Chamber
        </button>
      </form>
    </div>
  );
}
