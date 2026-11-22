"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2, Pencil, PlusCircle, X } from "lucide-react";

interface ChapterOption {
  id: string;
  chapter_number: number;
  title: string;
}

interface FormState {
  chapterId: string;
  levelNumber: number;
  orderInChapter: number;
  levelTitle: string;
  locationName: string;
  storyContext: string;
  puzzleType: string;
  puzzleTitle: string;
  instructions: string;
  prompt: string;
  difficulty: string;
  basePoints: number;
  maxLives: number;
  validationMode: string;
  canonicalAnswer: string;
  explanation: string;
  hint1: string;
}

const PUZZLE_TYPES = [
  "riddle",
  "math",
  "logic",
  "sequence",
  "pattern",
  "multiple_choice",
  "word",
  "caesar_cipher",
  "substitution_cipher",
  "memory",
  "hidden_clues",
  "multi_step",
];

const inputCls =
  "w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-300">{label}</label>
      {children}
    </div>
  );
}

interface ModalProps {
  mode: "add" | "edit";
  chapters: ChapterOption[];
  levelId?: string;
  initial?: FormState;
  onClose: () => void;
  onSaved: () => void;
}

function ChallengeModal({ mode, chapters, levelId, initial, onClose, onSaved }: ModalProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(
    initial ?? {
      chapterId: chapters[0]?.id ?? "",
      levelNumber: 1,
      orderInChapter: 1,
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
      validationMode: "exact_insensitive",
      canonicalAnswer: "",
      explanation: "",
      hint1: "",
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/puzzles", {
        method: mode === "add" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "add" ? form : { levelId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data.error === "string" ? data.error : JSON.stringify(data.error ?? "Save failed");
        setError(msg);
        return;
      }
      setSaved(true);
      router.refresh();
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        onClick={onClose}
      >
        <div
          role="dialog"
          className="glass-panel w-full max-w-sm rounded-2xl p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
          <h2 className="mt-3 text-lg font-bold text-white">
            {mode === "add" ? "Challenge published!" : "Challenge updated!"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            The chapters list has been refreshed with your changes.
          </p>
          <button
            onClick={onClose}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="glass-panel max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white">
            {mode === "add" ? "Add New Challenge" : "Edit Challenge"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Chapter">
              <select
                required
                value={form.chapterId}
                onChange={(e) => set("chapterId", e.target.value)}
                className={inputCls}
              >
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    Ch {c.chapter_number}: {c.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Global Level #">
              <input
                type="number"
                required
                min={1}
                value={form.levelNumber}
                onChange={(e) => set("levelNumber", Number(e.target.value))}
                className={inputCls}
              />
            </Field>
            <Field label="Order in Chapter">
              <input
                type="number"
                required
                min={1}
                value={form.orderInChapter}
                onChange={(e) => set("orderInChapter", Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Level Title">
              <input
                required
                value={form.levelTitle}
                onChange={(e) => set("levelTitle", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Location Name">
              <input
                required
                value={form.locationName}
                onChange={(e) => set("locationName", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Story Context">
            <textarea
              required
              rows={2}
              value={form.storyContext}
              onChange={(e) => set("storyContext", e.target.value)}
              className={inputCls}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Puzzle Title">
              <input
                required
                value={form.puzzleTitle}
                onChange={(e) => set("puzzleTitle", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Puzzle Type">
              <select
                value={form.puzzleType}
                onChange={(e) => set("puzzleType", e.target.value)}
                className={inputCls}
              >
                {PUZZLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Difficulty">
              <select
                value={form.difficulty}
                onChange={(e) => set("difficulty", e.target.value)}
                className={inputCls}
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
                <option value="expert">expert</option>
              </select>
            </Field>
          </div>

          <Field label="Instructions">
            <input
              required
              value={form.instructions}
              onChange={(e) => set("instructions", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Puzzle Prompt / Question">
            <textarea
              required
              rows={3}
              value={form.prompt}
              onChange={(e) => set("prompt", e.target.value)}
              className={inputCls}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Validation Mode">
              <select
                value={form.validationMode}
                onChange={(e) => set("validationMode", e.target.value)}
                className={inputCls}
              >
                <option value="exact_insensitive">Exact (Case-Insensitive)</option>
                <option value="numeric">Numeric</option>
                <option value="json_steps">JSON Steps</option>
                <option value="memory_token">Memory Token</option>
              </select>
            </Field>
            <Field label="Base Points">
              <input
                type="number"
                required
                min={10}
                max={2000}
                value={form.basePoints}
                onChange={(e) => set("basePoints", Number(e.target.value))}
                className={inputCls}
              />
            </Field>
            <Field label="Max Lives">
              <input
                type="number"
                required
                min={1}
                max={10}
                value={form.maxLives}
                onChange={(e) => set("maxLives", Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Canonical Answer">
              <input
                required
                value={form.canonicalAnswer}
                onChange={(e) => set("canonicalAnswer", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Hint #1 (leave empty to clear)">
              <input
                value={form.hint1}
                onChange={(e) => set("hint1", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Solution Explanation (shown after solving)">
            <textarea
              required
              rows={2}
              value={form.explanation}
              onChange={(e) => set("explanation", e.target.value)}
              className={inputCls}
            />
          </Field>

          {error && (
            <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "add" ? (
                <PlusCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {saving ? "Saving..." : mode === "add" ? "Publish Challenge" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddChallengeButton({
  chapters,
  nextLevelNumber = 1,
}: {
  chapters: ChapterOption[];
  nextLevelNumber?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 transition hover:opacity-95"
      >
        <PlusCircle className="h-4 w-4" />
        Add Challenge
      </button>
      {open && (
        <ChallengeModal
          mode="add"
          chapters={chapters}
          initial={{
            chapterId: chapters[0]?.id ?? "",
            levelNumber: nextLevelNumber,
            orderInChapter: 1,
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
            validationMode: "exact_insensitive",
            canonicalAnswer: "",
            explanation: "",
            hint1: "",
          }}
          onClose={() => setOpen(false)}
          onSaved={() => {}}
        />
      )}
    </>
  );
}

export function EditChallengeButton({
  levelId,
  chapters,
}: {
  levelId: string;
  chapters: ChapterOption[];
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState<FormState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function handleOpen() {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("levels")
      .select("*, puzzles(*, puzzle_answers(*), puzzle_hints(*))")
      .eq("id", levelId)
      .single();

    if (error || !data) {
      setLoadError(error?.message || "Challenge not found");
      setLoading(false);
      return;
    }

    const puzzle: any = Array.isArray(data.puzzles) ? data.puzzles[0] : data.puzzles;
    const answer: any = Array.isArray(puzzle?.puzzle_answers)
      ? puzzle.puzzle_answers[0]
      : puzzle?.puzzle_answers;
    const hints: any[] = Array.isArray(puzzle?.puzzle_hints) ? puzzle.puzzle_hints : [];
    const hint1 = hints.find((h) => h.hint_order === 1)?.hint_text ?? "";

    setInitial({
      chapterId: data.chapter_id,
      levelNumber: data.level_number,
      orderInChapter: data.order_in_chapter,
      levelTitle: data.title,
      locationName: data.location_name,
      storyContext: data.story_context,
      puzzleType: puzzle?.puzzle_type ?? "riddle",
      puzzleTitle: puzzle?.title ?? "",
      instructions: puzzle?.instructions ?? "",
      prompt: puzzle?.prompt ?? "",
      difficulty: puzzle?.difficulty ?? "medium",
      basePoints: puzzle?.base_points ?? 120,
      maxLives: puzzle?.max_lives ?? 3,
      validationMode: answer?.validation_mode ?? "exact_insensitive",
      canonicalAnswer: answer?.canonical_answer ?? "",
      explanation: answer?.explanation ?? "",
      hint1,
    });
    setLoading(false);
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={loading}
        aria-label="Edit challenge"
        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Pencil className="h-3.5 w-3.5" />
        )}
        Edit
      </button>
      {loadError && (
        <span className="self-center text-xs text-rose-300">{loadError}</span>
      )}
      {open && initial && (
        <ChallengeModal
          mode="edit"
          chapters={chapters}
          levelId={levelId}
          initial={initial}
          onClose={() => setOpen(false)}
          onSaved={() => {}}
        />
      )}
    </>
  );
}
