import { describe, it, expect } from "vitest";
import { solve, type ScoreVectors } from "./solve.ts";
import { search } from "../ephemeris/search.ts";
import { signIndexOf } from "../ephemeris/signs.ts";

const flat = (): number[] => new Array(12).fill(0);
const spike = (sign: number, height = 100, base = 0): number[] => {
  const v = new Array(12).fill(base);
  v[sign] = height;
  return v;
};

// A baseline set of decisive, constraint-respecting vectors; individual tests
// override the placements they care about.
function baseVectors(): ScoreVectors {
  return {
    sun: spike(0),
    moon: spike(5),
    ascendant: spike(8),
    mercury: spike(0),
    venus: spike(0),
    mars: spike(6),
  };
}

describe("solve — independent placements", () => {
  it("picks each planet's winning sign", () => {
    const t = solve(baseVectors());
    expect(t.moon!.sign).toBe(5);
    expect(t.ascendant!.sign).toBe(8);
    expect(t.mars!.sign).toBe(6);
  });

  it("maps a landslide to high confidence + a solidly-placed degree", () => {
    const t = solve(baseVectors());
    expect(t.moon!.confidence).toBeCloseTo(1);
    expect(t.moon!.degree).toBeCloseTo(7); // ~5–10°, solidly placed
  });

  it("maps a coin-flip to low confidence + a cuspy degree", () => {
    const v = baseVectors();
    v.moon = flat();
    v.moon[4] = 10;
    v.moon[5] = 10; // dead heat between two signs
    const t = solve(v);
    expect(t.moon!.confidence).toBeCloseTo(0);
    expect(t.moon!.degree).toBeCloseTo(27); // ~25–29°, on the cusp
  });
});

describe("solve — hard constraints", () => {
  it("forces Mercury off its raw winner to stay within ±1 sign of the Sun", () => {
    const v = baseVectors();
    v.sun = spike(0); // Sun firmly in Aries
    v.mercury = flat();
    v.mercury[6] = 20; // raw winner is Libra — impossible (opposite the Sun)
    v.mercury[1] = 8; // best *allowed* sign (Taurus, adjacent to Aries)
    const t = solve(v);
    expect(t.sun!.sign).toBe(0);
    expect(t.mercury!.sign).toBe(1); // pulled to the nearest allowed sign
    expect(t.mercury!.confidence).toBeCloseTo(0); // we didn't really want Taurus
  });

  it("keeps Venus within ±2 signs of the Sun", () => {
    const v = baseVectors();
    v.sun = spike(0);
    v.venus = flat();
    v.venus[5] = 30; // Virgo — 5 signs away, not allowed
    v.venus[2] = 9; // Gemini — 2 signs away, the best allowed
    const t = solve(v);
    expect(t.venus!.sign).toBe(2);
  });
});

describe("solve — joint optimisation", () => {
  it("flips a marginal Sun to unlock a much stronger Mercury", () => {
    const v = baseVectors();
    // Sun is nearly tied Aries(0) vs Taurus(1), Taurus barely ahead.
    v.sun = flat();
    v.sun[0] = 10;
    v.sun[1] = 11;
    // Mercury desperately wants Pisces(11) — reachable only if the Sun is Aries
    // (dist 1), not Taurus (dist 2).
    v.mercury = spike(11, 50);
    v.venus = flat();

    const t = solve(v);
    expect(t.sun!.sign).toBe(0); // flipped away from the raw winner (Taurus)
    expect(t.mercury!.sign).toBe(11);
  });
});

describe("solve → search integration", () => {
  it("produces a Target the ephemeris search realises with the big three exact", () => {
    const target = solve(baseVectors());
    const r = search(target, { acceptRatio: 0.99, maxYears: 40 });
    expect(signIndexOf(r.chart.positions.Sun)).toBe(target.sun!.sign);
    expect(signIndexOf(r.chart.positions.Moon)).toBe(target.moon!.sign);
    expect(signIndexOf(r.chart.ascendant)).toBe(target.ascendant!.sign);
  }, 30000);
});
