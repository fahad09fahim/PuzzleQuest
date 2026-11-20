import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSeconds(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function getDifficultyBadgeColor(difficulty: string): string {
  switch (difficulty) {
    case "easy":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "medium":
      return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    case "hard":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "expert":
      return "bg-purple-500/15 text-purple-300 border-purple-500/30";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  }
}

export function formatPuzzleCategory(category: string): string {
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
