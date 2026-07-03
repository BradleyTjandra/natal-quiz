import { describe, it, expect } from "vitest";
import { ascCrossings, bestMomentInInterval } from "./stage4.ts";
import { sunWindow } from "./stage1.ts";
import { moonWindows } from "./stage2.ts";
import { ascendant, eclipticLongitude } from "./sky.ts";
import { signIndexOf, degreeInSign, normalizeDegrees } from "./signs.ts";
import { CITIES } from "./cities.ts";
import type { Target } from "./scoring.ts";

// A coherent scenario: Sun in Aries (spring 2000), the Moon-match interval inside
// that window, and a chosen Ascendant target.
const sun = sunWindow(2000, 0);
const interval = moonWindows(sun, signIndexOf(
  eclipticLongitude("Moon", new Date((sun.start.getTime() + sun.end.getTime()) / 2)),
))[0];
const moonSign = signIndexOf(eclipticLongitude("Moon", interval.start));

const ASC_SIGN = 6; // Libra
const ASC_DEGREE = 15;
const ASC_LON = ASC_SIGN * 30 + ASC_DEGREE;

const target: Target = {
  sun: { sign: 0, degree: 10, confidence: 1 },
  moon: { sign: moonSign, degree: 12, confidence: 1 },
  ascendant: { sign: ASC_SIGN, degree: ASC_DEGREE, confidence: 1 },
};

const london = CITIES.find((c) => c.name === "London")!;

describe("ascCrossings", () => {
  const crossings = ascCrossings(london, ASC_LON, interval);

  it("lands the Ascendant exactly on the target longitude", () => {
    expect(crossings.length).toBeGreaterThanOrEqual(1);
    for (const date of crossings) {
      const asc = ascendant(date, london.latitude, london.longitudeEast);
      const diff = Math.abs(normalizeDegrees(asc - ASC_LON + 180) - 180);
      expect(diff).toBeLessThan(0.1);
      expect(date.getTime()).toBeGreaterThanOrEqual(interval.start.getTime());
      expect(date.getTime()).toBeLessThanOrEqual(interval.end.getTime());
    }
  });

  it("spaces successive crossings ~one sidereal day apart", () => {
    for (let i = 1; i < crossings.length; i++) {
      const gapHours =
        (crossings[i].getTime() - crossings[i - 1].getTime()) / 3600000;
      expect(gapHours).toBeGreaterThan(23.5);
      expect(gapHours).toBeLessThan(24.1);
    }
  });
});

describe("bestMomentInInterval", () => {
  const best = bestMomentInInterval(target, interval)!;

  it("returns a real moment with Sun, Moon and Ascendant signs all exact", () => {
    expect(best).not.toBeNull();
    expect(signIndexOf(best.chart.positions.Sun)).toBe(0);
    expect(signIndexOf(best.chart.positions.Moon)).toBe(moonSign);
    expect(signIndexOf(best.chart.ascendant)).toBe(ASC_SIGN);
  });

  it("hits the target Ascendant degree essentially exactly", () => {
    expect(degreeInSign(best.chart.ascendant)).toBeCloseTo(ASC_DEGREE, 1);
  });

  it("picks a moment inside the interval", () => {
    expect(best.date.getTime()).toBeGreaterThanOrEqual(interval.start.getTime());
    expect(best.date.getTime()).toBeLessThanOrEqual(interval.end.getTime());
  });
});

describe("city choice is a real degree-of-freedom for the Moon", () => {
  it("different-longitude cities hitting the same Ascendant give different Moon degrees", () => {
    const tokyo = CITIES.find((c) => c.name === "Tokyo")!;
    const la = CITIES.find((c) => c.name === "Los Angeles")!;
    const tTokyo = ascCrossings(tokyo, ASC_LON, interval)[0];
    const tLA = ascCrossings(la, ASC_LON, interval)[0];
    const moonTokyo = eclipticLongitude("Moon", tTokyo);
    const moonLA = eclipticLongitude("Moon", tLA);
    // Same Ascendant, different UTC instant → the Moon has moved.
    expect(Math.abs(moonTokyo - moonLA)).toBeGreaterThan(0.5);
  });
});
