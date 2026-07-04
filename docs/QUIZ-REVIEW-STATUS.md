# Quiz question-bank review — resume here

Handoff for continuing the M3b question-wording review in a fresh session. The
scoring engine, solver, and search are all done and tested; **this file is only
about the wording of `src/quiz/questions.ts`.** When the review is finished and
the changes are applied, delete this file.

How to work this (decided with Brad): iterate wording as **plain text in chat**,
not per-edit in code. The `loads` (element/modality/sign) are the scoring
contract and rarely change; only prose changes. Apply locked wording to
`src/quiz/questions.ts` in **batches**, then run `npx vitest run quiz`. Try a run
end-to-end with `npm run try:quiz -- random` (or a letter-per-question string).

## The four rules (agreed — fold into docs/QUIZ-VOICE.md when applying)

1. **The answer depends only on you** — never on other people, the specific
   situation, or luck. (A "party" answer depends on the party; a "how do you
   explain it" answer depends on the listener. Reframe so only *your* disposition
   varies.)
2. **No past-outcome questions.** What actually happened is contaminated by
   circumstance. Ask about standing tendencies, not personal history.
3. **Every option is real and equally ownable.** No caricature, no dull filler
   nobody would pick, no option that's obviously the common/flattering one. If one
   option is clearly likeliest, the question measures base rates, not temperament.
4. **One clean axis per option.** Don't smuggle in extra criteria (e.g. "guests
   remark") or let an option bleed into another placement's meaning.

Meta: concrete is still good — but the scenario is a *fixed backdrop*; the only
thing allowed to vary is the taker's own disposition.

## Already applied to code (round 1 — accepted)

`moon-home` (earth option reworded), `moon-low-mood` (replaced `moon-weather`),
`asc-dinner` (reworded), `asc-five-minutes` (replaced `asc-guess`). Note
`sun-hobby` was a round-1 replacement but got re-flagged — see pending below.

## PENDING — redrafts proposed, awaiting Brad's yes/edit (NOT yet in code)

Element opts = (F/E/A/W), modality opts = (C/Fx/M). Only changed questions shown;
everything not listed here stays as currently written in `questions.ts`.

**SUN** — replace `sun-hobby` with:
- `sun-engine` (modality) — "Forget any specific goal — which part of the process
  actually lights you up?"
  - (C) The launch — the blank page, the first move, nothing into something.
  - (Fx) The build — going deep, getting good, the long haul to mastery.
  - (M) The variety — several things at once, switching lanes, never the same way twice.
- OPEN QUESTION: `sun-project` also leans on a team — keep or swap?

**ASCENDANT** — replace both modality questions:
- `asc-newcomer` (modality) — "You walk into a room where you know nobody and
  nothing's required of you. What does your body just do?"
  - (C) Heads in — you make the first move and break your own ice.
  - (Fx) Finds an anchor — a spot, a wall, a drink — and lets people come to you.
  - (M) Blends — reads the temperature and matches it before committing.
- `asc-pace` (modality) — "The tempo a stranger picks up from you in the first minute:"
  - (C) Forward-leaning, like you're about to do something.
  - (Fx) Grounded — steady, unhurried, hard to rattle.
  - (M) Quicksilver — a little different with everyone.

**MERCURY** — replace both element questions:
- `mercury-receive` (element) — "Someone has to explain something complicated that
  you actually need to get. How do you want it delivered?"
  - (F) Point first — the big picture and the why; details once I care.
  - (E) Step by step, in order, a concrete example at each stage.
  - (A) The principle or the analogy — once it clicks I've got the rest.
  - (W) As a story — who, what was at stake — and I'll absorb it.
- `mercury-stuck` (element) — "You're trying to learn something and it won't go in.
  Your most likely failure mode:"
  - (F) You skip the boring foundation, jump ahead, hit a wall you built yourself.
  - (E) You won't move on till it's perfect, so you barely move at all.
  - (A) You get it beautifully in theory and never actually do it.
  - (W) You can't get it from a page — you need someone to show you, and no one's around.

**VENUS** — two option swaps + one rebalance:
- `venus-fall` — replace the (E) option only: "Capability — the unshowy way they
  handled things and people. Competence is the hottest thing you know."
- `venus-gift` — replace the (A) option only: "Something for your head — the book
  that'll change how you think, or tickets to the thing you'll argue about for weeks."
- `venus-taste` (modality) — rebalance so none is the obvious pick:
  - (C) Early — into it before it's cool, out before it peaks; a bit of a snob about it.
  - (Fx) Fixed — you found your look a decade ago and have no interest in changing it.
  - (M) Restless — you churn phases fast enough that half your wardrobe embarrasses you.

## Still to do after the pending batch lands

- **Full sweep of the not-yet-reviewed questions against the four rules** (only the
  flagged ones have been checked): Sun `sun-free-day`/`sun-compliment`/`sun-project`;
  all four Moon; Mercury `mercury-meeting`/`mercury-notes`; Venus `venus-affection`;
  **all four Mars** (not yet examined at all).
- Fold the four rules into `docs/QUIZ-VOICE.md`.
- Then **M4 — UI** (quiz flow + breather, Web Worker search, results screen).

## Keep in mind

- Preserve each question's axis: element questions need 4 options
  (fire/earth/air/water), modality questions 3 (cardinal/fixed/mutable). The bank
  test enforces that every placement still covers all 4 elements + 3 modalities.
- Sign nudges (`sign:` in a load) stay small (≤0.5) and rare — the element/modality
  structure must dominate or the graceful sign-fallback stops working.
