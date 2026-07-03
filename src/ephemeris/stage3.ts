// Stage 3 of the search: a cheap sign-match score for the planets that aren't
// guaranteed by construction — Mercury, Venus, Mars (personal) and, from M5,
// Jupiter/Saturn (social). It exists to rank candidate days/windows before the
// expensive Stage 4 degree tuning, *without discarding* any of them (SPEC: "no
// day is discarded for a mismatch").
//
// The personal planets crawl only ~1-2° over a 2-3 day Moon window, so their
// sign is effectively fixed across it; evaluating once near the window midpoint
// is enough. Jupiter/Saturn come from the precomputed ingress tables (signAt),
// no ephemeris call. Degrees are deliberately ignored here — that is Stage 4's
// job; this is only the sign-match component of the final objective.

import { eclipticLongitude, type ChartBody } from "./sky.ts";
import { signIndexOf } from "./signs.ts";
import { signAt } from "./ingressTables.ts";
import { SIGN_WEIGHT, type Target } from "./scoring.ts";

// The bodies Stage 3 scores, paired with their tier weight and how their sign is
// obtained (live ephemeris for the fast personal planets, table lookup for the
// slow social ones).
const PERSONAL: ChartBody[] = ["Mercury", "Venus", "Mars"];
const SOCIAL = ["Jupiter", "Saturn"] as const;

function keyOf(body: string): keyof Target {
  return body.toLowerCase() as keyof Target;
}

// The sign-match score of Mercury/Venus/Mars (+ social planets when targeted) at
// a representative instant. Matches the personal/social portion of scoreChart's
// sign term, so it can never over-credit relative to the authoritative score.
export function personalSignScore(target: Target, instant: Date): number {
  let total = 0;

  for (const body of PERSONAL) {
    const t = target[keyOf(body)];
    if (!t) continue;
    if (signIndexOf(eclipticLongitude(body, instant)) === t.sign) {
      total += SIGN_WEIGHT.personal * t.confidence;
    }
  }

  for (const body of SOCIAL) {
    const t = target[keyOf(body)];
    if (!t) continue;
    if (signAt(body, instant) === t.sign) {
      total += SIGN_WEIGHT.social * t.confidence;
    }
  }

  return total;
}
