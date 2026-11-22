"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Heart,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Send,
  Sparkles,
  Eye,
} from "lucide-react";
import type { Level, PlayerProgress, Puzzle, ScoreBreakdown } from "@/types/database";
import { formatPuzzleCategory, formatSeconds, getDifficultyBadgeColor } from "@/lib/utils";

interface PuzzleRoomProps {
  level: Level;
  puzzle: Puzzle;
  initialProgress: PlayerProgress;
  totalHintsCount: number;
  /** Admins get view-only access: no submissions, hints, or resets. */
  readOnly?: boolean;
}

export function PuzzleRoom({
  level,
  puzzle,
  initialProgress,
  totalHintsCount,
  readOnly = false,
}: PuzzleRoomProps) {
  const [answer, setAnswer] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [lives, setLives] = useState(initialProgress.lives_remaining ?? puzzle.max_lives);
  const [hints, setHints] = useState<{ hint_order: number; hint_text: string }[]>([]);
  const [hintsRevealedCount, setHintsRevealedCount] = useState(initialProgress.hints_revealed || 0);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [solvedData, setSolvedData] = useState<{
    explanation: string;
    scoreBreakdown: ScoreBreakdown;
    nextLevelId: string | null;
    newlyUnlockedAchievements: any[];
  } | null>(null);

  // Specialized interactive widget states
  const [caesarShift, setCaesarShift] = useState(0);
  const [selectedTileIndices, setSelectedTileIndices] = useState<number[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [inspectedHotspots, setInspectedHotspots] = useState<Record<string, string>>({});
  const [multiSteps, setMultiSteps] = useState<string[]>(["", "", ""]);

  useEffect(() => {
    if (solvedData || readOnly) return;
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [solvedData, readOnly]);

  // Memory deck for memory puzzle
  const memoryDeck = useMemo(() => {
    if (puzzle.puzzle_type !== "memory" || !Array.isArray(puzzle.config?.pairs)) return [];
    const cards = puzzle.config.pairs.flatMap((pair: any, idx: number) => [
      { uid: `${pair.id}-a-${idx}`, pairId: pair.id, label: pair.label, symbol: pair.symbol },
      { uid: `${pair.id}-b-${idx}`, pairId: pair.id, label: pair.label, symbol: pair.symbol },
    ]);
    return cards;
  }, [puzzle]);

  function handleFlipCard(index: number) {
    if (flippedIndices.length >= 2 || flippedIndices.includes(index)) return;
    const card = memoryDeck[index];
    if (!card || matchedIds.includes(card.pairId)) return;

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      const [firstIdx, secondIdx] = nextFlipped;
      if (memoryDeck[firstIdx].pairId === memoryDeck[secondIdx].pairId) {
        const nextMatched = [...matchedIds, card.pairId];
        setMatchedIds(nextMatched);
        setFlippedIndices([]);
        if (nextMatched.length === puzzle.config.pairs.length) {
          setAnswer(puzzle.config.completionToken || "MEM_SYNC_6_PAIRS_VERIFIED");
        }
      } else {
        setTimeout(() => setFlippedIndices([]), 750);
      }
    }
  }

  function decodeCaesar(text: string, shift: number) {
    return text.replace(/[A-Z]/g, (ch) => {
      const code = ((ch.charCodeAt(0) - 65 + shift + 26) % 26) + 65;
      return String.fromCharCode(code);
    });
  }

  async function handleRequestHint() {
    const res = await fetch("/api/puzzles/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzleId: puzzle.id, levelId: level.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setHints(data.hints || []);
      setHintsRevealedCount(data.hintsRevealed || 0);
    }
  }

  async function handleResetChamber() {
    const res = await fetch("/api/puzzles/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzleId: puzzle.id, levelId: level.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setLives(data.livesRemaining);
      setFeedback("Chamber energy restored. Try again!");
    }
  }

  async function handleSubmit(overrideAnswer?: string) {
    const finalAnswer =
      overrideAnswer ??
      (puzzle.puzzle_type === "multi_step" ? JSON.stringify(multiSteps) : answer);
    if (!finalAnswer.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    const res = await fetch("/api/puzzles/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        puzzleId: puzzle.id,
        levelId: level.id,
        answer: finalAnswer,
        elapsedSeconds: elapsed,
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setFeedback(data.error || "Submission failed");
      return;
    }

    if (!data.correct) {
      setLives(data.livesRemaining);
      setFeedback(data.message);
      return;
    }

    setSolvedData(data);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/chapters"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Chapters
        </Link>

        <div className="flex items-center gap-3">
          {readOnly ? (
            <div className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
              <Eye className="h-3.5 w-3.5" />
              Preview Mode
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-200">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                {formatSeconds(elapsed)}
              </div>
              <div className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
                {Array.from({ length: puzzle.max_lives }).map((_, idx) => (
                  <Heart
                    key={idx}
                    className={`h-3.5 w-3.5 ${
                      idx < lives ? "fill-rose-400 text-rose-400" : "text-slate-600"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Level {level.level_number} • {level.location_name}
            </span>
            <h1 className="mt-1 text-2xl font-bold text-white">{puzzle.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-cyan-300">
              {formatPuzzleCategory(puzzle.puzzle_type)}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getDifficultyBadgeColor(
                puzzle.difficulty
              )}`}
            >
              {puzzle.difficulty}
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm italic text-slate-400">{level.story_context}</p>

        <div className="mt-6 rounded-2xl border border-violet-500/25 bg-[#090d1c] p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            Instructions
          </div>
          <p className="mt-1 text-sm text-slate-300">{puzzle.instructions}</p>
          <div className="mt-4 whitespace-pre-line rounded-xl bg-slate-900/90 p-4 font-mono text-sm leading-relaxed text-white">
            {puzzle.prompt}
          </div>
        </div>

        {/* Interactive Puzzle Type Specific Tools */}
        {puzzle.puzzle_type === "caesar_cipher" && (
          <div className="mt-5 rounded-2xl border border-cyan-500/25 bg-cyan-950/15 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-200">
              <span>Interactive Caesar Shift Decoder (Preview Shift: {caesarShift})</span>
              <input
                type="range"
                min={-13}
                max={13}
                value={caesarShift}
                onChange={(e) => setCaesarShift(Number(e.target.value))}
                className="accent-cyan-400"
              />
            </div>
            <div className="mt-2 font-mono text-sm text-white">
              {decodeCaesar(puzzle.config?.ciphertext || "", caesarShift)}
            </div>
          </div>
        )}

        {puzzle.puzzle_type === "word" && Array.isArray(puzzle.config?.scrambledLetters) && (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {puzzle.config.scrambledLetters.map((letter: string, idx: number) => {
                const used = selectedTileIndices.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={used}
                    onClick={() => {
                      const next = [...selectedTileIndices, idx];
                      setSelectedTileIndices(next);
                      setAnswer(next.map((i) => puzzle.config.scrambledLetters[i]).join(""));
                    }}
                    className="h-11 w-11 rounded-xl border border-violet-500/40 bg-violet-500/15 font-mono text-base font-bold text-white disabled:opacity-30"
                  >
                    {letter}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setSelectedTileIndices([]);
                  setAnswer("");
                }}
                className="rounded-xl border border-slate-700 px-3 text-xs text-slate-300"
              >
                Clear Tiles
              </button>
            </div>
          </div>
        )}

        {puzzle.puzzle_type === "memory" && (
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {memoryDeck.map((card: any, idx: number) => {
              const isRevealed =
                flippedIndices.includes(idx) || matchedIds.includes(card.pairId);
              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleFlipCard(idx)}
                  className={`flex h-20 flex-col items-center justify-center rounded-xl border text-center transition ${
                    isRevealed
                      ? "border-cyan-400/50 bg-cyan-500/15 text-white"
                      : "border-slate-700 bg-slate-900/90 text-slate-500 hover:border-violet-500/50"
                  }`}
                >
                  {isRevealed ? (
                    <>
                      <span className="text-2xl">{card.symbol}</span>
                      <span className="mt-1 text-[11px] font-medium">{card.label}</span>
                    </>
                  ) : (
                    <HelpCircle className="h-6 w-6" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {(puzzle.puzzle_type === "multiple_choice" || puzzle.puzzle_type === "pattern") && (
          <div className="mt-5 space-y-3">
            {Array.isArray(puzzle.config?.grid) && (
              <div className="grid max-w-xs grid-cols-3 gap-2">
                {puzzle.config.grid.flat().map((cell: string, i: number) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-700 bg-slate-900 py-2.5 text-center font-mono text-sm text-white"
                  >
                    {cell}
                  </div>
                ))}
              </div>
            )}
            <div className="grid gap-2.5 sm:grid-cols-2">
              {(puzzle.config?.options || puzzle.config?.choices || []).map((opt: any) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAnswer(opt.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    answer === opt.id
                      ? "border-cyan-400 bg-cyan-500/20 text-white"
                      : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {puzzle.puzzle_type === "hidden_clues" && Array.isArray(puzzle.config?.hotspots) && (
          <div className="mt-5 space-y-3">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {puzzle.config.hotspots.map((spot: any) => (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() =>
                    setInspectedHotspots((prev) => ({ ...prev, [spot.id]: spot.clue }))
                  }
                  className="rounded-xl border border-violet-500/30 bg-slate-900/80 p-3.5 text-left hover:border-cyan-400"
                >
                  <div className="text-xs font-bold text-cyan-300">Inspect: {spot.name}</div>
                  {inspectedHotspots[spot.id] ? (
                    <p className="mt-1 text-xs text-slate-200">{inspectedHotspots[spot.id]}</p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">Click to examine relic...</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {puzzle.puzzle_type === "multi_step" && Array.isArray(puzzle.config?.steps) && (
          <div className="mt-5 space-y-3">
            {puzzle.config.steps.map((st: any, idx: number) => (
              <div key={st.stepNumber} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs font-bold text-violet-300">{st.title}</div>
                <p className="mt-1 text-sm text-slate-200">{st.prompt}</p>
                <input
                  type="text"
                  value={multiSteps[idx] || ""}
                  onChange={(e) => {
                    const copy = [...multiSteps];
                    copy[idx] = e.target.value;
                    setMultiSteps(copy);
                  }}
                  placeholder={st.placeholder}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
            ))}
          </div>
        )}

        {/* Answer Input & Actions */}
        {readOnly ? (
          <div className="mt-6 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
              <Eye className="h-4 w-4" /> View-only preview
            </div>
            <p className="mt-2 text-xs leading-relaxed text-amber-100/85">
              Admin accounts cannot attempt challenges. Answer submission, hints, and chamber
              resets are disabled — you are viewing this challenge as an observer.
            </p>
          </div>
        ) : !solvedData ? (
          <div className="mt-6 space-y-4">
            {puzzle.puzzle_type !== "multi_step" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Your Solution
                </label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={puzzle.config?.placeholder || "Enter your answer..."}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                />
              </div>
            )}

            {feedback && (
              <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-200">
                {feedback}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRequestHint}
                disabled={hintsRevealedCount >= totalHintsCount}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-200 disabled:opacity-50"
              >
                <Lightbulb className="h-4 w-4" />
                Reveal Hint ({hintsRevealedCount}/{totalHintsCount}) • -{puzzle.hint_penalty} pts
              </button>

              {lives === 0 ? (
                <button
                  type="button"
                  onClick={handleResetChamber}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore Energy Seals
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Verifying..." : "Submit Solution"}
                </button>
              )}
            </div>

            {hints.length > 0 && (
              <div className="space-y-2 rounded-xl border border-amber-500/25 bg-amber-950/15 p-4">
                {hints.map((h) => (
                  <div key={h.hint_order} className="text-xs text-amber-100">
                    <span className="font-bold text-amber-300">Hint {h.hint_order}:</span>{" "}
                    {h.hint_text}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-5 rounded-2xl border border-emerald-500/35 bg-emerald-950/20 p-6">
            <div className="flex items-center gap-2.5 text-lg font-bold text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
              Chamber Unlocked! +{solvedData.scoreBreakdown.totalPoints} Points
            </div>
            <p className="text-sm leading-relaxed text-slate-200">{solvedData.explanation}</p>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950/70 p-4 text-xs sm:grid-cols-4">
              <div>
                <span className="text-slate-400">Base:</span>{" "}
                <strong className="text-white">+{solvedData.scoreBreakdown.basePoints}</strong>
              </div>
              <div>
                <span className="text-slate-400">1st Try:</span>{" "}
                <strong className="text-cyan-300">
                  +{solvedData.scoreBreakdown.firstAttemptBonus}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">No Hints:</span>{" "}
                <strong className="text-violet-300">
                  +{solvedData.scoreBreakdown.noHintsBonus}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Speed:</span>{" "}
                <strong className="text-amber-300">+{solvedData.scoreBreakdown.timeBonus}</strong>
              </div>
            </div>

            {solvedData.newlyUnlockedAchievements?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {solvedData.newlyUnlockedAchievements.map((a: any) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Achievement Unlocked: {a.title}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-2">
              {solvedData.nextLevelId ? (
                <Link
                  href={`/levels/${solvedData.nextLevelId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Proceed to Next Chamber
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  View Final Standings
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
