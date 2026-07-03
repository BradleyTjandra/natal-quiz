// An "ingress" is the moment a body crosses from one zodiac sign into the next.
// The slow planets (Mars, Jupiter, Saturn) change sign rarely, so instead of
// recomputing their positions during every search, we precompute the full list
// of their sign changes once (see scripts/generate-ingress.ts) and ship it as
// static data. At search time, "which sign is Saturn in on this date?" becomes a
// lookup between two ingress dates rather than an astronomy calculation.

import { eclipticLongitude, type ChartBody } from "./sky.ts";
import { normalizeDegrees } from "./signs.ts";

export interface Ingress {
  date: string; // ISO UTC instant the body enters `sign`
  sign: number; // sign index 0..11 (0 = Aries) that it enters
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function signIndex(longitude: number): number {
  return Math.floor(normalizeDegrees(longitude) / 30);
}

// Narrow a one-step interval known to contain a single sign change down to the
// crossing instant (to within an hour) by repeated halving.
function refineCrossing(body: ChartBody, before: Date, after: Date): Date {
  const startSign = signIndex(eclipticLongitude(body, before));
  let lo = before.getTime();
  let hi = after.getTime();
  while (hi - lo > HOUR_MS) {
    const mid = (lo + hi) / 2;
    const midSign = signIndex(eclipticLongitude(body, new Date(mid)));
    if (midSign === startSign) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return new Date(hi);
}

// Walk from start to end in fixed steps, recording every sign change. The step
// must be small enough that the body can't enter *and* leave a sign within one
// step — true here because even a retrograde loop across a cusp spans weeks,
// far longer than the steps we use (see recommended step sizes below).
export function computeIngresses(
  body: ChartBody,
  start: Date,
  end: Date,
  stepDays: number,
): Ingress[] {
  const step = stepDays * DAY_MS;
  const ingresses: Ingress[] = [];

  let prevTime = start;
  let prevSign = signIndex(eclipticLongitude(body, start));

  for (let t = start.getTime() + step; t <= end.getTime(); t += step) {
    const now = new Date(t);
    const nowSign = signIndex(eclipticLongitude(body, now));
    if (nowSign !== prevSign) {
      const crossing = refineCrossing(body, prevTime, now);
      ingresses.push({
        date: crossing.toISOString(),
        sign: signIndex(eclipticLongitude(body, crossing)),
      });
    }
    prevTime = now;
    prevSign = nowSign;
  }

  return ingresses;
}

// Steps chosen per body: small enough to never miss a crossing, large enough to
// keep generation quick. Mars moves fastest (and can retrograde across a cusp),
// so it needs the finest step.
export const INGRESS_STEP_DAYS: Record<"Mars" | "Jupiter" | "Saturn", number> = {
  Mars: 1,
  Jupiter: 3,
  Saturn: 5,
};
