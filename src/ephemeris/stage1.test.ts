import { describe, it, expect } from "vitest";
import { sunWindow, yearUpperBound, rankYears } from "./stage1.ts";
import { maxScore, type Target } from "./scoring.ts";
import { eclipticLongitude } from "./sky.ts";
import { signIndexOf } from "./signs.ts";

const target: Target = {
  sun: { sign: 0, degree: 10, confidence: 1 }, // Aries
  moon: { sign: 5, degree: 15, confidence: 1 },
  ascendant: { sign: 8, degree: 3, confidence: 1 },
  mercury: { sign: 0, degree: 5, confidence: 0.8 },
  venus: { sign: 11, degree: 20, confidence: 0.6 },
  mars: { sign: 6, degree: 12, confidence: 0.9 }, // Libra
};

// True set of Mars signs during a window, by sampling the real ephemeris.
function marsSignsSampled(start: Date, end: Date): Set<number> {
  const signs = new Set<number>();
  for (let t = start.getTime(); t <= end.getTime(); t += 43200000) {
    signs.add(signIndexOf(eclipticLongitude("Mars", new Date(t))));
  }
  return signs;
}

describe("sunWindow", () => {
  it("brackets the ~30 days the Sun spends in the target sign", () => {
    const w = sunWindow(2000, target.sun!.sign);
    const mid = new Date((w.start.getTime() + w.end.getTime()) / 2);
    expect(signIndexOf(eclipticLongitude("Sun", mid))).toBe(target.sun!.sign);
    const days = (w.end.getTime() - w.start.getTime()) / 86400000;
    expect(days).toBeGreaterThan(27);
    expect(days).toBeLessThan(32);
  });
});

describe("yearUpperBound", () => {
  it("never exceeds the perfect score (a valid upper bound)", () => {
    const max = maxScore(target);
    for (let year = 1900; year < 1950; year++) {
      expect(yearUpperBound(target, year)).toBeLessThanOrEqual(max + 1e-9);
    }
  });

  it("hits the max exactly when Mars can reach its target sign, and falls short otherwise — matching the real sky", () => {
    const max = maxScore(target);
    let sawReachable = false;
    let sawUnreachable = false;

    for (let year = 1900; year < 1930; year++) {
      const w = sunWindow(year, target.sun!.sign);
      const marsReachable = marsSignsSampled(w.start, w.end).has(
        target.mars!.sign,
      );
      const bound = yearUpperBound(target, year);

      if (marsReachable) {
        expect(bound).toBeCloseTo(max);
        sawReachable = true;
      } else {
        expect(bound).toBeLessThan(max);
        sawUnreachable = true;
      }
    }
    // Mars's ~2-year cycle guarantees we see both cases within 30 years.
    expect(sawReachable && sawUnreachable).toBe(true);
  });
});

describe("rankYears", () => {
  const ranked = rankYears(target);

  it("returns every year in range, sorted by descending bound", () => {
    expect(ranked).toHaveLength(2100 - 1600);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].bound).toBeGreaterThanOrEqual(ranked[i].bound);
    }
  });

  it("puts a genuinely Mars-reachable year at the very top", () => {
    const top = ranked[0];
    expect(top.bound).toBeCloseTo(maxScore(target));
    const w = sunWindow(top.year, target.sun!.sign);
    expect(marsSignsSampled(w.start, w.end).has(target.mars!.sign)).toBe(true);
  });
});
