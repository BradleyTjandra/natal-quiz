// Randomises option display order in the UI (docs/QUIZ-VOICE.md: loadings are
// always listed in a fixed element/modality order in questions.ts, so the raw
// order can't be shown or it'd bias picks toward whichever option comes first).
// The order must stay put while a question is on screen, though, so this is a
// deterministic shuffle keyed by the question id rather than real randomness —
// same seed always gives the same order, no state or timing to get wrong.

// A short, stable string hash (not cryptographic — just needs to scatter
// well). The accumulation loop alone isn't enough: since option indices are
// small consecutive digits appended at the end of the seed string, the last
// step is h*31 + digit, which is *linear* in the digit — every question would
// hash its 4 options to 4 consecutive numbers and "shuffle" back into their
// original order. The finisher below (a standard integer-hash avalanche step)
// scrambles that linearity away.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return h ^ (h >>> 16);
}

// Indices 0..count-1, reordered by a hash of `${seed}-${index}`.
export function shuffledIndices(seed: string, count: number): number[] {
  return Array.from({ length: count }, (_, i) => i).sort(
    (a, b) => hash(`${seed}-${a}`) - hash(`${seed}-${b}`),
  );
}
