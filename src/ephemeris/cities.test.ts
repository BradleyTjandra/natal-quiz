import { describe, it, expect } from "vitest";
import { CITIES } from "./cities.ts";

describe("cities", () => {
  it("has coordinates in valid ranges", () => {
    for (const c of CITIES) {
      expect(c.latitude).toBeGreaterThanOrEqual(-90);
      expect(c.latitude).toBeLessThanOrEqual(90);
      expect(c.longitudeEast).toBeGreaterThan(-180);
      expect(c.longitudeEast).toBeLessThanOrEqual(180);
      expect(c.timezone).toMatch(/^[A-Za-z]+\/[A-Za-z_/]+$/);
    }
  });

  it("has unique names", () => {
    const names = CITIES.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("spans a wide range of longitudes — the degree-of-freedom the search relies on", () => {
    const lons = CITIES.map((c) => c.longitudeEast);
    // From the Pacific (~-158) to New Zealand (~+175): nearly the whole globe,
    // so some city is always near the longitude that puts a target ASC/Moon
    // degree within reach.
    expect(Math.max(...lons) - Math.min(...lons)).toBeGreaterThan(300);
    expect(CITIES.length).toBeGreaterThanOrEqual(20);
  });
});
