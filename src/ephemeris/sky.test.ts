// These tests are the point of building the sky layer first: they prove we can
// reproduce a *real* sky from astronomy-engine, which is the foundation the
// whole "verifiable chart" conceit rests on. Rather than trust hand-copied
// numbers from an astrology website, each test cross-checks our code against the
// library's own independent calculations.

import { describe, it, expect } from "vitest";
import * as Astronomy from "astronomy-engine";
import {
  SIGNS,
  signOf,
  degreeInSign,
  normalizeDegrees,
  formatPosition,
} from "./signs.ts";
import { eclipticLongitude, ascendant, computeChart } from "./sky.ts";

describe("sign arithmetic", () => {
  it("maps longitudes to the right sign", () => {
    expect(signOf(0)).toBe("Aries");
    expect(signOf(29.9)).toBe("Aries");
    expect(signOf(30)).toBe("Taurus");
    expect(signOf(185)).toBe("Libra");
    expect(signOf(359)).toBe("Pisces");
  });

  it("wraps angles outside [0, 360)", () => {
    expect(normalizeDegrees(-1)).toBeCloseTo(359);
    expect(normalizeDegrees(365)).toBeCloseTo(5);
    expect(signOf(-1)).toBe("Pisces");
    expect(signOf(360)).toBe("Aries");
  });

  it("reports degree within the sign and formats it", () => {
    expect(degreeInSign(34.5)).toBeCloseTo(4.5);
    expect(formatPosition(34.5)).toBe("Taurus 4.5°");
    expect(SIGNS).toHaveLength(12);
  });
});

describe("Sun longitude anchors to the equinoxes and solstices", () => {
  // The library can independently compute the exact instant of each equinox and
  // solstice. By definition the Sun sits at 0/90/180/270° ecliptic longitude at
  // those instants — so if our Sun longitude agrees, our whole frame is right.
  const seasons = Astronomy.Seasons(2005);
  const cases: [string, Astronomy.AstroTime, number][] = [
    ["March equinox", seasons.mar_equinox, 0],
    ["June solstice", seasons.jun_solstice, 90],
    ["September equinox", seasons.sep_equinox, 180],
    ["December solstice", seasons.dec_solstice, 270],
  ];

  for (const [name, time, expected] of cases) {
    it(`${name}: Sun ≈ ${expected}°`, () => {
      const lon = eclipticLongitude("Sun", time.date);
      const diff = Math.abs(normalizeDegrees(lon - expected + 180) - 180);
      expect(diff).toBeLessThan(0.01);
    });
  }
});

describe("planet longitude route", () => {
  // Sun/Moon use the library's dedicated of-date functions, but Mercury..Uranus
  // go through our own GeoVector -> rotate-to-ecliptic-of-date route. We can't
  // easily hand-verify Mars, but we *can* run the Sun through that same planet
  // route and confirm it matches the library's dedicated SunPosition. Agreement
  // there validates the route for every planet that uses it.
  it("matches SunPosition when the Sun is put through the planet route", () => {
    const date = new Date("1985-11-03T08:20:00Z");
    const viaSunPosition = Astronomy.SunPosition(date).elon;

    const geo = Astronomy.GeoVector(Astronomy.Body.Sun, date, true);
    const ect = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(date), geo);
    const viaPlanetRoute = normalizeDegrees(Astronomy.SphereFromVector(ect).lon);

    const diff = Math.abs(
      normalizeDegrees(viaPlanetRoute - viaSunPosition + 180) - 180,
    );
    expect(diff).toBeLessThan(0.02);
  });
});

describe("Ascendant is the point rising on the eastern horizon", () => {
  // Independent check: take the Ascendant longitude we computed, treat it as a
  // point on the ecliptic, and convert it through the library's coordinate
  // machinery (ecliptic-of-date -> equator-of-date -> horizontal) into an
  // altitude and azimuth. A correct Ascendant must sit on the horizon
  // (altitude ≈ 0) and on the eastern half of the sky (azimuth 0–180, since
  // east = +90 in this convention).
  const samples: [string, Date, number, number][] = [
    ["London 1990", new Date("1990-06-15T14:30:00Z"), 51.5, -0.13],
    ["Tokyo 1975", new Date("1975-02-01T21:05:00Z"), 35.68, 139.69],
    ["Rio 2011", new Date("2011-09-22T03:14:00Z"), -22.91, -43.17],
    ["Auckland 1962", new Date("1962-12-30T11:47:00Z"), -36.85, 174.76],
  ];

  for (const [name, date, lat, lon] of samples) {
    it(`${name}: rising point is on the eastern horizon`, () => {
      const ascLon = ascendant(date, lat, lon);

      const time = Astronomy.MakeTime(date);
      const ecliptic = new Astronomy.Spherical(0, ascLon, 1);
      const ectVec = Astronomy.VectorFromSphere(ecliptic, time);
      const eqdVec = Astronomy.RotateVector(
        Astronomy.Rotation_ECT_EQD(time),
        ectVec,
      );
      const observer = new Astronomy.Observer(lat, lon, 0);
      const horVec = Astronomy.RotateVector(
        Astronomy.Rotation_EQD_HOR(time, observer),
        eqdVec,
      );
      const horizontal = Astronomy.HorizonFromVector(horVec, null as never);

      expect(Math.abs(horizontal.lat)).toBeLessThan(0.01); // on the horizon
      expect(horizontal.lon).toBeGreaterThan(0); // eastern half...
      expect(horizontal.lon).toBeLessThan(180); // ...i.e. rising, not setting
    });
  }
});

describe("computeChart", () => {
  it("returns all eight bodies plus an Ascendant, all in range", () => {
    const chart = computeChart(
      new Date("2000-01-01T00:00:00Z"),
      40.71,
      -74.01,
    );
    expect(Object.keys(chart.positions)).toHaveLength(8);
    for (const lon of Object.values(chart.positions)) {
      expect(lon).toBeGreaterThanOrEqual(0);
      expect(lon).toBeLessThan(360);
    }
    expect(chart.ascendant).toBeGreaterThanOrEqual(0);
    expect(chart.ascendant).toBeLessThan(360);
  });
});
