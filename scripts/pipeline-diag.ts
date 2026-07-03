// End-to-end validation of the reward-scoring change: generate realistic quiz
// score vectors, run the full solve -> search pipeline, and measure whether soft
// planets that can't reach their ideal sign fall back to an astrologically
// *similar* one (same element or modality) rather than an arbitrary miss.
//
// The vectors are built the way M3's quiz will build them — each sign is a unique
// element x modality pair, and a "person" has an affinity for one element and one
// modality, so similar signs score similarly. (This is a stand-in for the real
// quiz projection, kept here rather than in src/ until M3.)
// Run: node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/pipeline-diag.ts [N]

import { solve, type ScoreVectors, type QuizzedPlacement } from "../src/solver/solve.ts";
import { search } from "../src/ephemeris/search.ts";
import { signIndexOf } from "../src/ephemeris/signs.ts";

// Each sign's element (0=Fire,1=Earth,2=Air,3=Water) and modality
// (0=Cardinal,1=Fixed,2=Mutable). The zodiac is laid out so these are just s%4
// and s%3 — every pair unique.
const element = (s: number) => s % 4;
const modality = (s: number) => s % 3;

function makeRng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A realistic placement vector: peaked at one element and one modality, with
// element weighted a bit more (as in astrology), plus light noise. Similar signs
// therefore score similarly — the structure the fallback relies on.
function placementVector(rng: () => number): number[] {
  const e0 = Math.floor(rng() * 4);
  const m0 = Math.floor(rng() * 3);
  const elemAff = [0, 1, 2, 3].map((e) => (e === e0 ? 1 : 0.3 * rng()));
  const modAff = [0, 1, 2].map((m) => (m === m0 ? 1 : 0.3 * rng()));
  return Array.from({ length: 12 }, (_, s) =>
    1.0 * elemAff[element(s)] + 0.6 * modAff[modality(s)] + 0.05 * rng(),
  );
}

function randomVectors(rng: () => number): ScoreVectors {
  const keys: QuizzedPlacement[] = ["sun", "moon", "ascendant", "mercury", "venus", "mars"];
  const v = {} as ScoreVectors;
  for (const k of keys) v[k] = placementVector(rng);
  return v;
}

const argmax = (v: number[]) => v.reduce((b, x, i) => (x > v[b] ? i : b), 0);

const N = Number(process.argv[2] ?? 120);
const rng = makeRng(0xc0ffee);

const SOFT = [
  ["mercury", "Mercury"],
  ["venus", "Venus"],
  ["mars", "Mars"],
] as const;

let big3Fail = 0;
let softTotal = 0;
let landedIdeal = 0;
let landedBestOffered = 0;
let nonIdeal = 0;
let keptElement = 0;
let keptModality = 0;
let keptEither = 0;
let rewardAtLandedSum = 0;
const t0 = Date.now();

for (let i = 0; i < N; i++) {
  const vectors = randomVectors(rng);
  const target = solve(vectors);
  const r = search(target, { acceptRatio: 0.99, maxYears: 40 });

  if (
    signIndexOf(r.chart.positions.Sun) !== target.sun!.sign ||
    signIndexOf(r.chart.positions.Moon) !== target.moon!.sign ||
    signIndexOf(r.chart.ascendant) !== target.ascendant!.sign
  ) {
    big3Fail++;
  }

  for (const [key, body] of SOFT) {
    const t = target[key]!;
    const ideal = argmax(vectors[key]); // the sign the person most tested as
    const bestOffered = argmax(t.reward!); // best sign the solver left reachable
    const landed = signIndexOf(r.chart.positions[body]);

    softTotal++;
    rewardAtLandedSum += t.reward![landed];
    if (landed === ideal) landedIdeal++;
    if (landed === bestOffered) landedBestOffered++;

    if (landed !== ideal) {
      nonIdeal++;
      const e = element(landed) === element(ideal);
      const m = modality(landed) === modality(ideal);
      if (e) keptElement++;
      if (m) keptModality++;
      if (e || m) keptEither++;
    }
  }
}

const ms = Date.now() - t0;
const pct = (n: number, d: number) => (d === 0 ? "n/a" : (100 * n / d).toFixed(1) + "%");

console.log(`\n=== pipeline diagnostics (solve -> search): ${N} people in ${(ms / 1000).toFixed(1)}s ===\n`);
console.log(`big three exact: ${pct(N - big3Fail, N)}` + (big3Fail ? `  *** ${big3Fail} FAILURES ***` : "  (always)"));
console.log(`\nsoft planets (${softTotal} placements across Mercury/Venus/Mars):`);
console.log(`  landed on the ideal sign:            ${pct(landedIdeal, softTotal)}`);
console.log(`  landed on the best offered sign:     ${pct(landedBestOffered, softTotal)}  (search realises the solver's intent)`);
console.log(`  mean quiz-fit reward at landed sign: ${(rewardAtLandedSum / softTotal).toFixed(3)}  (1.0 = ideal)`);
console.log(`\nwhen the ideal sign was NOT reached (${nonIdeal} cases) — did it keep the vibe?`);
console.log(`  kept the same element:  ${pct(keptElement, nonIdeal)}`);
console.log(`  kept the same modality: ${pct(keptModality, nonIdeal)}`);
console.log(`  kept element OR modality (graceful fallback): ${pct(keptEither, nonIdeal)}`);
console.log(`  (a random miss would keep element ~18% or modality ~27% of the time)`);
