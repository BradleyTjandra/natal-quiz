// Precomputes the sign-change (ingress) tables for the slow planets and writes
// them as static JSON the app ships with. Run via `npm run gen:ingress`.
// Reusing computeIngresses (the same code the tests verify) means this generated
// data can't drift away from the app's own astronomy.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { computeIngresses, INGRESS_STEP_DAYS } from "../src/ephemeris/ingress.ts";
import { SEARCH_START_YEAR, SEARCH_END_YEAR } from "../src/ephemeris/config.ts";

const start = new Date(Date.UTC(SEARCH_START_YEAR, 0, 1));
const end = new Date(Date.UTC(SEARCH_END_YEAR, 0, 1));

const bodies = ["Mars", "Jupiter", "Saturn"] as const;
const tables: Record<string, unknown> = {};

for (const body of bodies) {
  const t0 = Date.now();
  const ingresses = computeIngresses(body, start, end, INGRESS_STEP_DAYS[body]);
  tables[body] = ingresses;
  console.log(
    `${body}: ${ingresses.length} ingresses in ${Date.now() - t0}ms`,
  );
}

const outPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "ephemeris",
  "data",
  "ingress.json",
);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  JSON.stringify(
    { startYear: SEARCH_START_YEAR, endYear: SEARCH_END_YEAR, tables },
    null,
    0,
  ) + "\n",
);
console.log(`Wrote ${outPath}`);
