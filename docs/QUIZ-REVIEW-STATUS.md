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

## Already applied to code

Round 1 (accepted): `moon-home` (earth option reworded), `moon-low-mood`
(replaced `moon-weather`), `asc-dinner` (reworded), `asc-five-minutes` (replaced
`asc-guess`).

Round 2 (accepted 2026-07-04, in code, tests pass): `sun-engine` (replaced
`sun-hobby`), `asc-newcomer` + `asc-pace` (replaced `asc-first-day` +
`asc-waiting-room`; asc-pace stem is "the tempo you *think* a stranger picks
up"), `mercury-receive` (game-teaching framing; water = coached-round option) +
`mercury-stuck` (replaced `mercury-explain` + `mercury-learn`), `venus-fall`
earth option ("Competence is hot"), `venus-gift` air option, `venus-taste`
rebalanced (hunt / settled / absorbent, domain-neutral stem). Brad's note:
"we can always revise later."

## Full sweep done (2026-07-04) — findings awaiting Brad

Swept every remaining question against the four rules. Clean, keep as-is:
`sun-free-day`, all four Moon, `mercury-meeting`, `venus-affection`,
`mars-conflict`, `mars-pursuit`, `mars-deadline`. Recommended keep with
rationale: `sun-project` (team is a fixed backdrop; only your appetite varies).

Minor flags proposed in chat, awaiting yes/edit:
- `sun-compliment` — stem leans on what others happen to say (rules 1+2);
  proposed hypothetical stem, options unchanged.
- `mercury-notes` — mutable option is comedic caricature (rule 3); optional soften.
- `mars-anger` — earth option's "the eruption gets remembered" invokes others'
  reactions (rule 4); proposed self-observed rewording.

## Still to do

- Resolve the three minor flags above with Brad; apply; `npx vitest run quiz`.
- Four rules folded into `docs/QUIZ-VOICE.md` — DONE (2026-07-04).
- When review wraps: delete this file, then **M4 — UI** (quiz flow + breather,
  Web Worker search, results screen).

## Keep in mind

- Preserve each question's axis: element questions need 4 options
  (fire/earth/air/water), modality questions 3 (cardinal/fixed/mutable). The bank
  test enforces that every placement still covers all 4 elements + 3 modalities.
- Sign nudges (`sign:` in a load) stay small (≤0.5) and rare — the element/modality
  structure must dominate or the graceful sign-fallback stops working.
