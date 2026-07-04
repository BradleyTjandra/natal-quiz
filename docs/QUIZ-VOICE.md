# Question-bank authoring guide

Rules for writing and revising the quiz questions (`src/quiz/questions.ts`).
Derived from what makes good personality quizzes work (notably Cate Hall's
[Cringe Minefield quiz](https://www.catehall.com/cringe-minefield-quiz)) plus the
mechanical needs of our scoring pipeline. PRD owns the product framing; this doc
is just craft guidance for the questions themselves.

## Lessons borrowed from quizzes that work

- **Promise a result with bite, and deliver.** The Cringe Minefield quiz warns
  "if your result doesn't sting a little, something went wrong" — committing to
  truth over flattery is what makes people trust and share it. Our version of the
  stake: *the result is real.* The reveal should lean on the verifiable birth
  moment, not generic archetype praise.
- **A diagnosis, not a label.** The result must feel specific to the person —
  date, time, city, placements — not "you're a Ravenclaw."
- **Short and honest about it.** ~24 questions, a stated few minutes, no filler;
  every answer visibly matters (and mechanically, every answer does — each one
  moves a vector).
- **One consistent, candid, second-person voice.** Playful but concrete. The felt
  quality of a quiz is mostly voice consistency.

## Rules that keep our machinery honest

- **No socially-correct option.** If one option is the flattering one, everyone
  picks it and the score vectors turn to mush. Every option should be equally
  comfortable (or equally uncomfortable) to admit — the choice should reveal
  temperament, not aspiration. This matters mechanically: decisive answers →
  peaked vectors → high confidence → better charts.
- **Fully specify the scene.** "At a party" is unanswerable — whose party? Say
  "a close friend's birthday dinner, you know half the table." Ambiguous
  questions get random answers, which read as low confidence.
- **Options are concrete behaviours, not adjectives.** "You end up in one long
  conversation in the kitchen" beats "you're sociable."
- **One element (or modality) per option, cleanly.** Element questions get 4
  options (fire/earth/air/water), modality questions get 3
  (cardinal/fixed/mutable). Don't blur options across axis values.
- **Randomise option order in the UI** (M4) so the loadings' listing order can't
  bias picks.

## Loading conventions

- Primary load: `amount: 1`.
- Dual-load (an option that also says something about another placement, e.g.
  conflict style → mostly Mars, partly Sun): secondary `amount: 0.4`. Use on a
  few questions across the bank, per SPEC.
- Direct sign nudge (`sign:` in the load): for options whose flavour the axes
  can't express (Leo's need to be seen; Scorpio's outlasting). `amount: ≤0.5`,
  a handful across the whole bank — the element/modality structure must stay
  dominant or graded fallbacks stop working.
- Question order: Sun, Moon, Ascendant (12 questions), breather, then Mercury,
  Venus, Mars (12 questions) — per SPEC's mid-quiz breather placement.

## Per-placement domains (keep questions inside their planet's lane)

| Placement | Asks about |
|---|---|
| Sun | identity, vitality — what a day *for you* looks like, what energises |
| Moon | emotional needs, comfort, what home has to feel like |
| Ascendant | first impressions, the surface strangers meet |
| Mercury | thinking, talking, learning styles |
| Venus | attraction, affection, taste, what beauty is |
| Mars | anger, drive, pursuit, how you fight and chase |
