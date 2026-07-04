// Layer 1 scoring engine (SPEC §"Layer 1: Quiz"). Turns quiz answers into the six
// per-planet 12-sign score vectors the solver consumes. The quiz never scores
// signs directly — each answer loads the two axes astrology is actually built on:
//   - element  (fire / earth / air / water) — the core temperament
//   - modality (cardinal / fixed / mutable)  — how that temperament acts
// Every sign is a unique element×modality pair, so summing an axis's loadings and
// projecting onto the signs yields a smooth preference over all 12 (a fiery,
// cardinal person peaks at Aries but leans toward the other fire and cardinal
// signs) — exactly the graded profile the search's soft scoring wants.
//
// The question *bank* (the actual worded questions and their loadings) is separate
// content, authored elsewhere; this module only defines the shape and the maths.

import type { ScoreVectors, QuizzedPlacement } from "../solver/solve.ts";

export type Element = "fire" | "earth" | "air" | "water";
export type Modality = "cardinal" | "fixed" | "mutable";

// Element and modality of each sign, index 0 = Aries … 11 = Pisces.
export const SIGN_ELEMENT: Element[] = [
  "fire", "earth", "air", "water", "fire", "earth",
  "air", "water", "fire", "earth", "air", "water",
];
export const SIGN_MODALITY: Modality[] = [
  "cardinal", "fixed", "mutable", "cardinal", "fixed", "mutable",
  "cardinal", "fixed", "mutable", "cardinal", "fixed", "mutable",
];

// One push from choosing an option: it moves `placement` toward an element
// and/or a modality by `amount`. Options can carry several loads, which is how a
// question dual-loads (e.g. a conflict-style answer loading mostly Mars, partly
// the Sun's element — SPEC). `sign` is the archetype escape hatch: a small nudge
// to one specific sign, for options whose flavour the two axes can't express
// (Leo's need to be *seen* isn't just fire+fixed). Use sparingly and small, so
// the axis structure — which is what makes similar signs score similarly, and
// therefore what makes fallbacks graceful — stays dominant.
export interface AxisLoad {
  placement: QuizzedPlacement;
  element?: Element;
  modality?: Modality;
  sign?: number; // 0..11, direct archetype nudge
  amount: number;
}

export interface Option {
  text: string;
  loads: AxisLoad[];
}

export interface Question {
  id: string;
  placement: QuizzedPlacement; // the planet this question is primarily about
  text: string;
  options: Option[];
}

// answers: question id → chosen option index.
export type Answers = Record<string, number>;

// How much element outweighs modality when projecting onto signs. Element is the
// stronger personality signal in astrology (and in our end-to-end validation,
// fallbacks kept element far more often than modality), so it's weighted higher.
// Tunable dial for how the quiz "feels".
export const ELEMENT_WEIGHT = 1.0;
export const MODALITY_WEIGHT = 0.6;

const PLACEMENTS: QuizzedPlacement[] = [
  "sun", "moon", "ascendant", "mercury", "venus", "mars",
];
const ELEMENTS: Element[] = ["fire", "earth", "air", "water"];
const MODALITIES: Modality[] = ["cardinal", "fixed", "mutable"];

function zeros<K extends string>(keys: K[]): Record<K, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
}

export function scoreQuiz(questions: Question[], answers: Answers): ScoreVectors {
  // Per-placement running totals: the two axes, plus direct sign nudges.
  const elem = {} as Record<QuizzedPlacement, Record<Element, number>>;
  const mod = {} as Record<QuizzedPlacement, Record<Modality, number>>;
  const direct = {} as Record<QuizzedPlacement, number[]>;
  for (const p of PLACEMENTS) {
    elem[p] = zeros(ELEMENTS);
    mod[p] = zeros(MODALITIES);
    direct[p] = new Array(12).fill(0);
  }

  for (const q of questions) {
    const choice = answers[q.id];
    if (choice == null) continue; // unanswered — contributes nothing
    for (const load of q.options[choice].loads) {
      if (load.element) elem[load.placement][load.element] += load.amount;
      if (load.modality) mod[load.placement][load.modality] += load.amount;
      if (load.sign != null) direct[load.placement][load.sign] += load.amount;
    }
  }

  // Project each placement's axis totals onto the 12 signs, then add nudges.
  const vectors = {} as ScoreVectors;
  for (const p of PLACEMENTS) {
    vectors[p] = Array.from(
      { length: 12 },
      (_, s) =>
        ELEMENT_WEIGHT * elem[p][SIGN_ELEMENT[s]] +
        MODALITY_WEIGHT * mod[p][SIGN_MODALITY[s]] +
        direct[p][s],
    );
  }
  return vectors;
}
