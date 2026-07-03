// Scratch: run one search and print the birth moment + chart, so we can eyeball
// it against a mainstream astrology site (the product's core promise).
// Run: node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/try-search.ts

import { search } from "../src/ephemeris/search.ts";
import { maxScore, type Target } from "../src/ephemeris/scoring.ts";
import { CHART_BODIES } from "../src/ephemeris/sky.ts";
import { formatPosition } from "../src/ephemeris/signs.ts";

const target: Target = {
  sun: { sign: 0, degree: 10, confidence: 1 }, // Aries
  moon: { sign: 5, degree: 15, confidence: 1 }, // Virgo
  ascendant: { sign: 8, degree: 3, confidence: 1 }, // Sagittarius
  mercury: { sign: 0, degree: 5, confidence: 0.8 },
  venus: { sign: 11, degree: 20, confidence: 0.6 },
  mars: { sign: 6, degree: 12, confidence: 0.9 }, // Libra
};

const t0 = Date.now();
const r = search(target);
const ms = Date.now() - t0;

console.log(`score ${r.score.toFixed(1)} / ${maxScore(target).toFixed(1)}  (${ms} ms)`);
console.log(`born ${r.date.toISOString()} UTC in ${r.city.name}`);
console.log(`Ascendant  ${formatPosition(r.chart.ascendant)}`);
for (const body of CHART_BODIES) {
  console.log(`${body.padEnd(10)} ${formatPosition(r.chart.positions[body])}`);
}
