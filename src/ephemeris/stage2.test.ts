import { describe, it, expect } from "vitest";
import { moonWindows } from "./stage2.ts";
import { sunWindow } from "./stage1.ts";
import { eclipticLongitude } from "./sky.ts";
import { signIndexOf } from "./signs.ts";

function moonSignAt(date: Date): number {
  return signIndexOf(eclipticLongitude("Moon", date));
}

describe("moonWindows", () => {
  // Use a real Sun window, and pick as the target the Moon sign at its midpoint
  // so we know at least one match exists.
  const sun = sunWindow(2000, 0); // Sun in Aries, spring 2000
  const mid = new Date((sun.start.getTime() + sun.end.getTime()) / 2);
  const moonSign = moonSignAt(mid);
  const windows = moonWindows(sun, moonSign);

  it("finds at least one interval and stays within the Sun window", () => {
    expect(windows.length).toBeGreaterThanOrEqual(1);
    for (const w of windows) {
      expect(w.start.getTime()).toBeGreaterThanOrEqual(sun.start.getTime());
      expect(w.end.getTime()).toBeLessThanOrEqual(sun.end.getTime());
      expect(w.end.getTime()).toBeGreaterThan(w.start.getTime());
    }
  });

  it("has the Moon in the target sign throughout each interval", () => {
    for (const w of windows) {
      // Sample a handful of interior instants.
      for (let f = 0.05; f < 1; f += 0.1) {
        const t = new Date(w.start.getTime() + f * (w.end.getTime() - w.start.getTime()));
        expect(moonSignAt(t)).toBe(moonSign);
      }
    }
  });

  it("bounds each interval by a real sign change (unless clipped to the window edge)", () => {
    for (const w of windows) {
      // Just outside the boundary the Moon should be in a different sign —
      // except where the interval is clipped to the Sun window itself.
      if (w.start.getTime() > sun.start.getTime() + 60000) {
        expect(moonSignAt(new Date(w.start.getTime() - 30 * 60000))).not.toBe(moonSign);
      }
      if (w.end.getTime() < sun.end.getTime() - 60000) {
        expect(moonSignAt(new Date(w.end.getTime() + 30 * 60000))).not.toBe(moonSign);
      }
    }
  });

  it("covers every instant in the window when the Moon is in the target sign", () => {
    // Independent brute-force scan: every 3h sample in the target sign must fall
    // inside one of the returned intervals.
    for (let t = sun.start.getTime(); t <= sun.end.getTime(); t += 3 * 3600 * 1000) {
      if (moonSignAt(new Date(t)) !== moonSign) continue;
      const covered = windows.some((w) => t >= w.start.getTime() && t <= w.end.getTime());
      expect(covered).toBe(true);
    }
  });
});
