import { describe, it, expect } from "vitest";
import { signAt, signsInWindow, INGRESS_RANGE } from "./ingressTables.ts";
import { eclipticLongitude } from "./sky.ts";
import { signIndexOf } from "./signs.ts";

const BODIES = ["Mars", "Jupiter", "Saturn"] as const;

describe("signAt (table lookup) agrees with direct computation", () => {
  // The table's whole purpose is to replace an astronomy call with a lookup, so
  // it must give the same sign the ephemeris does. The only allowed disagreement
  // is right at a crossing, where the table's hour-level rounding can differ.
  for (const body of BODIES) {
    it(`${body}`, () => {
      for (let year = 1650; year <= 2050; year += 17) {
        for (const month of [0, 3, 6, 9]) {
          const date = new Date(Date.UTC(year, month, 15, 6));
          const lon = eclipticLongitude(body, date);
          if (signAt(body, date) === signIndexOf(lon)) continue;
          // Disagreement only tolerated within ~0.1° of a sign boundary.
          const intoSign = lon % 30;
          expect(Math.min(intoSign, 30 - intoSign)).toBeLessThan(0.1);
        }
      }
    });
  }
});

describe("signsInWindow", () => {
  it("matches the distinct signs found by daily sampling", () => {
    const start = new Date(Date.UTC(1975, 2, 20));
    const end = new Date(Date.UTC(1975, 3, 19));
    const fromTable = signsInWindow("Mars", start, end);

    const fromSampling = new Set<number>();
    for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
      fromSampling.add(signIndexOf(eclipticLongitude("Mars", new Date(t))));
    }
    expect([...fromTable].sort()).toEqual([...fromSampling].sort());
  });

  it("covers the configured year range", () => {
    expect(INGRESS_RANGE.startYear).toBe(1600);
    expect(INGRESS_RANGE.endYear).toBe(2100);
  });
});
