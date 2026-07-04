import { describe, it, expect } from "vitest";
import {
  HOUSE_CUSP_ANGLES,
  wedgeSigns,
  signWedges,
  bodyAngle,
  ascendantMarkerAngle,
  assignLanes,
} from "./wheelLayout.ts";

describe("HOUSE_CUSP_ANGLES", () => {
  it("places house 1 at 9 o'clock and steps 30 degrees clockwise-decreasing", () => {
    expect(HOUSE_CUSP_ANGLES).toEqual([
      180, 150, 120, 90, 60, 30, 0, 330, 300, 270, 240, 210,
    ]);
  });
});

describe("bodyAngle", () => {
  it("lands the four cardinal offsets at the four clock points (Aries rising)", () => {
    // Ascendant at 0 degrees (Aries 0) so offset == longitude directly.
    expect(bodyAngle(0, 0)).toBeCloseTo(180); // ASC itself -> 9 o'clock
    expect(bodyAngle(90, 0)).toBeCloseTo(90); // house 4 / IC -> 6 o'clock
    expect(bodyAngle(180, 0)).toBeCloseTo(0); // house 7 / DSC -> 3 o'clock
    expect(bodyAngle(270, 0)).toBeCloseTo(270); // house 10 / MC -> 12 o'clock
  });

  it("is anchored to the Ascendant's sign start, not its exact degree", () => {
    // Ascendant at Taurus 12 (=42 degrees): a body at exactly 30 (Taurus 0,
    // the sign start) should sit at house 1's cusp, 180 degrees.
    expect(bodyAngle(30, 42)).toBeCloseTo(180);
  });
});

describe("ascendantMarkerAngle", () => {
  it("sits exactly on the house 1 cusp when the Ascendant is at 0 of its sign", () => {
    expect(ascendantMarkerAngle(30)).toBeCloseTo(180); // Taurus 0
  });

  it("sits inside house 1's wedge, offset from the cusp by its degreeInSign", () => {
    // Taurus 12 -> 12 degrees into the sign -> 12 degrees clockwise of the cusp.
    expect(ascendantMarkerAngle(42)).toBeCloseTo(168);
  });
});

describe("wedgeSigns / signWedges", () => {
  it("puts the Ascendant's own sign in house 1's wedge, then steps forward", () => {
    const signs = wedgeSigns(42); // Taurus (1) rising
    expect(signs).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0]);
  });

  it("pairs each sign with the matching fixed angle band", () => {
    const wedges = signWedges(42);
    expect(wedges[0]).toEqual({ sign: 1, thetaStart: 180, thetaEnd: 150 });
    expect(wedges[2]).toEqual({ sign: 3, thetaStart: 120, thetaEnd: 90 });
  });

  it("places a body's angle inside its own sign's wedge band", () => {
    const ascLon = 42; // Taurus rising
    const cancerBody = 100; // Cancer 10
    const theta = bodyAngle(cancerBody, ascLon);
    const cancerWedge = signWedges(ascLon).find((w) => w.sign === 3)!;
    expect(theta).toBeLessThanOrEqual(cancerWedge.thetaStart);
    expect(theta).toBeGreaterThanOrEqual(cancerWedge.thetaEnd);
  });
});

describe("assignLanes", () => {
  it("keeps well-spread bodies all on the innermost lane", () => {
    const items = [{ longitude: 10 }, { longitude: 100 }, { longitude: 200 }];
    const laned = assignLanes(items);
    expect(laned.every((i) => i.lane === 0)).toBe(true);
  });

  it("bumps clustered bodies (the Sun/Mercury/Venus case) to different lanes", () => {
    // Within a few degrees of each other, as Mercury/Venus often are of the Sun.
    const items = [
      { body: "Sun", longitude: 100 },
      { body: "Mercury", longitude: 104 },
      { body: "Venus", longitude: 96 },
    ];
    const laned = assignLanes(items);
    const lanes = new Set(laned.map((i) => i.lane));
    expect(lanes.size).toBe(3); // none share a lane
  });
});
