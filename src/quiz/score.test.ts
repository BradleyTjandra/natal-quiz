import { describe, it, expect } from "vitest";
import { scoreQuiz, type Question, type Element, type Modality } from "./score.ts";
import { solve } from "../solver/solve.ts";

// Two fixture questions for the Sun: one loads an element, one a modality. This
// is enough to drive the Sun vector to any sign; real questions live in the bank.
function sunQuestions(): Question[] {
  const elems: Element[] = ["fire", "earth", "air", "water"];
  const mods: Modality[] = ["cardinal", "fixed", "mutable"];
  return [
    {
      id: "sun-element",
      placement: "sun",
      text: "element?",
      options: elems.map((element) => ({
        text: element,
        loads: [{ placement: "sun" as const, element, amount: 1 }],
      })),
    },
    {
      id: "sun-modality",
      placement: "sun",
      text: "modality?",
      options: mods.map((modality) => ({
        text: modality,
        loads: [{ placement: "sun" as const, modality, amount: 1 }],
      })),
    },
  ];
}

describe("scoreQuiz projection", () => {
  const qs = sunQuestions();
  // element option indices: fire 0, earth 1, air 2, water 3
  // modality option indices: cardinal 0, fixed 1, mutable 2
  const cases: [string, number, number, number][] = [
    ["fire + cardinal → Aries", 0, 0, 0],
    ["earth + fixed → Taurus", 1, 1, 1],
    ["air + mutable → Gemini", 2, 2, 2],
    ["water + cardinal → Cancer", 3, 0, 3],
    ["fire + mutable → Sagittarius", 0, 2, 8],
  ];

  for (const [name, elemChoice, modChoice, expectedSign] of cases) {
    it(name, () => {
      const v = scoreQuiz(qs, { "sun-element": elemChoice, "sun-modality": modChoice });
      const peak = v.sun.indexOf(Math.max(...v.sun));
      expect(peak).toBe(expectedSign);
    });
  }

  it("leaves unanswered placements flat (no signal)", () => {
    const v = scoreQuiz(qs, { "sun-element": 0, "sun-modality": 0 });
    expect(Math.max(...v.moon) - Math.min(...v.moon)).toBe(0);
    expect(Math.max(...v.mars)).toBe(0);
  });
});

describe("dual-loading", () => {
  it("lets one option feed two placements", () => {
    // A conflict-style answer: mostly Mars (fire), partly the Sun's element.
    const q: Question[] = [
      {
        id: "conflict",
        placement: "mars",
        text: "how do you fight?",
        options: [
          {
            text: "head-on",
            loads: [
              { placement: "mars", element: "fire", amount: 1 },
              { placement: "sun", element: "fire", amount: 0.4 },
            ],
          },
        ],
      },
    ];
    const v = scoreQuiz(q, { conflict: 0 });
    expect(Math.max(...v.mars)).toBeGreaterThan(0); // Mars got the main push
    expect(Math.max(...v.sun)).toBeGreaterThan(0); // Sun got a share
    expect(Math.max(...v.mars)).toBeGreaterThan(Math.max(...v.sun));
  });
});

describe("scoreQuiz → solve integration", () => {
  it("produces vectors the solver turns into a coherent Target", () => {
    const qs = sunQuestions();
    // Fiery, cardinal Sun → expect the solved Sun in Aries.
    const target = solve(scoreQuiz(qs, { "sun-element": 0, "sun-modality": 0 }));
    expect(target.sun!.sign).toBe(0);
    // Moon had no questions answered → flat vector → argmax falls to sign 0, but
    // it should carry no confidence (nothing decided it).
    expect(target.moon!.confidence).toBe(0);
  });
});
