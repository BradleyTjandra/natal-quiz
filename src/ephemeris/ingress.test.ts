import { describe, it, expect } from "vitest";
import * as Astronomy from "astronomy-engine";
import { computeIngresses } from "./ingress.ts";
import { eclipticLongitude } from "./sky.ts";
import { normalizeDegrees } from "./signs.ts";

describe("computeIngresses finds sign changes at the right instants", () => {
  // Ground truth: the Sun's ingress into the four cardinal signs is *by
  // definition* the equinoxes and solstices, which the library computes
  // independently. We run our generic ingress finder on the Sun for one year and
  // check it lands on those instants. This validates the crossing + bisection
  // logic that the real (Mars/Jupiter/Saturn) tables rely on.
  it("Sun ingresses match the equinoxes and solstices", () => {
    const seasons = Astronomy.Seasons(2010);
    const found = computeIngresses(
      "Sun",
      new Date("2010-01-01T00:00:00Z"),
      new Date("2011-01-01T00:00:00Z"),
      1,
    );

    const bySign = new Map(found.map((i) => [i.sign, new Date(i.date)]));
    const expected: [number, Astronomy.AstroTime][] = [
      [0, seasons.mar_equinox], // Aries
      [3, seasons.jun_solstice], // Cancer
      [6, seasons.sep_equinox], // Libra
      [9, seasons.dec_solstice], // Capricorn
    ];

    for (const [sign, when] of expected) {
      const got = bySign.get(sign);
      expect(got).toBeDefined();
      const diffHours =
        Math.abs(got!.getTime() - when.date.getTime()) / 3_600_000;
      expect(diffHours).toBeLessThan(1); // within our 1-hour refinement
    }
  });
});

describe("ingress list is internally consistent", () => {
  const ingresses = computeIngresses(
    "Mars",
    new Date("1990-01-01T00:00:00Z"),
    new Date("2000-01-01T00:00:00Z"),
    1,
  );

  it("recorded moments sit right on a sign boundary", () => {
    for (const { date } of ingresses) {
      const lon = normalizeDegrees(eclipticLongitude("Mars", new Date(date)));
      // A crossing lands on a 30° boundary — whether entered going forward
      // (bottom of the sign) or retrograde (top of the sign).
      const intoSign = lon % 30;
      expect(Math.min(intoSign, 30 - intoSign)).toBeLessThan(0.5);
    }
  });

  it("steps through signs in order (accounting for retrograde)", () => {
    // Each ingress enters a sign adjacent to the previous one — either forward
    // (+1) or, during a retrograde crossing, backward (-1), modulo 12.
    for (let i = 1; i < ingresses.length; i++) {
      const delta =
        (ingresses[i].sign - ingresses[i - 1].sign + 12) % 12;
      expect([1, 11]).toContain(delta);
    }
    expect(ingresses.length).toBeGreaterThan(30); // Mars changes sign often
  });
});
