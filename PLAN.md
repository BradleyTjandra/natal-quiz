# Natal Quiz — Progress

Source of truth for *what* and *how*: [docs/PRD.md](docs/PRD.md) (product) and
[docs/SPEC.md](docs/SPEC.md) (technical design, architecture, milestones M1–M5).
This file only tracks *status* — don't duplicate design detail here, update SPEC.md
instead if the design itself changes.

**Last updated:** 2026-07-04

## Status

| Milestone | What | Status |
|---|---|---|
| M0 | Project setup (this session) | ✅ Done |
| M1 | Ephemeris search module (`src/ephemeris/`) | 🟡 In progress |
| M2 | Solver (`src/solver/`) | ⬜ Not started |
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

Still to do for M1 (see SPEC.md "Layer 3" and milestone M1):

- Spot-check displayed-degree accuracy at old dates before widening the year range.
- Stages 2–4: Moon-match days in the Sun window → score Mercury/Venus/Mars
  (nothing discarded) → degrees/city/minute for ASC + Moon degree fit.
- The branch-and-bound loop: walk `rankYears` best-first, keep the best real
  candidate, stop once it beats every remaining year's bound. Optimization:
  `rankYears` currently does 2 Sun-position searches/year (~0.6 s for all 500);
  the Sun window barely moves year to year, so compute it once and reuse.
- The M1 acceptance test: 500+ synthetic targets; assert Sun/Moon/ASC always
  exact; log personal-planet match rate (high when quiz confidence is high) and
  runtime; verify branch-and-bound optimality against exhaustive search on a
  small range.

## Next up

Continue M1: Stages 2–4 (day/degree evaluation) and the branch-and-bound loop
that ties Stage 1's ranking into a full search returning a real birth moment.
