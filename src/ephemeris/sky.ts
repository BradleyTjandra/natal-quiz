// The "read the real sky" layer: given a moment in time (and, for the
// Ascendant, a place on Earth), return where each body actually was along the
// zodiac. Everything else in the app is a search *on top of* this — so this is
// the piece that must be correct for the whole conceit (a verifiable chart) to
// hold. See sky.test.ts for the accuracy checks.

import * as Astronomy from "astronomy-engine";
import { normalizeDegrees } from "./signs.ts";

// The bodies we place in a chart. Neptune and Pluto are intentionally excluded
// (generational, not personal — see docs/PRD.md).
export const CHART_BODIES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
] as const;

export type ChartBody = (typeof CHART_BODIES)[number];

// Astrology uses geocentric (Earth-centred) ecliptic longitude referred to the
// equinox "of date" — i.e. accounting for the slow wobble of Earth's axis
// (precession/nutation). Getting this frame right matters: over centuries the
// wrong frame drifts by whole degrees. astronomy-engine gives us three matching
// routes into that same frame (called "ECT" internally).
export function eclipticLongitude(
  body: ChartBody,
  date: Date,
): number {
  if (body === "Sun") {
    return Astronomy.SunPosition(date).elon;
  }
  if (body === "Moon") {
    return Astronomy.EclipticGeoMoon(date).lon;
  }
  // Planets: take the geocentric position vector, then rotate it from the
  // J2000 frame into the true-ecliptic-of-date frame and read its longitude.
  const bodyEnum = Astronomy.Body[body];
  const geoVector = Astronomy.GeoVector(bodyEnum, date, true);
  const rotation = Astronomy.Rotation_EQJ_ECT(date);
  const ectVector = Astronomy.RotateVector(rotation, geoVector);
  const spherical = Astronomy.SphereFromVector(ectVector);
  return normalizeDegrees(spherical.lon);
}

const DEG = Math.PI / 180;

// The Ascendant is the ecliptic longitude of the point rising on the eastern
// horizon at a given moment and place — the corner of the chart from which the
// 12 houses are laid out. It's computed analytically (no scanning) from local
// sidereal time and the tilt of Earth's axis. Standard formula; verified in the
// test by checking the resulting point is actually on the eastern horizon.
export function ascendant(
  date: Date,
  latitude: number,
  longitudeEast: number,
): number {
  // Local apparent sidereal time, expressed as an angle (the "RAMC").
  const gastHours = Astronomy.SiderealTime(date);
  const localSiderealDeg = normalizeDegrees(gastHours * 15 + longitudeEast);
  const ramc = localSiderealDeg * DEG;

  const obliquity = Astronomy.e_tilt(Astronomy.MakeTime(date)).tobl * DEG;
  const lat = latitude * DEG;

  const y = Math.cos(ramc);
  const x = -(Math.sin(ramc) * Math.cos(obliquity) +
    Math.tan(lat) * Math.sin(obliquity));
  let asc = Math.atan2(y, x) / DEG;

  return normalizeDegrees(asc);
}

export interface Chart {
  positions: Record<ChartBody, number>;
  ascendant: number;
}

// Read a full chart off a real moment and place.
export function computeChart(
  date: Date,
  latitude: number,
  longitudeEast: number,
): Chart {
  const positions = {} as Record<ChartBody, number>;
  for (const body of CHART_BODIES) {
    positions[body] = eclipticLongitude(body, date);
  }
  return { positions, ascendant: ascendant(date, latitude, longitudeEast) };
}
