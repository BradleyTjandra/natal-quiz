import { describe, it, expect } from "vitest";
import { QUESTIONS, BREATHER_AFTER } from "./questions.ts";
import {
  scoreQuiz,
  SIGN_ELEMENT,
  SIGN_MODALITY,
  type Element,
  type Modality,
  type Answers,
} from "./score.ts";
import { solve, type QuizzedPlacement } from "../solver/solve.ts";

const PLACEMENTS: QuizzedPlacement[] = [
  "sun", "moon", "ascendant", "mercury", "venus", "mars",
];

describe("bank structure", () => {
  it("has 24 questions: 4 per placement, big three before the breather", () => {
    expect(QUESTIONS).toHaveLength(24);
    for (const p of PLACEMENTS) {
      expect(QUESTIONS.filter((q) => q.placement === p)).toHaveLength(4);
    }
    const big3 = new Set(["sun", "moon", "ascendant"]);
    QUESTIONS.forEach((q, i) => {
      expect(big3.has(q.placement)).toBe(i < BREATHER_AFTER);
    });
  });

  it("has unique ids and valid loads", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of QUESTIONS) {
      for (const o of q.options) {
        expect(o.loads.length).toBeGreaterThan(0);
        for (const l of o.loads) {
          expect(l.element || l.modality || l.sign != null).toBeTruthy();
          expect(l.amount).toBeGreaterThan(0);
          if (l.sign != null) {
            expect(l.sign).toBeGreaterThanOrEqual(0);
            expect(l.sign).toBeLessThan(12);
            expect(l.amount).toBeLessThanOrEqual(0.5); // nudges stay small
          }
        }
      }
    }
  });

  it("gives every placement questions on both axes, covering all values", () => {
    for (const p of PLACEMENTS) {
      const elements = new Set<Element>();
      const modalities = new Set<Modality>();
      for (const q of QUESTIONS) {
        for (const o of q.options) {
          for (const l of o.loads) {
            if (l.placement !== p) continue;
            if (l.element) elements.add(l.element);
            if (l.modality) modalities.add(l.modality);
          }
        }
      }
      // Every element and modality must be reachable, or some signs can't win.
      expect(elements.size).toBe(4);
      expect(modalities.size).toBe(3);
    }
  });
});

// Answer every question by picking, for that question's own placement, the
// option loading the wanted element (4-option questions) or modality (3-option).
function answersFor(element: Element, modality: Modality): Answers {
  const answers: Answers = {};
  for (const q of QUESTIONS) {
    const want = (idx: number) =>
      q.options[idx].loads.some(
        (l) =>
          l.placement === q.placement &&
          (l.element === element || l.modality === modality),
      );
    for (let i = 0; i < q.options.length; i++) {
      if (want(i)) {
        answers[q.id] = i;
        break;
      }
    }
    expect(answers[q.id]).toBeDefined(); // every question must offer the value
  }
  return answers;
}

describe("extreme answer patterns land on the expected sign (SPEC M3 test)", () => {
  // All 12 element x modality combos — each must drive every placement's peak to
  // the one sign with that pair.
  const ELEMENTS: Element[] = ["fire", "earth", "air", "water"];
  const MODALITIES: Modality[] = ["cardinal", "fixed", "mutable"];

  for (const element of ELEMENTS) {
    for (const modality of MODALITIES) {
      const expected = SIGN_ELEMENT.findIndex(
        (e, s) => e === element && SIGN_MODALITY[s] === modality,
      );
      it(`${element} + ${modality} → sign ${expected}`, () => {
        const vectors = scoreQuiz(QUESTIONS, answersFor(element, modality));
        for (const p of PLACEMENTS) {
          const v = vectors[p];
          expect(v.indexOf(Math.max(...v))).toBe(expected);
        }
      });
    }
  }
});

describe("bank → solve end-to-end", () => {
  it("a consistent persona yields a confident, constraint-respecting Target", () => {
    const target = solve(scoreQuiz(QUESTIONS, answersFor("water", "fixed")));
    expect(target.sun!.sign).toBe(7); // Scorpio: water + fixed
    expect(target.sun!.confidence).toBeGreaterThan(0.5);
    // Mercury/Venus stayed within reach of the Sun.
    const dist = (a: number, b: number) => Math.min((((a - b) % 12) + 12) % 12, (((b - a) % 12) + 12) % 12);
    expect(dist(target.mercury!.sign, 7)).toBeLessThanOrEqual(1);
    expect(dist(target.venus!.sign, 7)).toBeLessThanOrEqual(2);
  });
});
