// Stage 1 of the search: rank candidate years by an *upper bound* on the score
// any moment in that year could reach, so the branch-and-bound loop can walk the
// most promising years first and stop once no remaining year could beat the best
// candidate found. The bound must never understate the truth, or we could stop
// too early and miss the real best moment.
//
// What varies year to year (in M1) is Mars: during the ~30-day window when the
// Sun is in the target sign, Mars is only in one or two signs, so most years
// simply can't place Mars in its target sign — those years get a lower ceiling
// and are explored later. Everything else (big three by construction, and
// Mercury/Venus, which stay close to the Sun and can almost always reach their
// constrained target) is assumed best-case, which keeps the bound valid.

import { SearchSunLongitude } from "astronomy-engine";
import { INGRESS_RANGE, signsInWindow } from "./ingressTables.ts";
import { fullReward, reachableReward, type Target, type Placement } from "./scoring.ts";

export interface SunWindow {
  start: Date;
  end: Date;
}

// The Sun window for a (year, sign) is a fixed fact about the sky, and the search
// asks for the same ones repeatedly (every target re-ranks all 500 years, and
// many targets share a Sun sign). Memoizing turns the acceptance test's ~250k
// Sun searches into a few thousand. Safe because the function is pure — the
// cached Date objects are only ever read, never mutated.
const sunWindowCache = new Map<number, SunWindow>();

// The stretch of a given year when the Sun occupies `sunSign`. Anchored to the
// occurrence that *starts* in this year (so late signs straddling into January
// belong to the year they began in).
export function sunWindow(year: number, sunSign: number): SunWindow {
  const key = year * 12 + sunSign;
  const cached = sunWindowCache.get(key);
  if (cached) return cached;

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const enter = SearchSunLongitude(sunSign * 30, yearStart, 400);
  if (!enter) throw new Error(`no Sun entry into sign ${sunSign} in ${year}`);
  const exit = SearchSunLongitude(((sunSign + 1) % 12) * 30, enter.date, 40);
  if (!exit) throw new Error(`no Sun exit from sign ${sunSign} in ${year}`);
  const window = { start: enter.date, end: exit.date };
  sunWindowCache.set(key, window);
  return window;
}

export function yearUpperBound(target: Target, year: number): number {
  const sun = target.sun;
  if (!sun) throw new Error("target must include the Sun to rank years");

  const window = sunWindow(year, sun.sign);
  const marsSigns = target.mars
    ? signsInWindow("Mars", window.start, window.end)
    : null;

  let bound = 0;
  for (const key of Object.keys(target) as Placement[]) {
    const t = target[key]!;
    // Mars is the only placement whose best case depends on the year: cap its
    // contribution to the best it can do among the signs it actually visits.
    if (key === "mars" && marsSigns) {
      bound += reachableReward("mars", t, marsSigns);
    } else {
      bound += fullReward(key, t);
    }
  }
  return bound;
}

export interface RankedYear {
  year: number;
  bound: number;
}

// Every year in range, sorted by descending upper bound (best prospects first).
export function rankYears(target: Target): RankedYear[] {
  const ranked: RankedYear[] = [];
  for (let year = INGRESS_RANGE.startYear; year < INGRESS_RANGE.endYear; year++) {
    ranked.push({ year, bound: yearUpperBound(target, year) });
  }
  ranked.sort((a, b) => b.bound - a.bound);
  return ranked;
}
