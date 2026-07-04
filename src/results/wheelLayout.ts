// Polar-coordinate geometry for the SVG chart wheel (ChartWheel.tsx). Kept
// separate from the SVG-drawing component so the angle math is a plain,
// testable function of longitudes -- the same split as houses.ts (logic) vs.
// HouseTable.tsx (presentation).
//
// Screen coordinates are y-down, so the ordinary x=cx+r*cos(theta),
// y=cy+r*sin(theta) parametrization sweeps *clockwise* as theta increases.
// Real chart wheels put the Ascendant at 9 o'clock and run houses
// counterclockwise (house 4/IC at 6 o'clock, house 7/DSC at 3, house 10/MC at
// 12), so theta must *decrease* as ecliptic longitude advances past the
// Ascendant -- verified against the four cardinal points before this was
// written: offset 0/90/180/270 must land at 9/6/3/12 o'clock respectively.
//
// Whole-sign houses (houses.ts) put house 1's cusp at 0 degrees of the
// Ascendant's *sign*, not the Ascendant's exact *degree* -- so the wheel is
// anchored to the sign start, and the 12 house-cusp angles are the same fixed
// constants on every chart; only which sign occupies which wedge changes.
// The Ascendant's exact degree gets its own separate marker inside house 1's
// wedge, since it's rarely sitting exactly on the cusp line.

import { normalizeDegrees, signIndexOf } from "../ephemeris/signs.ts";
import { houseSigns } from "../ephemeris/houses.ts";

const DEG = Math.PI / 180;

// The 12 house-cusp screen angles, house 1 first. Fixed regardless of chart --
// house 1 is always drawn at 9 o'clock (180 degrees), house 4 at 6 o'clock
// (90 degrees), and so on, 30 degrees apart.
export const HOUSE_CUSP_ANGLES: number[] = Array.from({ length: 12 }, (_, k) =>
  normalizeDegrees(180 - k * 30),
);

// Which sign occupies each of the 12 wedges (index 0 = house 1's wedge),
// reusing the same whole-sign logic the house table already uses.
export function wedgeSigns(ascendantLongitude: number): number[] {
  return houseSigns(signIndexOf(ascendantLongitude));
}

export interface Wedge {
  sign: number; // 0=Aries..11=Pisces
  thetaStart: number;
  thetaEnd: number;
}

// The 12 sign wedges around the ring, paired with their screen angles.
export function signWedges(ascendantLongitude: number): Wedge[] {
  return wedgeSigns(ascendantLongitude).map((sign, i) => ({
    sign,
    thetaStart: HOUSE_CUSP_ANGLES[i],
    thetaEnd: HOUSE_CUSP_ANGLES[i] - 30,
  }));
}

// Screen angle for a body at `longitude`, anchored to the start of the
// Ascendant's sign (see module comment for why that's the anchor, not the
// Ascendant's exact degree).
export function bodyAngle(longitude: number, ascendantLongitude: number): number {
  const ascSignStart = signIndexOf(ascendantLongitude) * 30;
  return normalizeDegrees(180 - normalizeDegrees(longitude - ascSignStart));
}

// The exact Ascendant point's own angle -- inside house 1's wedge, but not
// necessarily on its cusp line unless the Ascendant happens to sit at exactly
// 0 degrees of its sign.
export function ascendantMarkerAngle(ascendantLongitude: number): number {
  return bodyAngle(ascendantLongitude, ascendantLongitude);
}

export function pointOnWheel(
  theta: number,
  radius: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(theta * DEG),
    y: cy + radius * Math.sin(theta * DEG),
  };
}

// Smallest angle between two directions, 0..180.
function angularDistance(a: number, b: number): number {
  const d = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(d, 360 - d);
}

// How close two glyphs can sit before one gets bumped to a lane further out.
const MIN_GAP_DEG = 10;
// Mercury (+-1 sign of the Sun) and Venus (+-2 signs) mean the Sun/Mercury/
// Venus trio is structurally often clustered -- 5 lanes comfortably covers
// that realistic worst case. Beyond it we just reuse the outermost lane
// rather than growing the wheel unboundedly; true 6+-way clustering within
// MIN_GAP_DEG isn't expected given the astrological constraints.
const MAX_LANES = 5;

// Assigns each item a "lane" (0 = innermost) so items whose longitudes are
// within MIN_GAP_DEG of each other don't render on top of one another.
export function assignLanes<T extends { longitude: number }>(
  items: T[],
): (T & { lane: number })[] {
  const sorted = [...items].sort((a, b) => a.longitude - b.longitude);
  const laneLongitudes: number[][] = [];
  return sorted.map((item) => {
    let lane = 0;
    while (
      lane < MAX_LANES - 1 &&
      (laneLongitudes[lane] ?? []).some(
        (l) => angularDistance(l, item.longitude) < MIN_GAP_DEG,
      )
    ) {
      lane++;
    }
    (laneLongitudes[lane] ??= []).push(item.longitude);
    return { ...item, lane };
  });
}
