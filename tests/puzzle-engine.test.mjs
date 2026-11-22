import test from "node:test";
import assert from "node:assert/strict";

function normalizeText(input) {
  return input.trim().toLowerCase().replace(/[.,!?;:'"()\[\]{}]/g, "").replace(/\s+/g, " ");
}

test("normalizeText trims and lowercases", () => {
  assert.equal(normalizeText("  Echo!  "), "echo");
  assert.equal(normalizeText("STARGATE   IN THE VAULT."), "stargate in the vault");
});

// Mirrors the "keywords" branch of src/lib/puzzle-engine.ts: every group in
// accepted_variations must be satisfied by one of its "|" alternatives.
function matchesKeywords(raw, acceptedVariations, canonicalAnswer = raw) {
  const submission = normalizeText(raw);
  const groups = Array.isArray(acceptedVariations) ? acceptedVariations : [];
  if (groups.length === 0) {
    return submission === normalizeText(canonicalAnswer);
  }
  return groups.every((group) => {
    const alternatives = String(group).split("|").map(normalizeText).filter(Boolean);
    if (alternatives.length === 0) return false;
    return alternatives.some((alt) => submission.includes(alt));
  });
}

const GHOST_EXPORT_GROUPS = ["unauthorized|illegal|suspicious|warning", "export|10:07"];
const PHISHING_GROUPS = [
  "do not|dont|never|no|ignore|avoid|phishing|suspicious|report|delete|yourself|independently|myself|refuse",
  "official|website|support|call|visit|trusted|site|contact|type|manually|independently",
];

test("keywords mode accepts paraphrased answers that hit every group", () => {
  assert.ok(matchesKeywords("Unauthorized export at 10:07", GHOST_EXPORT_GROUPS));
  assert.ok(matchesKeywords("the suspicious export at 10:07", GHOST_EXPORT_GROUPS));
  assert.ok(matchesKeywords("illegal export at 10:07", GHOST_EXPORT_GROUPS));
  assert.ok(
    matchesKeywords("Do not click the link; visit the official site yourself", PHISHING_GROUPS)
  );
  assert.ok(matchesKeywords("never click it, call your bank's support", PHISHING_GROUPS));
});

test("keywords mode rejects answers missing a required group", () => {
  assert.ok(!matchesKeywords("the login at 10:00", GHOST_EXPORT_GROUPS));
  assert.ok(!matchesKeywords("something suspicious happened", GHOST_EXPORT_GROUPS));
  assert.ok(!matchesKeywords("export at 10:07", GHOST_EXPORT_GROUPS)); // group 1 unmet
  assert.ok(!matchesKeywords("do not click the link", PHISHING_GROUPS)); // group 2 unmet
  assert.ok(!matchesKeywords("visit the official website", PHISHING_GROUPS)); // group 1 unmet
  assert.ok(!matchesKeywords("", PHISHING_GROUPS));
});

test("keywords mode requires every alternative group to be non-empty", () => {
  assert.ok(!matchesKeywords("anything at all", [""]));
});
