// Reads the precomputed ingress tables (see scripts/generate-ingress.ts) and
// answers "which sign is this slow planet in?" by lookup instead of by an
// astronomy calculation — the whole reason Stage 0 exists. The tables cover
// Mars, Jupiter, and Saturn over the configured year range.

import raw from "./data/ingress.json" with { type: "json" };
import type { Ingress } from "./ingress.ts";
import { eclipticLongitude, type ChartBody } from "./sky.ts";
import { signIndexOf } from "./signs.ts";

type TableBody = "Mars" | "Jupiter" | "Saturn";

interface IngressData {
  startYear: number;
  endYear: number;
  tables: Record<TableBody, Ingress[]>; // each list sorted ascending by date
}

const data = raw as IngressData;

export const INGRESS_RANGE = {
  startYear: data.startYear,
  endYear: data.endYear,
};

// Index of the last ingress at or before `time`, or -1 if `time` predates them
// all. Binary search over the sorted ISO date strings (which sort lexically the
// same as chronologically).
function lastIngressBefore(list: Ingress[], time: number): number {
  let lo = 0;
  let hi = list.length - 1;
  let result = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (Date.parse(list[mid].date) <= time) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}

// The sign a slow planet occupies at a given instant.
export function signAt(body: TableBody, date: Date): number {
  const list = data.tables[body];
  const idx = lastIngressBefore(list, date.getTime());
  if (idx === -1) {
    // Before the first tabulated ingress: fall back to direct computation
    // (rare — only the first few weeks of the range).
    return signIndexOf(eclipticLongitude(body as ChartBody, date));
  }
  return list[idx].sign;
}

// The set of signs a slow planet passes through during [start, end].
export function signsInWindow(
  body: TableBody,
  start: Date,
  end: Date,
): Set<number> {
  const signs = new Set<number>([signAt(body, start)]);
  const list = data.tables[body];
  const startMs = start.getTime();
  const endMs = end.getTime();
  for (const ingress of list) {
    const t = Date.parse(ingress.date);
    if (t > startMs && t <= endMs) signs.add(ingress.sign);
    if (t > endMs) break;
  }
  return signs;
}
