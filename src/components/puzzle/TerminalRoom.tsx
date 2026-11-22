"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Lightbulb, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { Level, Puzzle } from "@/types/database";

type Tone = "sys" | "cmd" | "ok" | "err" | "info" | "dim";

interface TermLine {
  id: number;
  text: string;
  tone: Tone;
  instant?: boolean;
}

interface TerminalRoomProps {
  level: Level;
  puzzle: Puzzle;
  lives: number;
  hints: { hint_order: number; hint_text: string }[];
  hintsRevealedCount: number;
  totalHintsCount: number;
  submitting: boolean;
  onSubmit: (answer: string) => Promise<{ ok: boolean; message?: string }>;
  onRequestHint: () => Promise<void> | void;
  onReset: () => Promise<void> | void;
}

const TONE: Record<Tone, string> = {
  sys: "text-emerald-400",
  cmd: "font-semibold text-emerald-100",
  ok: "font-semibold text-emerald-200",
  err: "text-rose-400",
  info: "text-emerald-300/85",
  dim: "text-emerald-600/80",
};

const MUTE_KEY = "pq_terminal_muted";

export function TerminalRoom({
  level,
  puzzle,
  lives,
  hints,
  hintsRevealedCount,
  totalHintsCount,
  submitting,
  onSubmit,
  onRequestHint,
  onReset,
}: TerminalRoomProps) {
  const router = useRouter();
  const config = (puzzle.config || {}) as any;
  const hostname = config.hostname || "critical-terminal";
  const cwd = config.cwd || "/home/investigator";
  const prompt = `root@${hostname}:~$`;

  // ------------------------------------------------------------------
  // Typewriter engine
  // ------------------------------------------------------------------
  const [display, setDisplay] = useState<TermLine[]>([]);
  const [current, setCurrent] = useState<TermLine | null>(null);
  const queueRef = useRef<TermLine[]>([]);
  const busyRef = useRef(false);
  const currentRef = useRef<TermLine | null>(null);
  const typedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);
  const bootedRef = useRef(false);

  const stopTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pauseRef.current) {
      clearTimeout(pauseRef.current);
      pauseRef.current = null;
    }
  }, []);

  const processNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) {
      busyRef.current = false;
      currentRef.current = null;
      setCurrent(null);
      return;
    }
    busyRef.current = true;

    if (next.instant) {
      setDisplay((d) => [...d, next]);
      pauseRef.current = setTimeout(processNext, 24);
      return;
    }

    let i = 0;
    currentRef.current = next;
    typedRef.current = 0;
    setCurrent({ ...next, text: "" });
    timerRef.current = setInterval(() => {
      i += 1;
      typedRef.current = i;
      setCurrent({ ...next, text: next.text.slice(0, i) });
      if (i >= next.text.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setDisplay((d) => [...d, next]);
        currentRef.current = null;
        pauseRef.current = setTimeout(processNext, 80);
      }
    }, 16);
  }, []);

  const push = useCallback(
    (lines: Array<{ text: string; tone: Tone; instant?: boolean }>) => {
      const next = lines.map((l) => ({ ...l, id: idRef.current++ }));
      queueRef.current.push(...next);
      if (!busyRef.current) processNext();
    },
    [processNext]
  );

  // Boot sequence (guarded so StrictMode's double-invoke doesn't duplicate it).
  useEffect(() => {
    if (!bootedRef.current) {
      bootedRef.current = true;
      push([
        { text: "CRITICAL TERMINAL v2.1 — RESTRICTED SHELL", tone: "sys" },
        { text: `Connecting to ${hostname}.internal ... ESTABLISHED`, tone: "dim" },
        { text: "Identity: cybersecurity investigator (clearance: PROVISIONAL)", tone: "dim" },
        { text: `MISSION: ${config.objective || "Solve the case file."}`, tone: "info" },
        { text: "Type 'help' for commands. Every command you execute is logged.", tone: "info" },
        { text: "", tone: "dim", instant: true },
      ]);
    } else if (!busyRef.current && queueRef.current.length > 0) {
      processNext();
    }
    return () => {
      stopTimers();
      const partial = currentRef.current;
      if (partial && typedRef.current < partial.text.length) {
        setDisplay((d) => [...d, partial]);
      }
      currentRef.current = null;
      busyRef.current = false;
      setCurrent(null);
    };
  }, [push, processNext, stopTimers, hostname, config.objective]);

  // ------------------------------------------------------------------
  // Sound (Web Audio — no asset files) with a persisted mute toggle
  // ------------------------------------------------------------------
  const mutedRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(MUTE_KEY) === "1") {
        mutedRef.current = true;
        setMuted(true);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const blip = useCallback((freq: number, dur = 0.06, type: OscillatorType = "square", vol = 0.03) => {
    if (mutedRef.current) return;
    try {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return;
      if (!audioRef.current) audioRef.current = new Ctor();
      const ctx = audioRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = vol;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    } catch {
      /* audio unavailable */
    }
  }, []);

  const soundOk = useCallback(() => {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => blip(f, 0.12, "triangle", 0.05), i * 90)
    );
  }, [blip]);

  const soundErr = useCallback(() => {
    [196, 164].forEach((f, i) => setTimeout(() => blip(f, 0.18, "sawtooth", 0.04), i * 110));
  }, [blip]);

  const soundTick = useCallback(() => blip(1500, 0.014, "square", 0.012), [blip]);

  function toggleMute() {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    try {
      window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (!next) blip(880, 0.05, "triangle", 0.04);
  }

  // ------------------------------------------------------------------
  // Hints: new hints arrive from the parent and are printed here
  // ------------------------------------------------------------------
  const seenHintsRef = useRef(0);
  useEffect(() => {
    if (hints.length > seenHintsRef.current) {
      const added = hints.slice(seenHintsRef.current);
      seenHintsRef.current = hints.length;
      push(
        added.map((h) => ({
          text: `HINT ${h.hint_order}: ${h.hint_text}`,
          tone: "info" as Tone,
        }))
      );
      blip(660, 0.1, "triangle", 0.04);
    }
  }, [hints, push, blip]);

  // ------------------------------------------------------------------
  // Auto-scroll
  // ------------------------------------------------------------------
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [display, current]);

  // ------------------------------------------------------------------
  // Commands
  // ------------------------------------------------------------------
  const [inputValue, setInputValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const files: Record<string, string> = config.files || {};

  async function requestHint() {
    if (hintsRevealedCount >= totalHintsCount) {
      push([{ text: "No hint charges left. Solve it with what you have.", tone: "err" }]);
      soundErr();
      return;
    }
    push([{ text: "Requesting hint from server...", tone: "dim" }]);
    await onRequestHint();
  }

  async function submitAnswer(arg: string) {
    if (!arg) {
      push([{ text: "usage: answer <your solution>", tone: "err" }]);
      soundErr();
      return;
    }
    if (lives <= 0) {
      push([{ text: "No energy seals left — run 'reset' to restore them.", tone: "err" }]);
      soundErr();
      return;
    }
    if (verifying || submitting) return;

    setVerifying(true);
    push([{ text: "Verifying with server...", tone: "dim" }]);
    try {
      const result = await onSubmit(arg);
      if (result.ok) {
        soundOk();
        push([{ text: "ACCESS VERIFIED — CHAMBER UNLOCKED", tone: "ok" }]);
      } else {
        soundErr();
        push([{ text: `REJECTED: ${result.message || "incorrect solution"}`, tone: "err" }]);
      }
    } catch (err: any) {
      soundErr();
      push([{ text: `ERROR: ${err?.message || "network failure"}`, tone: "err" }]);
    } finally {
      setVerifying(false);
    }
  }

  async function restoreSeals() {
    if (lives > 0) {
      push([{ text: `Energy seals intact: ${lives}/${puzzle.max_lives}.`, tone: "info" }]);
      return;
    }
    push([{ text: "Rebuilding energy seals...", tone: "dim" }]);
    await onReset();
    push([{ text: "Energy seals restored. Continue the investigation.", tone: "ok" }]);
    soundOk();
  }

  async function runCommand(raw: string) {
    const input = raw.trim();
    push([{ text: `${prompt} ${input}`, tone: "cmd" }]);
    if (!input) return;

    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ");

    switch (cmd) {
      case "help":
        push([
          { text: "AVAILABLE COMMANDS", tone: "sys" },
          { text: "  help ............ list these commands", tone: "dim" },
          { text: "  status .......... case file, lives, hints, XP reward", tone: "dim" },
          { text: "  hint ............ request a hint (limited, costs XP)", tone: "dim" },
          { text: "  answer <text> ... submit your solution", tone: "dim" },
          { text: "  ls .............. list files in this directory", tone: "dim" },
          { text: "  cat <file> ...... read a file", tone: "dim" },
          { text: "  whoami / pwd .... identity and location", tone: "dim" },
          { text: "  reset ........... restore energy seals (at 0 left)", tone: "dim" },
          { text: "  clear ........... clear this screen", tone: "dim" },
          { text: "  exit ............ leave the terminal", tone: "dim" },
        ]);
        break;

      case "status":
        push([
          { text: `CASE FILE: ${level.title}`, tone: "sys" },
          { text: `OBJECTIVE: ${config.objective || "Solve the case file."}`, tone: "info" },
          { text: `ENERGY SEALS: ${lives}/${puzzle.max_lives}`, tone: "info" },
          {
            text: `HINTS: ${hintsRevealedCount}/${totalHintsCount} revealed · −${puzzle.hint_penalty} pts each`,
            tone: "info",
          },
          {
            text: `XP: ${puzzle.base_points} base points · difficulty ${puzzle.difficulty}`,
            tone: "info",
          },
        ]);
        break;

      case "hint":
        await requestHint();
        break;

      case "answer":
      case "solve":
      case "submit":
        await submitAnswer(arg);
        break;

      case "ls": {
        const names = Object.keys(files).sort();
        if (names.length === 0) {
          push([{ text: "(directory empty)", tone: "dim" }]);
        } else {
          push(names.map((n) => ({ text: n, tone: "info" as Tone })));
        }
        break;
      }

      case "cat": {
        if (!arg) {
          push([{ text: "usage: cat <file>", tone: "err" }]);
          soundErr();
          break;
        }
        const body = files[arg] ?? files[arg.replace(/^\.\//, "")];
        if (body) {
          push([{ text: body, tone: "info" }]);
          blip(720, 0.05, "triangle", 0.03);
        } else {
          push([{ text: `cat: ${arg}: No such file`, tone: "err" }]);
          soundErr();
        }
        break;
      }

      case "whoami":
        push([
          { text: "investigator (clearance: PROVISIONAL) — session is being logged", tone: "info" },
        ]);
        break;

      case "pwd":
        push([{ text: cwd, tone: "info" }]);
        break;

      case "reset":
        await restoreSeals();
        break;

      case "clear":
        stopTimers();
        queueRef.current = [];
        currentRef.current = null;
        busyRef.current = false;
        setDisplay([]);
        setCurrent(null);
        break;

      case "exit":
        push([{ text: "Closing session... goodbye, investigator.", tone: "dim" }]);
        soundOk();
        setTimeout(() => router.push("/chapters"), 500);
        break;

      default:
        push([{ text: `command not found: ${cmd} — type 'help'`, tone: "err" }]);
        soundErr();
    }
  }

  function handleEnter() {
    const value = inputValue;
    setInputValue("");
    void runCommand(value);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (verifying || submitting) return;
      handleEnter();
      return;
    }
    if (e.key.length === 1 || e.key === "Backspace") soundTick();
  }

  const busy = verifying || submitting;

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#04100a] shadow-[0_0_45px_rgba(16,185,129,0.10)]">
      {/* Title bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 bg-[#071a11] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 font-mono text-[11px] text-emerald-400">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-400" />
          <span className="truncate">
            root@{hostname} — {level.location_name}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <span className="flex items-center gap-0.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1">
            {Array.from({ length: puzzle.max_lives }).map((_, idx) => (
              <Heart
                key={idx}
                className={`h-3 w-3 ${
                  idx < lives ? "fill-rose-400 text-rose-400" : "text-slate-600"
                }`}
              />
            ))}
          </span>

          <button
            type="button"
            onClick={() => void requestHint()}
            disabled={busy || hintsRevealedCount >= totalHintsCount}
            title="Request a hint"
            className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[11px] text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Lightbulb className="h-3 w-3" />
            {hintsRevealedCount}/{totalHintsCount}
          </button>

          {lives === 0 && (
            <button
              type="button"
              onClick={() => void restoreSeals()}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 font-mono text-[11px] text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-40"
            >
              <RotateCcw className="h-3 w-3" /> Restore
            </button>
          )}

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute sounds" : "Mute sounds"}
            title={muted ? "Sound off" : "Sound on"}
            className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-300 transition hover:bg-emerald-500/20"
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Screen */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.10] [background-image:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.65)_3px)]" />
        <div
          ref={scrollRef}
          onClick={() => inputRef.current?.focus()}
          className="h-[clamp(240px,42vh,400px)] overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed sm:text-[13px]"
        >
          {display.map((line) => (
            <div key={line.id} className={`${TONE[line.tone]} whitespace-pre-wrap break-words`}>
              {line.text || "\u00A0"}
            </div>
          ))}
          {current && (
            <div className={`${TONE[current.tone]} whitespace-pre-wrap break-words`}>
              {current.text}
              <span className="ml-0.5 inline-block h-3.5 w-2 animate-pulse bg-emerald-400/80 align-middle" />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-emerald-500/20 bg-[#071a11] px-3 py-3 sm:px-4">
        <span className="shrink-0 font-mono text-[11px] text-emerald-400 sm:text-xs">{prompt}</span>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Terminal command input"
          placeholder={busy ? "verifying with server..." : "type a command..."}
          className="w-full min-w-0 bg-transparent font-mono text-sm text-emerald-200 caret-emerald-400 outline-none placeholder:text-emerald-800"
        />
      </div>
    </div>
  );
}
