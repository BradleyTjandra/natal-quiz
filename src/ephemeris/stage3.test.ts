import { describe, it, expect } from "vitest";
import { personalSignScore } from "./stage3.ts";
import { computeChart } from "./sky.ts";
import { signIndexOf } from "./signs.ts";
import { signAt } from "./ingressTables.ts";
import { SIGN_WEIGHT, type Target } from "./scoring.ts";

describe("personalSignScore", () => {
  const date = new Date("1990-06-15T12:00:00Z");
  const chart = computeChart(date, 0, 0);
  const actual = {
    mercury: signIndexOf(chart.positions.Mercury),
    venus: signIndexOf(chart.positions.Venus),
    mars: signIndexOf(chart.positions.Mars),
    jupiter: signAt("Jupiter", date),
  };

  it("credits each in-sign personal planet its tier weight × confidence", () => {
    const target: Target = {
      mercury: { sign: actual.mercury, degree: 0, confidence: 1 },
      venus: { sign: actual.venus, degree: 0, confidence: 0.5 },
      mars: { sign: actual.mars, degree: 0, confidence: 0.8 },
    };
    expect(personalSignScore(target, date)).toBeCloseTo(
      SIGN_WEIGHT.personal * (1 + 0.5 + 0.8),
    );
  });

  it("gives a sign mismatch no credit", () => {
    const target: Target = {
      mercury: { sign: actual.mercury, degree: 0, confidence: 1 },
      mars: { sign: (actual.mars + 6) % 12, degree: 0, confidence: 0.8 }, // opposite sign
    };
    expect(personalSignScore(target, date)).toBeCloseTo(SIGN_WEIGHT.personal * 1);
  });

  it("scores social planets from the ingress tables at the lower tier weight", () => {
    const target: Target = {
      jupiter: { sign: actual.jupiter, degree: 0, confidence: 1 },
    };
    expect(personalSignScore(target, date)).toBeCloseTo(SIGN_WEIGHT.social * 1);
  });

  it("ignores placements the target doesn't name (Sun/Moon/ASC are handled elsewhere)", () => {
    expect(personalSignScore({}, date)).toBe(0);
  });
});
