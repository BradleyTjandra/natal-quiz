// Layer 2 — Target Resolution (SPEC §"Layer 2"). The quiz (M3) produces, for each
// quizzed placement, a 12-long vector of how strongly the answers point at each
// sign. This module turns those six vectors into a concrete Target for the
// ephemeris search: one sign per planet, plus a confidence weight and a target
// degree derived from how decisive the quiz was.
//
// The only coupling is the hard astrological constraint that ties Mercury and
// Venus to the Sun (Mercury within ±1 sign, Venus within ±2 — real limits, since
// those planets never stray far from the Sun in the sky). That makes Sun/Mercury/
// Venus a tiny joint problem we brute-force; Moon, Ascendant and Mars are picked
// independently.

import type { Target, PlanetTarget } from "../ephemeris/scoring.ts";

// The six placements the quiz scores. Jupiter/Saturn arrive as low-weight
// tie-breakers in M5; the outer planets fall out of the birth date, not the quiz.
export type QuizzedPlacement =
  | "sun"
  | "moon"
  | "ascendant"
  | "mercury"
  | "venus"
  | "mars";

// A length-12 vector; index 0 = Aries. Units are arbitrary — everything here is
// scale-invariant, so the quiz can score however it likes.
export type SignScores = number[];
export type ScoreVectors = Record<QuizzedPlacement, SignScores>;

// Distance between two signs on the zodiac *circle* (Pisces and Aries are
// adjacent), 0..6.
function signDistance(a: number, b: number): number {
  const d = (((a - b) % 12) + 12) % 12;
  return Math.min(d, 12 - d);
}

// How decisively the quiz picked `sign`, normalised to 0..1: 1 = runaway winner,
// 0 = a dead heat — or `sign` wasn't even the top choice, which happens when a
// constraint forces the planet off its raw winner. Normalising by the vector's
// own spread keeps this independent of the quiz's scoring units.
function decisiveness(v: SignScores, sign: number): number {
  const max = Math.max(...v);
  const min = Math.min(...v);
  const range = max - min;
  if (range <= 0) return 0; // flat vector — the quiz said nothing

  let runnerUp = -Infinity;
  for (let i = 0; i < 12; i++) {
    if (i !== sign && v[i] > runnerUp) runnerUp = v[i];
  }
  return Math.max(0, Math.min(1, (v[sign] - runnerUp) / range));
}

// Turn a chosen sign into a full target. Decisiveness sets both knobs (SPEC):
//   landslide (→1): non-negotiable in the search, planet sits solidly placed (~7°)
//   coin-flip (→0): flexible, planet sits near a cusp (~27°, "could be either sign")
// The two constants are the main tuning dials for how the quiz "feels".
function placementFrom(v: SignScores, sign: number): PlanetTarget {
  const d = decisiveness(v, sign);
  return {
    sign,
    confidence: d,
    degree: 27 - d * 20, // d=1 → 7°, d=0 → 27°
  };
}

function argmax(v: SignScores): number {
  let best = 0;
  for (let i = 1; i < 12; i++) if (v[i] > v[best]) best = i;
  return best;
}

// Best sign for a planet restricted to those within `maxDist` signs of the Sun.
function bestWithin(v: SignScores, sunSign: number, maxDist: number): number {
  let best = -1;
  for (let s = 0; s < 12; s++) {
    if (signDistance(s, sunSign) > maxDist) continue;
    if (best === -1 || v[s] > v[best]) best = s;
  }
  return best;
}

export function solve(vectors: ScoreVectors): Target {
  // Sun/Mercury/Venus are coupled by the constraints, so we can't just take each
  // one's own winner: a marginal Sun sign may be worth flipping to if it unlocks
  // a much stronger Mercury or Venus. For each candidate Sun, Mercury and Venus
  // independently take their best *allowed* sign; keep the Sun with the highest
  // combined total. Only 12 Suns to check.
  let bestSun = 0;
  let bestMerc = 0;
  let bestVenus = 0;
  let bestTotal = -Infinity;
  for (let sun = 0; sun < 12; sun++) {
    const merc = bestWithin(vectors.mercury, sun, 1);
    const venus = bestWithin(vectors.venus, sun, 2);
    const total = vectors.sun[sun] + vectors.mercury[merc] + vectors.venus[venus];
    if (total > bestTotal) {
      bestTotal = total;
      bestSun = sun;
      bestMerc = merc;
      bestVenus = venus;
    }
  }

  return {
    sun: placementFrom(vectors.sun, bestSun),
    moon: placementFrom(vectors.moon, argmax(vectors.moon)),
    ascendant: placementFrom(vectors.ascendant, argmax(vectors.ascendant)),
    mercury: placementFrom(vectors.mercury, bestMerc),
    venus: placementFrom(vectors.venus, bestVenus),
    mars: placementFrom(vectors.mars, argmax(vectors.mars)),
  };
}
