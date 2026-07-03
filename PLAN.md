# Natal Quiz — Progress

Source of truth for *what* and *how*: [docs/PRD.md](docs/PRD.md) (product) and
[docs/SPEC.md](docs/SPEC.md) (technical design, architecture, milestones M1–M5).
This file only tracks *status* — don't duplicate design detail here, update SPEC.md
instead if the design itself changes.

**Last updated:** 2026-07-04 · **Tests:** 65 passing (`npm test`)

## Status

| Milestone | What | Status |
|---|---|---|
| M0 | Project setup (this session) | ✅ Done |
| M1 | Ephemeris search module (`src/ephemeris/`) | ✅ Done |
| M2 | Solver (`src/solver/`) | ✅ Done |
| M3 | Quiz content & scoring (`src/quiz/`) | ⬜ Not started |
| M4 | UI (quiz flow, results screen) | ⬜ Not started |
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
- Each placement's **confidence** and **target degree** come from one
  scale-invariant `decisiveness` (0..1) of the chosen sign: landslide → high
  confidence + solidly placed (~7°); coin-flip or constraint-forced → low
  confidence + cuspy (~27°). The two mapping constants in `placementFrom` are the
  main dials for how decisive/flexible the whole quiz feels — tune once M3 exists.
- Tested (`solve.test.ts`): independent winners, landslide/coin-flip mapping,
  Mercury/Venus pulled off their raw winners by the constraint, a marginal-Sun
  flip, and a solve→search integration proving the Target is realisable.

## Next up

**M3 — Quiz content & scoring** (`src/quiz/`): the ~24-question bank as data
(text, options, per-option element/modality loadings, planet assignment) and the
scoring engine that maps answers → the six score vectors `solve()` consumes.
Then M4 (UI + Web Worker search). The `decisiveness` mapping constants in the
solver should be revisited once real quizzes produce real vector shapes.
