import { describe, it, expect } from "vitest";
import { shuffledIndices } from "./shuffle.ts";
import { QUESTIONS } from "./questions.ts";

describe("shuffledIndices", () => {
  it("is a permutation of 0..count-1", () => {
    const order = shuffledIndices("sun-free-day", 4);
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
  });

  it("is deterministic for a given seed", () => {
    expect(shuffledIndices("mercury-stuck", 4)).toEqual(
      shuffledIndices("mercury-stuck", 4),
    );
  });

  it("generally differs between seeds", () => {
    // Not guaranteed for every pair, but true for a real sample of question
    // ids — if this ever fails, the hash has degenerated.
    const seeds = ["sun-free-day", "moon-bad-day", "asc-dinner", "mercury-receive"];
    const orders = seeds.map((s) => shuffledIndices(s, 4).join(""));
    expect(new Set(orders).size).toBeGreaterThan(1);
  });

  it("doesn't just hand back the original order for the real question bank", () => {
    // Regression guard: an earlier version of the hash was linear in the
    // trailing option-index digit, so every question's options sorted right
    // back into 0,1,2,... every time — a "shuffle" that never shuffles.
    const identity = (n: number) => Array.from({ length: n }, (_, i) => i).join("");
    const reshuffled = QUESTIONS.filter(
      (q) => shuffledIndices(q.id, q.options.length).join("") !== identity(q.options.length),
    );
    expect(reshuffled.length).toBeGreaterThan(QUESTIONS.length / 2);
  });
});
