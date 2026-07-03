// Stage 2 of the search: narrow the Sun's ~30-day window down to just the days
// the Moon is in its target sign. The Moon is the fastest body — ~13°/day, so it
// spends only ~2.3 days per sign and passes through every sign once in a 30-day
// window. That single ~2-3 day stretch (occasionally a sliver at each end) is the
// only part of the month where a chart can match both the Sun and Moon signs, so
// everything downstream (planet scoring, ASC/degree tuning) happens inside it.
//
// We sample every 12h (the Moon moves only ~6.5° in 12h, far less than a 30°
// sign, so it can't slip through a sign unseen) and bisect each sign change to
// the minute. Sampling is bounded to the Sun window, so the returned intervals
// are automatically clipped to it — keeping the Sun sign exact even when the
// Moon match straddles the edge of the Sun's stay in its sign.

import { eclipticLongitude } from "./sky.ts";
import { signIndexOf } from "./signs.ts";

export interface Interval {
  start: Date;
  end: Date;
}

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const STEP_MS = 12 * HOUR_MS;

function moonSignAt(date: Date): number {
  return signIndexOf(eclipticLongitude("Moon", date));
}

// Narrow a 12h step known to contain one sign change down to the crossing
// instant (to the minute) by repeated halving.
function refineCrossing(before: Date, after: Date): Date {
  const startSign = moonSignAt(before);
  let lo = before.getTime();
  let hi = after.getTime();
  while (hi - lo > MINUTE_MS) {
    const mid = (lo + hi) / 2;
    if (moonSignAt(new Date(mid)) === startSign) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return new Date(hi);
}

// The interval(s) within `window` during which the Moon is in `moonSign`.
export function moonWindows(window: Interval, moonSign: number): Interval[] {
  const intervals: Interval[] = [];
  const endMs = window.end.getTime();

  let prevTime = window.start;
  let prevSign = moonSignAt(window.start);
  // If the window opens with the Moon already in the target sign, the interval
  // starts at the (clipped) window edge rather than at a crossing.
  let openStart: Date | null = prevSign === moonSign ? window.start : null;

  for (let t = window.start.getTime() + STEP_MS; ; t += STEP_MS) {
    const now = new Date(Math.min(t, endMs));
    const nowSign = moonSignAt(now);

    if (nowSign !== prevSign) {
      const crossing = refineCrossing(prevTime, now);
      if (prevSign === moonSign) {
        intervals.push({ start: openStart!, end: crossing });
        openStart = null;
      }
      if (nowSign === moonSign) {
        openStart = crossing;
      }
    }

    prevTime = now;
    prevSign = nowSign;
    if (t >= endMs) break;
  }

  // Still in the target sign at the (clipped) end of the window.
  if (openStart) intervals.push({ start: openStart, end: window.end });
  return intervals;
}
