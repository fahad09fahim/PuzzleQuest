import test from "node:test";
import assert from "node:assert/strict";

function normalizeText(input) {
  return input.trim().toLowerCase().replace(/[.,!?;:'"()\[\]{}]/g, "").replace(/\s+/g, " ");
}

test("normalizeText trims and lowercases", () => {
  assert.equal(normalizeText("  Echo!  "), "echo");
  assert.equal(normalizeText("STARGATE   IN THE VAULT."), "stargate in the vault");
});
