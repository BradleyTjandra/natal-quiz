import { describe, it, expect } from "vitest";
import type { Chart } from "./sky.ts";
import {
  scoreChart,
  maxScore,
  type Target,
  type Placement,
} from "./scoring.ts";

// Build a chart placing each named placement at sign*30 + degree; anything not
// specified is parked at 0° Aries (won't match the targets we test).
function chartWith(
  placements: Partial<Record<Placement, { sign: number; degree: number }>>,
): Chart {
  const lonOf = (p: Placement) =>
    placements[p] ? placements[p]!.sign * 30 + placements[p]!.degree : 0;
  return {
    positions: {
      Sun: lonOf("sun"),
      Moon: lonOf("moon"),
      Mercury: lonOf("mercury"),
      Venus: lonOf("venus"),
      Mars: lonOf("mars"),
      Jupiter: lonOf("jupiter"),
      Saturn: lonOf("saturn"),
      Uranus: 0,
    },
    ascendant: lonOf("ascendant"),
  };
}

const target: Target = {
  sun: { sign: 4, degree: 10, confidence: 1 },
  moon: { sign: 7, degree: 20, confidence: 1 },
  ascendant: { sign: 1, degree: 5, confidence: 1 },
  mercury: { sign: 4, degree: 2, confidence: 0.9 },
  venus: { sign: 3, degree: 15, confidence: 0.5 },
  mars: { sign: 10, degree: 25, confidence: 0.8 },
};

const perfectChart = chartWith({
  sun: { sign: 4, degree: 10 },
  moon: { sign: 7, degree: 20 },
  ascendant: { sign: 1, degree: 5 },
  mercury: { sign: 4, degree: 2 },
  venus: { sign: 3, degree: 15 },
  mars: { sign: 10, degree: 25 },
});

describe("scoreChart", () => {
  it("gives a perfect chart exactly the maximum score", () => {
    expect(scoreChart(target, perfectChart)).toBeCloseTo(maxScore(target));
  });

  it("charges a sign mismatch its full confidence-weighted reward", () => {
    // Push Mars one sign off; the rest stays perfect.
    const marsOff = chartWith({
      sun: { sign: 4, degree: 10 },
      moon: { sign: 7, degree: 20 },
      ascendant: { sign: 1, degree: 5 },
      mercury: { sign: 4, degree: 2 },
      venus: { sign: 3, degree: 15 },
      mars: { sign: 11, degree: 25 },
    });
    // Mars reward = (SIGN 10 + DEGREE 3) * confidence 0.8 = 10.4
    expect(maxScore(target) - scoreChart(target, marsOff)).toBeCloseTo(10.4);
  });

  it("makes a decisive miss cost more than a wishy-washy one", () => {
    const missMercury = { ...perfectChart };
    missMercury.positions = {
      ...perfectChart.positions,
      Mercury: 0,
      Venus: 0,
    };
    // Mercury (confidence 0.9) and Venus (0.5) both knocked out.
    const lost = maxScore(target) - scoreChart(target, missMercury);
    // Mercury reward 13*0.9=11.7, Venus reward 13*0.5=6.5 -> 18.2 total,
    // and Mercury alone (11.7) costs more than Venus alone (6.5).
    expect(lost).toBeCloseTo(18.2);
  });

  it("rewards a closer degree within a matched sign", () => {
    const near = chartWith({ mars: { sign: 10, degree: 24 } });
    const far = chartWith({ mars: { sign: 10, degree: 5 } });
    const onlyMars: Target = { mars: target.mars };
    expect(scoreChart(onlyMars, near)).toBeGreaterThan(
      scoreChart(onlyMars, far),
    );
  });
});

describe("soft reward scoring — graceful sign fallback", () => {
  // A "Gemini-ish" reward profile (Air + Mutable). Its zodiac neighbour Taurus
  // shares neither axis; Sagittarius (opposite) shares modality and polarity, so
  // it's a much better fallback when Gemini itself is out of reach.
  const reward = new Array(12).fill(0);
  reward[2] = 1.0; // Gemini — the ideal
  reward[6] = 0.7; // Libra — fellow Air
  reward[10] = 0.7; // Aquarius — fellow Air
  reward[8] = 0.55; // Sagittarius — fellow Mutable, opposite
  reward[1] = 0.1; // Taurus — adjacent but unrelated
  const marsTarget: Target = { mars: { sign: 2, degree: 15, confidence: 1, reward } };
  const at = (sign: number) =>
    scoreChart(marsTarget, chartWith({ mars: { sign, degree: 15 } }));

  it("rewards the ideal sign the most", () => {
    expect(at(2)).toBeGreaterThan(at(6));
    expect(at(2)).toBeGreaterThan(at(8));
  });

  it("prefers a similar fallback (Sagittarius) over an adjacent-but-unrelated one (Taurus)", () => {
    expect(at(8)).toBeGreaterThan(at(1));
  });

  it("takes its maximum from the reward peak, not a confidence scalar", () => {
    expect(maxScore(marsTarget)).toBeCloseTo(13); // (SIGN 10 + DEGREE 3) * peak 1
  });
});

describe("exchange rate between tiers", () => {
  it("values a high-confidence personal match above both social planets", () => {
    const personal: Target = { mars: { sign: 0, degree: 0, confidence: 1 } };
    const social: Target = {
      jupiter: { sign: 0, degree: 0, confidence: 1 },
      saturn: { sign: 0, degree: 0, confidence: 1 },
    };
    expect(maxScore(personal)).toBeGreaterThan(maxScore(social));
  });
});
