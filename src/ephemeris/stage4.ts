// Stage 4 of the search: pick the actual birth minute and city. By here the Sun
// and Moon signs are already locked in (we only ever look inside a Moon-match
// interval, itself clipped to the Sun window), so this stage's job is the two
// remaining degrees of freedom — the exact time of day and the city — tuned to
// hit the target Ascendant and Moon *degrees*.
//
// Two physical facts make this cheap and exact:
//   1. The Ascendant advances strictly one direction, sweeping all 360° once per
//      sidereal day. So for a target Ascendant longitude there is exactly one
//      instant per sidereal day that hits it — found by bisection, no scanning,
//      and hit *exactly* (so the ASC sign is always right and its degree is too).
//   2. The Moon's longitude here is geocentric — the same for every city at a
//      given instant. The city matters because each city needs a *different* UTC
//      instant to bring the target Ascendant onto its horizon, and a different
//      instant means a different Moon degree. Spreading cities across all
//      longitudes therefore spreads the reachable Moon degrees (SPEC: ~±6°).
//
// So: for each city, find the instants in the interval that place the Ascendant
// exactly on target, read the real chart there, and keep the best-scoring one.

import { SiderealTime, e_tilt, MakeTime } from "astronomy-engine";
import { computeChart, type Chart, type ChartBody } from "./sky.ts";
import { scoreChart, recencyBonus, type Target } from "./scoring.ts";
import { CITIES, type City } from "./cities.ts";
import type { Interval } from "./stage2.ts";
import { normalizeDegrees } from "./signs.ts";

export interface Candidate {
  date: Date;
  city: City;
  chart: Chart;
  score: number;
}

const DEG = Math.PI / 180;
// Sidereal time runs slightly faster than solar: one solar hour is this many
// sidereal hours. Used to convert a required sidereal time back into a UTC time.
const SIDEREAL_RATE = 1.00273790935;

// The local *apparent sidereal time* (as an angle, degrees) at which a given
// ecliptic longitude is the Ascendant, for a given latitude and obliquity. This
// inverts the ascendant() formula in sky.ts analytically — solving
// A·cos(ramc) + B·sin(ramc) = C for the sidereal angle "ramc" — rather than
// scanning for it (SPEC: "analytic via sidereal time — no scanning"). Two roots
// exist (the longitude rising vs. the same longitude setting); we keep the one
// that reproduces the target when fed back through the forward formula.
function siderealAngleForAscendant(
  targetLon: number,
  latitude: number,
  obliquity: number,
): number {
  const lam = targetLon * DEG;
  const eps = obliquity * DEG;
  const lat = latitude * DEG;

  const A = Math.cos(lam);
  const B = Math.sin(lam) * Math.cos(eps);
  const C = -Math.sin(lam) * Math.tan(lat) * Math.sin(eps);

  const amp = Math.hypot(A, B);
  const phase = Math.atan2(B, A);
  const delta = Math.acos(Math.max(-1, Math.min(1, C / amp)));

  for (const ramc of [phase + delta, phase - delta]) {
    // Forward formula (identical to sky.ts ascendant) to pick the rising root.
    const y = Math.cos(ramc);
    const x = -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps));
    const asc = normalizeDegrees(Math.atan2(y, x) / DEG);
    if (Math.abs(normalizeDegrees(asc - targetLon + 180) - 180) < 1e-6) {
      return normalizeDegrees(ramc / DEG);
    }
  }
  // Fallback (shouldn't happen for our sub-polar latitudes): first root.
  return normalizeDegrees((phase + delta) / DEG);
}

// The next instant at or after `fromMs` when this city's Ascendant equals the
// ecliptic longitude `targetLon`. We solve for the required sidereal time
// directly, then convert that sidereal time to UTC (sidereal time is ~linear in
// UT, so one linear step plus a refinement pins it to the second).
function nextAscCrossing(city: City, targetLon: number, fromMs: number): number {
  const from = new Date(fromMs);
  const obliquity = e_tilt(MakeTime(from)).tobl;
  const localSidDeg = siderealAngleForAscendant(
    targetLon,
    city.latitude,
    obliquity,
  );
  // localSiderealDeg = GAST°·+ longitudeEast (see ascendant()), so back out the
  // Greenwich apparent sidereal time this crossing needs, in hours.
  const targetGastHours = normalizeDegrees(localSidDeg - city.longitudeEast) / 15;

  let t = fromMs;
  for (let i = 0; i < 3; i++) {
    const gast = SiderealTime(new Date(t));
    // Sidereal hours we still need to advance (0..24 on the first pass, then a
    // small signed correction).
    let dh = ((targetGastHours - gast) % 24 + 24) % 24;
    if (i > 0 && dh > 12) dh -= 24; // nearest, not next, once we're close
    t += (dh / SIDEREAL_RATE) * 3600 * 1000;
  }
  return t;
}

// Every instant within `interval` when this city's Ascendant hits `targetLon`.
// Crossings are ~one sidereal day apart, so we find one and step past it.
export function ascCrossings(
  city: City,
  targetLon: number,
  interval: Interval,
): Date[] {
  const endMs = interval.end.getTime();
  const times: Date[] = [];
  let t = nextAscCrossing(city, targetLon, interval.start.getTime());
  while (t <= endMs) {
    times.push(new Date(t));
    t = nextAscCrossing(city, targetLon, t + 60000);
  }
  return times;
}

const BODY_OF: Record<string, ChartBody> = {
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
};

// The charted bodies a target actually scores (Ascendant isn't a body). The hot
// loop computes only these — skipping e.g. Uranus and any untargeted planet.
export function scoredBodies(target: Target): ChartBody[] {
  const bodies: ChartBody[] = [];
  for (const key of Object.keys(target)) {
    const body = BODY_OF[key];
    if (body) bodies.push(body);
  }
  return bodies;
}

// The best real birth moment within a Moon-match interval: over every city, land
// the Ascendant exactly on its target longitude, read the actual chart, and keep
// the highest-scoring one. Returns null only if the interval is too short for the
// target Ascendant to rise in any city (rare — it rises daily).
export function bestMomentInInterval(
  target: Target,
  interval: Interval,
): Candidate | null {
  const asc = target.ascendant;
  if (!asc) throw new Error("target must include the Ascendant for Stage 4");
  const targetLon = asc.sign * 30 + asc.degree;
  const bodies = scoredBodies(target);

  let best: Candidate | null = null;
  for (const city of CITIES) {
    for (const date of ascCrossings(city, targetLon, interval)) {
      const chart = computeChart(date, city.latitude, city.longitudeEast, bodies);
      const score = scoreChart(target, chart) + recencyBonus(date.getFullYear());
      if (!best || score > best.score) {
        best = { date, city, chart, score };
      }
    }
  }
  return best;
}
