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

// The target degree from decisiveness (SPEC): landslide (→1) sits the planet
// solidly placed (~7°); coin-flip (→0) puts it near a cusp (~27°). The two
// constants are the main dials for how "solid vs cuspy" the quiz feels.
function degreeFrom(d: number): number {
  return 27 - d * 20; // d=1 → 7°, d=0 → 27°
}

// A hard placement (the big three): guaranteed to match by construction, so it
// carries a single sign and a confidence that only scales its degree reward.
function hardPlacement(v: SignScores, sign: number): PlanetTarget {
  const d = decisiveness(v, sign);
  return { sign, confidence: d, degree: degreeFrom(d) };
}

// Normalise a vector to 0..1 (best sign → 1) so the search can reward a planet by
// how well the sign it lands on fits. A flat vector (no signal) becomes all 1s —
// the planet is happy anywhere, so it never constrains the search.
function normalize(v: SignScores): number[] {
  const max = Math.max(...v);
  const min = Math.min(...v);
  const range = max - min;
  if (range <= 0) return v.map(() => 1);
  return v.map((x) => (x - min) / range);
}

function argmax(v: number[]): number {
  let best = 0;
  for (let i = 1; i < v.length; i++) if (v[i] > v[best]) best = i;
  return best;
}

// A soft placement (Mercury/Venus/Mars): carries the full reward profile so the
// search scores it by fit at the landed sign. For Mercury/Venus, signs beyond
// the ±maxDist reach of the Sun are zeroed — the real sky never puts them there,
// so keeping their reward would only inflate the theoretical maximum.
function softPlacement(v: SignScores, sunSign?: number, maxDist = 0): PlanetTarget {
  let reward = normalize(v);
  if (sunSign != null) {
    reward = reward.map((r, s) => (signDistance(s, sunSign) <= maxDist ? r : 0));
  }
  const sign = argmax(reward); // best *reachable* sign
  const d = decisiveness(v, sign);
  return { sign, confidence: d, degree: degreeFrom(d), reward };
}

// Best reachable raw score for a planet within `maxDist` signs of the Sun — used
// only to weigh the joint Sun choice below.
function bestWithin(v: SignScores, sunSign: number, maxDist: number): number {
  let best = -Infinity;
  for (let s = 0; s < 12; s++) {
    if (signDistance(s, sunSign) <= maxDist && v[s] > best) best = v[s];
  }
  return best;
}

export function solve(vectors: ScoreVectors): Target {
  // Sun/Mercury/Venus are coupled by the constraints, so the Sun isn't simply its
  // own winner: a marginal Sun sign may be worth flipping to if it unlocks a much
  // stronger Mercury or Venus. Pick the Sun maximising the trio's combined raw
  // score, with Mercury/Venus each taking their best allowed sign. Only 12 Suns.
  let bestSun = 0;
  let bestTotal = -Infinity;
  for (let sun = 0; sun < 12; sun++) {
    const total =
      vectors.sun[sun] +
      bestWithin(vectors.mercury, sun, 1) +
      bestWithin(vectors.venus, sun, 2);
    if (total > bestTotal) {
      bestTotal = total;
      bestSun = sun;
    }
  }

  return {
    sun: hardPlacement(vectors.sun, bestSun),
    moon: hardPlacement(vectors.moon, argmax(vectors.moon)),
    ascendant: hardPlacement(vectors.ascendant, argmax(vectors.ascendant)),
    mercury: softPlacement(vectors.mercury, bestSun, 1),
    venus: softPlacement(vectors.venus, bestSun, 2),
    mars: softPlacement(vectors.mars),
  };
}
