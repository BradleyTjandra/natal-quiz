// The objective the search maximizes. Every candidate moment is boiled down to
// one number by this module; Stages 1–4 all exist to find the moment that
// maximizes it. Design (see SPEC.md "Weighting hierarchy"):
//   - Big three (Sun/Moon/ASC): guaranteed to match by how the search is built,
//     so they never cost anything here; their *degrees* still contribute.
//   - Personal (Mercury/Venus/Mars): soft. A sign mismatch simply forgoes that
//     planet's reward — and the reward is scaled by the quiz's confidence, so a
//     landslide answer is expensive to miss and a coin-flip is cheap.
//   - Social (Jupiter/Saturn): low weight (not quizzed until M5).

import { signIndexOf, degreeInSign } from "./signs.ts";
import type { Chart, ChartBody } from "./sky.ts";

export type Placement =
  | "sun"
  | "moon"
  | "ascendant"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn";

export interface PlanetTarget {
  sign: number; // 0..11 primary/best sign index
  degree: number; // 0..30 target degree within the sign
  confidence: number; // 0..1, how decisive the quiz answer was
  // Soft placements (Mercury/Venus/Mars) may instead carry a per-sign reward
  // profile — how well *each* sign fits the quiz answers, normalised so the best
  // sign ≈ 1. The search then rewards the planet by where it actually lands
  // (a bent Gemini → Sagittarius still scores partially, Taurus barely at all),
  // and the profile's peakedness replaces `confidence` (a landslide punishes
  // misses, a coin-flip shrugs). When absent, scoring falls back to all-or-
  // nothing on `sign` scaled by `confidence` (the big three, and older callers).
  reward?: number[]; // length 12
}

// A target need not name every placement — Jupiter/Saturn are absent until M5.
export type Target = Partial<Record<Placement, PlanetTarget>>;

type Tier = "big3" | "personal" | "social";

const TIER: Record<Placement, Tier> = {
  sun: "big3",
  moon: "big3",
  ascendant: "big3",
  mercury: "personal",
  venus: "personal",
  mars: "personal",
  jupiter: "social",
  saturn: "social",
};

// Reward weights, tunable. Sign match dominates degree fit; big three dominate
// personal, which dominate social. The exchange rate (SPEC): a high-confidence
// personal sign match (10) outweighs both social planets combined (2×3=6); a
// low-confidence one (10×0.2=2) does not. Big three carry a large sign weight so
// that a general scorer never prefers a chart that breaks them.
export const SIGN_WEIGHT: Record<Tier, number> = {
  big3: 100,
  personal: 10,
  social: 3,
};
export const DEGREE_WEIGHT: Record<Tier, number> = {
  big3: 5,
  personal: 3,
  social: 1,
};

const BODY_OF: Record<Exclude<Placement, "ascendant">, ChartBody> = {
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
};

function longitudeFor(placement: Placement, chart: Chart): number {
  return placement === "ascendant"
    ? chart.ascendant
    : chart.positions[BODY_OF[placement]];
}

// 1 when the actual degree hits the target, tapering to 0 a whole sign away.
function degreeCloseness(actualDegree: number, targetDegree: number): number {
  return Math.max(0, 1 - Math.abs(actualDegree - targetDegree) / 30);
}

// How strongly a placement wants its best case: `confidence` for a one-hot
// target, or the peak of the reward profile for a soft one.
function peakWeight(target: PlanetTarget): number {
  return target.reward ? Math.max(...target.reward) : target.confidence;
}

// The most a placement can contribute: perfect sign match (or best reward sign)
// and exact degree.
export function fullReward(placement: Placement, target: PlanetTarget): number {
  const tier = TIER[placement];
  return (SIGN_WEIGHT[tier] + DEGREE_WEIGHT[tier]) * peakWeight(target);
}

// Upper bound on a placement's reward when the planet can only reach
// `reachableSigns` during the search window (used by Stage 1 for Mars): the best
// reward among reachable signs, or full reward iff a one-hot target's sign is
// reachable. Never understates the achievable reward, so branch-and-bound stays
// valid.
export function reachableReward(
  placement: Placement,
  target: PlanetTarget,
  reachableSigns: Set<number>,
): number {
  const tier = TIER[placement];
  if (target.reward) {
    let maxR = 0;
    for (const s of reachableSigns) {
      if (target.reward[s] > maxR) maxR = target.reward[s];
    }
    return (SIGN_WEIGHT[tier] + DEGREE_WEIGHT[tier]) * maxR;
  }
  return reachableSigns.has(target.sign) ? fullReward(placement, target) : 0;
}

// The score a perfect chart (every placement exact) would earn for this target.
export function maxScore(target: Target): number {
  let total = 0;
  for (const key of Object.keys(target) as Placement[]) {
    total += fullReward(key, target[key]!);
  }
  return total;
}

// Score a concrete, fully-computed chart against the target.
export function scoreChart(target: Target, chart: Chart): number {
  let total = 0;
  for (const key of Object.keys(target) as Placement[]) {
    const t = target[key]!;
    const tier = TIER[key];
    const longitude = longitudeFor(key, chart);
    const landedSign = signIndexOf(longitude);

    // How much this placement rewards the sign the planet actually landed on:
    // the reward profile if present (soft, graded by fit), else all-or-nothing
    // on the target sign scaled by confidence (hard / one-hot).
    const weight = t.reward ? t.reward[landedSign] : landedSign === t.sign ? t.confidence : 0;
    if (weight <= 0) continue;

    total += SIGN_WEIGHT[tier] * weight;
    total +=
      DEGREE_WEIGHT[tier] *
      weight *
      degreeCloseness(degreeInSign(longitude), t.degree);
  }
  return total;
}
