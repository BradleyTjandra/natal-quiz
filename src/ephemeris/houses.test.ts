import { describe, it, expect } from "vitest";
import { houseOf, houseSigns } from "./houses.ts";

describe("houseOf", () => {
  it("puts the Ascendant's own sign in house 1", () => {
    expect(houseOf(0, 0)).toBe(1); // Aries rising, Aries body
    expect(houseOf(7, 7)).toBe(1); // Scorpio rising, Scorpio body
  });

  it("counts forward through the zodiac for later houses", () => {
    expect(houseOf(1, 0)).toBe(2); // Aries rising, Taurus body
    expect(houseOf(6, 0)).toBe(7); // Aries rising, Libra body
  });

  it("wraps around the Pisces/Aries seam", () => {
    // Cancer (3) rising: Capricorn (9) is opposite, i.e. house 7.
    expect(houseOf(9, 3)).toBe(7);
    // Pisces (11) rising: Aries (0) body wraps to house 2.
    expect(houseOf(0, 11)).toBe(2);
  });
});

describe("houseSigns", () => {
  it("starts at the Ascendant's sign and lists all 12 in order", () => {
    expect(houseSigns(4)).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3]);
  });

  it("is a permutation of all 12 signs for any Ascendant", () => {
    for (let asc = 0; asc < 12; asc++) {
      const signs = houseSigns(asc);
      expect(new Set(signs).size).toBe(12);
    }
  });

  it("agrees with houseOf for every sign", () => {
    const asc = 5;
    const signs = houseSigns(asc);
    for (let s = 0; s < 12; s++) {
      expect(signs[houseOf(s, asc) - 1]).toBe(s);
    }
  });
});
