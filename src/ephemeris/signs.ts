// The zodiac is the 360° ecliptic circle divided into 12 equal 30° signs,
// starting from 0° = the vernal equinox point (0° Aries). Every position in a
// chart is ultimately just an ecliptic longitude; a "sign + degree" is only a
// human-friendly way of reading that one number.

export const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

export type Sign = (typeof SIGNS)[number];

// Wrap any angle into the [0, 360) range so arithmetic near the 360/0 seam
// (e.g. 359° + 5°) behaves.
export function normalizeDegrees(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

export function signOf(longitude: number): Sign {
  const index = Math.floor(normalizeDegrees(longitude) / 30);
  return SIGNS[index];
}

// Degrees elapsed within the current sign, 0–30.
export function degreeInSign(longitude: number): number {
  return normalizeDegrees(longitude) % 30;
}

// e.g. 34.5° -> "Taurus 4.5°"
export function formatPosition(longitude: number): string {
  return `${signOf(longitude)} ${degreeInSign(longitude).toFixed(1)}°`;
}
