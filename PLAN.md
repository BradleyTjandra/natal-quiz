# Natal Quiz — Progress

Source of truth for *what* and *how*: [docs/PRD.md](docs/PRD.md) (product) and
[docs/SPEC.md](docs/SPEC.md) (technical design, architecture, milestones M1–M5).
This file only tracks *status* — don't duplicate design detail here, update SPEC.md
instead if the design itself changes.

**Last updated:** 2026-07-04 · **Tests:** 103 passing (`npm test`)

## Status

| Milestone | What | Status |
|---|---|---|
| M0 | Project setup (this session) | ✅ Done |
| M1 | Ephemeris search module (`src/ephemeris/`) | ✅ Done |
| M2 | Solver (`src/solver/`) | ✅ Done |
| M3 | Quiz content & scoring (`src/quiz/`) | ✅ Done — wording review complete |
| M4 | UI (quiz flow, results screen) | ✅ Done |
| M5 | Jupiter/Saturn quiz questions (optional) | ⬜ Not started |

## M0 — Setup (done 2026-07-03)

- Vite + React + TypeScript app scaffolded by hand (`package.json`, `tsconfig.json`,
  `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`).
- `astronomy-engine` installed (runtime dependency, will be used starting M1).
- `vite.config.ts` sets `base: "/natal-quiz/"` so the built app resolves correctly
  when served from `brad.tj/natal-quiz` rather than domain root.
- `.github/workflows/deploy.yml` added: builds and deploys to GitHub Pages on push
  to `main`. **Inert for now** — it only runs once this repo exists on GitHub with
  Pages enabled. Confirmed via GitHub's docs that a project-site repo automatically
  inherits the `brad.tj` custom domain as a subpath (no extra DNS/CNAME work needed
  in this repo).
- Local git repo initialized. No GitHub remote yet — deliberately deferred until
  the user is ready to push.
  - **Before the first push:** the local branch is `master` but `deploy.yml`
    triggers on `main`. Reconcile them (rename the branch with `git branch -m
    master main`, or change the workflow's trigger) or the deploy won't fire.
- No linter or test framework yet. SPEC.md's M1 test plan ("generate 500+ synthetic
  targets...") needs a test runner — plan is to add Vitest when M1 starts, not before.

## M1 — Ephemeris search (in progress)

Building per SPEC.md's own ordering ("riskiest first"). Done so far:

- **The "read the real sky" foundation** (`src/ephemeris/`) — the layer the whole
  search sits on top of, verified before building anything else on it:
  - `signs.ts` — ecliptic-longitude → zodiac sign + degree arithmetic.
  - `sky.ts` — geocentric ecliptic longitude "of date" for Sun, Moon, and
    Mercury–Uranus, plus an analytic Ascendant (from sidereal time + obliquity,
    no scanning, as SPEC.md specifies). `computeChart()` reads a full chart off a
    real moment + place.
  - `sky.test.ts` — proves correctness against astronomy-engine's *own*
    independent calculations rather than hand-copied numbers: Sun anchors exactly
    to the library's equinox/solstice instants; the planet route is validated by
    running the Sun through it and matching `SunPosition`; the Ascendant is
    confirmed to land on the eastern horizon (altitude ≈ 0, rising) across four
    cities in both hemispheres.
- Test runner: Vitest (`npm test`).
- **Ephemeris engine decision:** staying with `astronomy-engine` (pure-JS,
  browser-friendly, MIT-licensed, matches mainstream sites to ~0.01°). Swiss
  Ephemeris would only win for exact-degree precision centuries in the past, at
  the cost of AGPL licensing + multi-MB data files — not worth it here, and the
  choice is contained to `src/ephemeris/` if it ever changes.
- **Stage 0 — ingress tables done:** `ingress.ts` finds every sign change for a
  body over a date range (walk + bisection to the hour); verified against the
  library's equinox/solstice instants and for internal consistency, including
  retrograde crossings. `scripts/generate-ingress.ts` (run via `npm run
  gen:ingress`) emits `src/ephemeris/data/ingress.json` — Mars/Jupiter/Saturn
  sign changes, ~208 KB. Reuses the same verified sky code, so it can't drift.
- **Year range:** provisionally **1600–2100** (`config.ts`), where degrees still
  match Swiss-Ephemeris sites well. Widening toward ~1000 AD is a one-line change
  + regenerate, pending the accuracy spot-check below.
- **Scoring objective done:** `scoring.ts` — the single number the search
  maximizes. Big three guaranteed by construction (contribute degree fit only);
  personal planets soft, reward scaled by quiz confidence (decisive answers
  expensive to miss); social low weight. `scoreChart`, `maxScore`, `fullReward`.
  Tested for confidence scaling, the tier exchange rate, and degree tapering.
- **Stage 1 done:** `stage1.ts` + `ingressTables.ts` — per-year upper bound
  (Mars reachability in the Sun window from the ingress tables; everything else
  best-case) and best-bound-first `rankYears`. Bound proven a valid upper bound
  and cross-checked against the real sky (a year scores max iff Mars truly
  reaches its target sign during the Sun window). Ingress JSON imported with a
  `with { type: "json" }` attribute so it loads under Vite, Vitest, and Node.

- **Stages 2–4 + orchestrator done.** The search now returns a real birth
  moment (date, UTC time, city) whose sky best matches a target:
  - `cities.ts` — 24 curated cities spanning all longitudes (the Moon-degree
    degree-of-freedom); lat/lon used by the search, IANA tz stored for M4 display.
  - `stage2.ts` — `moonWindows`: narrows the Sun window to the ~2-3 day
    Moon-match interval(s), clipped to the Sun window so Sun sign stays exact.
  - `stage3.ts` — `personalSignScore`: cheap personal/social sign score, used to
    order intervals (never to discard).
  - `stage4.ts` — lands the Ascendant on its target *analytically* (closed-form
    inverse of the ascendant formula → required sidereal time → UTC; no scanning),
    then reads the real chart per city and keeps the best. This is where the ASC
    sign+degree are hit exactly and the Moon degree is tuned by city choice.
  - `search.ts` — walks `rankYears` best-bound-first, keeps the global best real
    moment, stops on the branch-and-bound condition (best ≥ next year's bound) or
    early via `acceptRatio` / `maxYears` (the product fast path).
- **M1 acceptance test passes** (`search.test.ts`): 500+ synthetic targets, Sun/
  Moon/ASC exact on every one; branch-and-bound proven equal to exhaustive search
  on a small range. `npm test` runs a 150-target sample; `ACCEPT_N=500` runs the
  full quota. `npm run try:search` prints one chart to eyeball on an astrology site.
- **Sun-window reuse optimization done** (differently than first planned): instead
  of the approximate "reuse across years" trick, `sunWindow` is now memoized by
  (year, sign) — exact, and it collapses the acceptance test's ~250k Sun searches
  to a few thousand.

### Deferred (M1 works without these; revisit for the phone-speed target in M4)

- **Displayed-degree accuracy spot-check at old dates** before widening the year
  range past 1600 toward ~1000 AD (`config.ts` one-liner + regenerate ingress).
- **Speed** — search is ~0.3–0.6 s/target in Node (SPEC wants ~10–100 ms typical;
  the app runs in a Web Worker, different profile). Two known wins, both left out
  now for clarity/correctness:
  - *Moon-first inner loop:* Stage 4 recomputes Mercury/Venus/Mars at all 24
    cities though they barely move across a 2-3 day interval. When their signs are
    constant over the interval, pick the city by Moon degree first and full-score
    only the winner. Keeps big-three exact; B&B stays valid (bound still ≥ any
    real chart).
  - *Degree-aware tighter Stage-1 bound:* the bound assumes perfect degrees, so
    every Mars-reachable year shares the `maxScore` ceiling and B&B can't prune
    among them (why the tail scans many years). A bound that accounts for the
    unavoidable Sun/degree deficit would prune far more.

## M2 — Solver (done 2026-07-04)

`src/solver/solve.ts` turns the quiz's six per-planet 12-sign score vectors into
a `Target` for M1's search:

- Sun/Mercury/Venus solved jointly (brute force over 12 Suns; Mercury/Venus take
  their best sign within ±1/±2 of each candidate Sun) so a marginal Sun flips
  when it unlocks a stronger Mercury/Venus. Moon/ASC/Mars picked independently.
- Big three: single sign + a `decisiveness`-derived confidence (scales degree
  reward) + target degree (landslide ~7°, coin-flip ~27°).
- **Soft planets (Mercury/Venus/Mars) carry a full 12-sign reward profile**
  (revised 2026-07-04, at Brad's suggestion): the search rewards them by the
  quiz's fit for the sign they *land on*, so an unreachable ideal sign degrades to
  the most astrologically-similar reachable one (Gemini→Sagittarius, not→Taurus)
  rather than an arbitrary miss. The profile shape subsumes the old confidence
  scalar. Mercury/Venus reward is zeroed outside their ±1/±2 reach of the Sun.
- This changed the scoring objective: `scoring.ts` (`reward?` field, graded
  `scoreChart`, `reachableReward` for a valid Mars bound), `stage1.ts` (Mars
  bound), `stage3.ts`. All backward-compatible — one-hot targets (no `reward`)
  keep the old all-or-nothing behaviour, so the M1 tests are untouched. SPEC's
  Layer 2/3 and Key Decisions Log updated to match.
- Tested (`solve.test.ts` + `scoring.test.ts`): independent winners, landslide/
  coin-flip mapping, Mercury/Venus pulled within the constraint, a marginal-Sun
  flip, the Gemini→Sagittarius-over-Taurus fallback, and a solve→search
  integration proving the Target is realisable.
- The two degree-mapping constants in `degreeFrom` remain the main dials for how
  the quiz "feels"; tune once M3 produces real vector shapes.

## M3a — Quiz scoring engine (done 2026-07-04)

`src/quiz/score.ts`: the question data model (`Question`/`Option`/`AxisLoad`, with
options able to dual-load several placements) and `scoreQuiz(questions, answers)`,
which accumulates element/modality loadings per placement and projects them onto
the 12 signs → the `ScoreVectors` the solver consumes. Element outweighs modality
(`ELEMENT_WEIGHT`/`MODALITY_WEIGHT`, tunable). Tested: element/modality extremes
land on the expected signs, dual-loading, unanswered → flat, and a
scoreQuiz→solve integration.

## M3b — Question bank (done 2026-07-04)

`src/quiz/questions.ts`: all 24 questions drafted (4 per placement, big three
before the breather at `BREATHER_AFTER`), per the authoring rules in
`docs/QUIZ-VOICE.md` (specific scenes, concrete-behaviour options, no
socially-correct answer — rules distilled partly from Cate Hall's Cringe
Minefield quiz). One Mars question dual-loads the Sun; four small archetype
nudges (Leo ×2, Cancer, Taurus, Scorpio) via the new optional `sign` field in
`AxisLoad`. **The wording is a draft for Brad to edit** — `loads` are the
scoring contract, text is free to change.

Also fixed via the bank's end-to-end test: the solver's `decisiveness` was
structurally capped at ~1/3 (the element/modality runner-up always shares the
winner's stronger axis), so even perfectly consistent answers read as
wishy-washy. Now calibrated (`CONSISTENT_MARGIN`) so full consistency → full
confidence; tune alongside the quiz's axis weights if those change.

`npm run try:quiz -- random|aaab...` plays the whole pipeline: answers → target
→ real birth moment. A random persona correctly reads as all coin-flips; an
all-fire persona gets six Aries placements at confidence ~1.

Question wording was then reviewed with Brad question-by-question against four
agreed rules (answer depends only on you; no past-outcome questions; every
option equally ownable; one clean axis per option) — final wording and rules
are in `docs/QUIZ-VOICE.md`; the review's own handoff doc was deleted once done.

## M4 — UI (done 2026-07-04)

React app wiring the whole pipeline together, per SPEC.md's "quiz flow with
mid-point breather, Web Worker search with loading state, results screen."
Placement-list results format chosen over a chart wheel (Brad's call — SPEC
left this open) to ship the working flow first; a wheel is a possible later
visual upgrade.

- **`src/ephemeris/houses.ts`** (new): whole-sign houses — nothing existed for
  this before M4. `houseOf(bodySign, ascSign)` and `houseSigns(ascSign)`, both
  pure functions, tested against hand-computed cases including the
  Pisces/Aries wraparound.
- **`src/quiz/shuffle.ts`** (new): deterministic option-order shuffling per
  `docs/QUIZ-VOICE.md`'s "randomise option order" rule — a stable hash of
  `questionId-optionIndex`, not real randomness, so order is stable per
  question but not biased by the source listing order. **Caught by its own
  test:** the first hash implementation was linear in the trailing digit, so
  every question's 4-5 options hashed to consecutive numbers and sorted right
  back into original order — a shuffle that never shuffled. Fixed with a
  standard integer-hash avalanche finisher; a regression test now checks
  real question IDs actually reorder, not just a hand-picked sample.
- **`src/worker/`** (new): `protocol.ts` (shared request/response types),
  `searchWorker.ts` (runs `scoreQuiz → solve → search` off the main thread —
  SPEC requires this since search is the one slow step), `searchClient.ts`
  (Promise-wrapped `runSearch`, one worker per search, terminates after).
  Worker file types `self` via one narrow cast rather than adding a second
  tsconfig — this repo's `lib` is `DOM`, and `DOM`+`WebWorker` together
  conflict on shared globals; a two-tsconfig project-reference setup would
  work but is more moving parts than one file needs.
- **`src/quiz/ui/`** (new): `QuestionCard`, `ProgressBar`, `Breather`,
  `LoadingScreen`, `QuizFlow` (owns the question pointer + answers map, shows
  the breather right after `BREATHER_AFTER`, forward-only — no back button
  this pass).
- **`src/results/`** (new): `BirthMoment` (local time via
  `Intl.DateTimeFormat` + `timeZone`, no library needed), `PlacementList`,
  `HouseTable`, `ResultsScreen`. None of these read `candidate.score` —
  enforces PRD's "never frame as a best match" structurally.
- **`src/App.tsx`**: phase state machine (`quiz` → `loading` → `results` |
  `error`).
- **`src/index.css`** (new): one plain stylesheet, mobile-first, no styling
  library added.
- Verified in the browser via the Preview tool: clicked through all 24
  questions (confirmed shuffled order differs from source order), breather
  appears exactly at question 12, loading state shows then resolves, results
  screen shows a plausible birth moment + all 8 bodies + Ascendant + 12
  houses, houses table correctly starts at the Ascendant's own sign; also
  checked at mobile viewport width. One spot-checked result: Ascendant Taurus,
  Sun Sagittarius, Mercury Scorpio (1 sign away, satisfies the ±1 constraint),
  Venus Scorpio (within ±2) — astrologically consistent.

## Next up

- **M5 (optional)** — Jupiter/Saturn quiz questions as low-weight year
  tie-breakers.
- Chart-wheel results view (deferred from M4).
- Deployment: reconcile the `master`/`main` branch mismatch with
  `deploy.yml`'s trigger, then push to GitHub Pages when Brad's ready.
- Revisit the solver's degree-mapping dials once real people take the quiz.
