// The M1 acceptance test — the one that validates the whole conceit. It throws
// hundreds of random-but-valid target charts at the search and checks the two
// promises that must never break: the returned moment is a *real* sky in which
// the big three (Sun, Moon, Ascendant) match exactly, and the branch-and-bound
// search finds the true optimum (verified against exhaustive search on a small
// range). Personal-planet match rate, score, and runtime are logged, not
// asserted tightly, since those are soft by design.

import { describe, it, expect } from "vitest";
import { search, evaluateYear } from "./search.ts";
import { maxScore, type Target, type PlanetTarget } from "./scoring.ts";
import { signIndexOf } from "./signs.ts";

// Deterministic RNG (mulberry32) so a failure is reproducible.
function makeRng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const wrap = (n: number) => ((n % 12) + 12) % 12;

function randomTarget(rng: () => number): Target {
  const pick = (span: number) => Math.floor(rng() * span);
  const placement = (sign: number): PlanetTarget => ({
    sign: wrap(sign),
    degree: rng() * 30,
    confidence: 0.2 + rng() * 0.8, // 0.2..1.0
  });

  const sun = pick(12);
  return {
    sun: placement(sun),
    moon: placement(pick(12)),
    ascendant: placement(pick(12)),
    mercury: placement(sun + (pick(3) - 1)), // within ±1 of Sun (hard constraint)
    venus: placement(sun + (pick(5) - 2)), // within ±2 of Sun
    mars: placement(pick(12)),
  };
}

const PERSONAL = ["mercury", "venus", "mars"] as const;

describe("M1 acceptance: real sky, big three exact", () => {
  // A representative sample runs by default to keep `npm test` quick; the full
  // SPEC quota (500+) runs on demand via ACCEPT_N=500. The project has no
  // @types/node, so read the env off globalThis rather than the untyped `process`.
  const env = (globalThis as { process?: { env?: Record<string, string> } }).process?.env;
  const N = Number(env?.ACCEPT_N ?? 150);

  it(`reproduces Sun/Moon/ASC exactly across ${N} random targets`, () => {
    const rng = makeRng(0x1234abcd);
    let hiConfMatched = 0;
    let hiConfTotal = 0;
    let loConfMatched = 0;
    let loConfTotal = 0;
    let scoreRatioSum = 0;
    const t0 = Date.now();

    for (let i = 0; i < N; i++) {
      const target = randomTarget(rng);
      // Product fast path: accept a near-perfect chart and cap exploration at a
      // few dozen best-bound years. Big-three exactness holds regardless of when
      // we stop; this just avoids the loose-bound tail.
      const r = search(target, { acceptRatio: 0.99, maxYears: 40 });

      // Hard promise: the big three always match.
      expect(signIndexOf(r.chart.positions.Sun)).toBe(target.sun!.sign);
      expect(signIndexOf(r.chart.positions.Moon)).toBe(target.moon!.sign);
      expect(signIndexOf(r.chart.ascendant)).toBe(target.ascendant!.sign);

      // Soft: track personal match rate, split by how decisive the quiz was.
      for (const key of PERSONAL) {
        const t = target[key]!;
        const matched =
          signIndexOf(
            r.chart.positions[
              (key[0].toUpperCase() + key.slice(1)) as "Mercury" | "Venus" | "Mars"
            ],
          ) === t.sign;
        if (t.confidence >= 0.7) {
          hiConfTotal++;
          if (matched) hiConfMatched++;
        } else {
          loConfTotal++;
          if (matched) loConfMatched++;
        }
      }
      scoreRatioSum += r.score / maxScore(target);
    }

    const ms = Date.now() - t0;
    const hiRate = hiConfMatched / hiConfTotal;
    const loRate = loConfMatched / loConfTotal;
    console.log(
      `\n[acceptance] ${N} targets in ${(ms / 1000).toFixed(1)}s ` +
        `(${(ms / N).toFixed(0)} ms/target)\n` +
        `  personal match rate — high confidence: ${(hiRate * 100).toFixed(1)}%, ` +
        `low confidence: ${(loRate * 100).toFixed(1)}%\n` +
        `  mean score / maxScore: ${((scoreRatioSum / N) * 100).toFixed(1)}%`,
    );

    // High-confidence personal planets should almost always land (SPEC intent:
    // decisive answers are expensive to miss). Loose bound to avoid flakiness.
    expect(hiRate).toBeGreaterThan(0.9);
  }, 600000);
});

describe("M1 acceptance: branch-and-bound is optimal", () => {
  it("matches exhaustive full-evaluation on a small year range", () => {
    const rng = makeRng(0x99);
    const START = 1975;
    const END = 1995; // 20 years, cheap enough to evaluate exhaustively

    for (let i = 0; i < 8; i++) {
      const target = randomTarget(rng);

      // Exhaustive: fully evaluate every year and take the best score.
      let exhaustive = -Infinity;
      for (let year = START; year < END; year++) {
        const c = evaluateYear(target, year);
        if (c && c.score > exhaustive) exhaustive = c.score;
      }

      const bnb = search(target, { startYear: START, endYear: END }).score;
      expect(bnb).toBeCloseTo(exhaustive, 6);
    }
  }, 120000);
});
