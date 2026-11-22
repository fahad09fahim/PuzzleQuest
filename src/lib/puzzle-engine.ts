import type { ScoreBreakdown, ValidationMode } from "@/types/database";

export function normalizeText(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"()\[\]{}]/g, "")
    .replace(/\s+/g, " ");
}

export function validatePuzzleSubmission(params: {
  submittedAnswer: string;
  canonicalAnswer: string;
  acceptedVariations?: string[];
  validationMode: ValidationMode;
}): boolean {
  const { submittedAnswer, canonicalAnswer, acceptedVariations = [], validationMode } = params;
  const raw = (submittedAnswer ?? "").trim();
  if (!raw) return false;

  if (validationMode === "numeric") {
    const subNum = Number(raw.replace(/,/g, ""));
    const canNum = Number(canonicalAnswer.replace(/,/g, ""));
    if (Number.isNaN(subNum) || Number.isNaN(canNum)) return false;
    return Math.abs(subNum - canNum) < 1e-6;
  }

  if (validationMode === "memory_token") {
    return raw === canonicalAnswer.trim();
  }

  if (validationMode === "json_steps") {
    try {
      const subArr = JSON.parse(raw);
      const canArr = JSON.parse(canonicalAnswer);
      if (!Array.isArray(subArr) || !Array.isArray(canArr) || subArr.length !== canArr.length) {
        return false;
      }
      return subArr.every((item, idx) => normalizeText(String(item)) === normalizeText(String(canArr[idx])));
    } catch {
      return false;
    }
  }

  // Keyword-group validation: every group in accepted_variations must be
  // satisfied by at least one of its pipe-separated alternatives.
  // e.g. ["unauthorized|illegal|suspicious", "export|10:07"]
  if (validationMode === "keywords") {
    const normalizedSubmission = normalizeText(raw);
    const groups = Array.isArray(acceptedVariations) ? acceptedVariations : [];
    if (groups.length === 0) {
      return normalizedSubmission === normalizeText(canonicalAnswer);
    }
    return groups.every((group) => {
      const alternatives = String(group).split("|").map(normalizeText).filter(Boolean);
      if (alternatives.length === 0) return false;
      return alternatives.some((alt) => normalizedSubmission.includes(alt));
    });
  }

  const normalizedSubmission = normalizeText(raw);
  const candidates = [canonicalAnswer, ...acceptedVariations].map((v) => normalizeText(String(v)));
  return candidates.includes(normalizedSubmission);
}

export function calculatePuzzleScore(params: {
  basePoints: number;
  firstAttemptBonus: number;
  noHintsBonus: number;
  maxTimeBonus: number;
  hintPenalty: number;
  attemptNumber: number;
  hintsRevealed: number;
  elapsedSeconds: number;
  targetTimeSeconds: number | null;
}): ScoreBreakdown {
  const {
    basePoints,
    firstAttemptBonus,
    noHintsBonus,
    maxTimeBonus,
    hintPenalty,
    attemptNumber,
    hintsRevealed,
    elapsedSeconds,
    targetTimeSeconds,
  } = params;

  const earnedFirstAttempt = attemptNumber === 1 ? firstAttemptBonus : 0;
  const earnedNoHints = hintsRevealed === 0 ? noHintsBonus : 0;

  let earnedTimeBonus = 0;
  if (targetTimeSeconds && targetTimeSeconds > 0 && elapsedSeconds <= targetTimeSeconds) {
    const ratio = Math.max(0, Math.min(1, (targetTimeSeconds - elapsedSeconds) / targetTimeSeconds));
    earnedTimeBonus = Math.round(maxTimeBonus * Math.max(0.25, ratio));
  }

  const totalHintPenalty = hintsRevealed * hintPenalty;
  const rawTotal = basePoints + earnedFirstAttempt + earnedNoHints + earnedTimeBonus - totalHintPenalty;
  const minimumFloor = Math.round(basePoints * 0.25);
  const totalPoints = Math.max(minimumFloor, rawTotal);

  return {
    basePoints,
    firstAttemptBonus: earnedFirstAttempt,
    noHintsBonus: earnedNoHints,
    timeBonus: earnedTimeBonus,
    hintPenalty: totalHintPenalty,
    totalPoints,
  };
}
