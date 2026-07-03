// The whole search, tied together (SPEC §"Search algorithm", step 6). Stage 1
// ranks every candidate year by an upper bound on the score any moment in it
// could reach; we walk years best-bound-first, fully evaluating each (Stage 2
// finds the Moon-match interval, Stage 4 picks the exact minute and city), and
// keep the best real moment found. Because the years are sorted by a *valid*
// upper bound, once the best moment we hold already beats the next year's bound,
// no unexplored year can do better and we stop — guaranteed optimal, usually
// after only a few dozen years (branch and bound).

import { rankYears, sunWindow } from "./stage1.ts";
import { moonWindows, type Interval } from "./stage2.ts";
import { personalSignScore } from "./stage3.ts";
import { bestMomentInInterval, type Candidate } from "./stage4.ts";
import { maxScore, type Target } from "./scoring.ts";
import { computeChart } from "./sky.ts";

const EPS = 1e-9;

function midpoint(interval: Interval): Date {
  return new Date((interval.start.getTime() + interval.end.getTime()) / 2);
}

// Fully evaluate one year: the best real moment across its Moon-match
// interval(s). When a year has more than one such interval we try the one whose
// personal planets score higher (Stage 3) first, so a strong candidate surfaces
// early and prunes harder — ordering never changes which moment wins.
export function evaluateYear(target: Target, year: number): Candidate | null {
  const window = sunWindow(year, target.sun!.sign);
  const intervals = moonWindows(window, target.moon!.sign);
  if (intervals.length > 1) {
    intervals.sort(
      (a, b) =>
        personalSignScore(target, midpoint(b)) -
        personalSignScore(target, midpoint(a)),
    );
  }

  let best: Candidate | null = null;
  for (const interval of intervals) {
    const candidate = bestMomentInInterval(target, interval);
    if (candidate && (!best || candidate.score > best.score)) best = candidate;
  }
  return best;
}

export interface SearchOptions {
  startYear?: number; // inclusive; restrict the candidate years (e.g. for tests)
  endYear?: number; // exclusive
  // Accept the first chart scoring at least this fraction of the maximum and
  // stop early. 1.0 = run to the exact optimum (SPEC's literal "stop at the
  // maximum"); a hair below (e.g. 0.99) is the product's fast path — the gap is
  // sub-degree and ties are broken at random anyway, but it avoids scanning every
  // near-perfect year for a fractional degree gain. See PLAN.md.
  acceptRatio?: number;
  // Explore at most this many candidate years (the best-bound-first ones) before
  // returning the best found. SPEC expects termination "after a few dozen years";
  // this caps the rare tail where a loose bound would otherwise scan hundreds.
  // Omit for an exhaustive, provably-optimal search (used by the optimality test).
  maxYears?: number;
}

// Find the real birth moment whose sky best matches the target. `startYear`/
// `endYear` narrow the candidate range (used by the optimality test); by default
// the full configured range is searched to the exact optimum.
export function search(target: Target, opts: SearchOptions = {}): Candidate {
  if (!target.sun || !target.moon || !target.ascendant) {
    throw new Error("target must include Sun, Moon and Ascendant");
  }

  let ranked = rankYears(target);
  if (opts.startYear != null || opts.endYear != null) {
    ranked = ranked.filter(
      (r) =>
        (opts.startYear == null || r.year >= opts.startYear) &&
        (opts.endYear == null || r.year < opts.endYear),
    );
  }

  const max = maxScore(target);
  const acceptScore = (opts.acceptRatio ?? 1.0) * max;
  const budget = opts.maxYears ?? Infinity;
  let best: Candidate | null = null;
  let explored = 0;

  for (const { year, bound } of ranked) {
    // Years are sorted by descending bound, so if the best we hold already meets
    // this year's ceiling, every remaining year is capped no higher — stop.
    if (best && best.score >= bound - EPS) break;
    if (explored >= budget) break;

    const candidate = evaluateYear(target, year);
    if (candidate && (!best || candidate.score > best.score)) best = candidate;
    explored++;

    // Good enough (perfect, or within acceptRatio): stop looking.
    if (best && best.score >= acceptScore - EPS) break;
  }

  if (!best) throw new Error("search found no candidate moment");

  // The hot loop scored only the targeted bodies; fill in the full chart
  // (Jupiter/Saturn/Uranus included) for the moment we're actually returning.
  best.chart = computeChart(
    best.date,
    best.city.latitude,
    best.city.longitudeEast,
  );
  return best;
}
