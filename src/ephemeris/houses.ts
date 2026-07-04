// Whole-sign houses (PRD: "all 12 placements, whole sign system, derived from
// the Ascendant"). In this system a house is just a sign: house 1 is whatever
// sign the Ascendant falls in, and the other 11 houses follow in zodiac order
// from there — no separate house-cusp math needed.

// The house (1-12) that a body in `bodySign` occupies, given the Ascendant's
// sign `ascSign` (both 0=Aries..11=Pisces).
export function houseOf(bodySign: number, ascSign: number): number {
  return ((bodySign - ascSign + 12) % 12) + 1;
}

// Which sign occupies each house, given the Ascendant's sign. Index 0 = house
// 1 (the Ascendant's own sign), index 11 = house 12.
export function houseSigns(ascSign: number): number[] {
  return Array.from({ length: 12 }, (_, i) => (ascSign + i) % 12);
}
