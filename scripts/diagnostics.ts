// Diagnostics for the search: how often does a target match *exactly* (all three
// soft personal planets land, on top of the always-exact big three) versus only
// partially? Mirrors the acceptance test's random-but-valid targets.
// Run: node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/diagnostics.ts [N]

import { search } from "../src/ephemeris/search.ts";
import { maxScore, type Target, type PlanetTarget } from "../src/ephemeris/scoring.ts";
import { signIndexOf } from "../src/ephemeris/signs.ts";

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

const wrap = (n: number) => ((n % 12) + 12) % 12;

function randomTarget(rng: () => number): Target {
  const pick = (span: number) => Math.floor(rng() * span);
  const placement = (sign: number): PlanetTarget => ({
    sign: wrap(sign),
    degree: rng() * 30,
    confidence: 0.2 + rng() * 0.8,
  });
  const sun = pick(12);
  return {
    sun: placement(sun),
    moon: placement(pick(12)),
    ascendant: placement(pick(12)),
    mercury: placement(sun + (pick(3) - 1)),
    venus: placement(sun + (pick(5) - 2)),
    mars: placement(pick(12)),
  };
}

const PERSONAL = [
  ["mercury", "Mercury"],
  ["venus", "Venus"],
  ["mars", "Mars"],
] as const;

const N = Number(process.argv[2] ?? 200);
// Second arg "strict" runs the exact optimum (no early-accept, no year budget)
// so we can see what the fast path costs in match rate.
const strict = process.argv[3] === "strict";
const opts = strict ? {} : { acceptRatio: 0.99, maxYears: 40 };
const rng = makeRng(0x1234abcd);

const matchCounts = [0, 0, 0, 0]; // index = how many of the 3 personal matched
const perPlanet: Record<string, { hi: [number, number]; lo: [number, number] }> = {
  Mercury: { hi: [0, 0], lo: [0, 0] },
  Venus: { hi: [0, 0], lo: [0, 0] },
  Mars: { hi: [0, 0], lo: [0, 0] },
};
const scoreBuckets = new Array(11).fill(0); // 90-91%, ..., 100%
let big3Failures = 0;
let scoreRatioSum = 0;
const t0 = Date.now();

for (let i = 0; i < N; i++) {
  const target = randomTarget(rng);
  const r = search(target, opts);

  if (
    signIndexOf(r.chart.positions.Sun) !== target.sun!.sign ||
    signIndexOf(r.chart.positions.Moon) !== target.moon!.sign ||
    signIndexOf(r.chart.ascendant) !== target.ascendant!.sign
  ) {
    big3Failures++;
  }

  let matched = 0;
  for (const [key, body] of PERSONAL) {
    const t = target[key]!;
    const ok = signIndexOf(r.chart.positions[body]) === t.sign;
    if (ok) matched++;
    const tier = t.confidence >= 0.7 ? "hi" : "lo";
    perPlanet[body][tier][1]++;
    if (ok) perPlanet[body][tier][0]++;
  }
  matchCounts[matched]++;

  const ratio = r.score / maxScore(target);
  scoreRatioSum += ratio;
  const bucket = Math.min(10, Math.max(0, Math.floor((ratio - 0.9) / 0.01)));
  scoreBuckets[bucket]++;
}

const ms = Date.now() - t0;
const pct = (n: number) => ((100 * n) / N).toFixed(1) + "%";
const rate = ([m, tot]: [number, number]) =>
  tot === 0 ? "  n/a" : (100 * m / tot).toFixed(1).padStart(5) + "%";

console.log(`\n=== search diagnostics: ${N} targets in ${(ms / 1000).toFixed(1)}s ===`);
console.log(strict
  ? `(strict: exact optimum — no early-accept, no year budget)\n`
  : `(fast path: acceptRatio 0.99, maxYears 40 — the product setting)\n`);

console.log(`big three (Sun/Moon/ASC) exact: ${N - big3Failures}/${N}` +
  (big3Failures ? `  *** ${big3Failures} FAILURES ***` : "  ✓ always"));

console.log(`\npersonal-planet outcome per target (Mercury+Venus+Mars):`);
console.log(`  all 3 matched (fully exact): ${matchCounts[3]}  (${pct(matchCounts[3])})`);
console.log(`  2 of 3 matched:              ${matchCounts[2]}  (${pct(matchCounts[2])})`);
console.log(`  1 of 3 matched:              ${matchCounts[1]}  (${pct(matchCounts[1])})`);
console.log(`  0 of 3 matched:              ${matchCounts[0]}  (${pct(matchCounts[0])})`);

console.log(`\nper-planet match rate (high-confidence / low-confidence answers):`);
for (const body of ["Mercury", "Venus", "Mars"]) {
  const p = perPlanet[body];
  console.log(`  ${body.padEnd(8)} hi:${rate(p.hi)}  lo:${rate(p.lo)}`);
}

console.log(`\nscore / maxScore distribution:`);
for (let b = 0; b <= 10; b++) {
  const lo = 90 + b;
  const label = b === 10 ? "100%   " : `${lo}-${lo + 1}%`;
  const bar = "█".repeat(Math.round((40 * scoreBuckets[b]) / N));
  console.log(`  ${label.padEnd(8)} ${String(scoreBuckets[b]).padStart(4)} ${bar}`);
}
console.log(`  mean: ${(100 * scoreRatioSum / N).toFixed(1)}%`);
