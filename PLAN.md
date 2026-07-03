# Natal Quiz — Progress

Source of truth for *what* and *how*: [docs/PRD.md](docs/PRD.md) (product) and
[docs/SPEC.md](docs/SPEC.md) (technical design, architecture, milestones M1–M5).
This file only tracks *status* — don't duplicate design detail here, update SPEC.md
instead if the design itself changes.

**Last updated:** 2026-07-03

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

Still to do for M1 (see SPEC.md "Layer 3" and milestone M1):

- Confirm the usable year range (how far back astronomy-engine stays accurate).
- Stage 0: ingress-table generator (Node script → static JSON) for Jupiter,
  Saturn, Mars sign-change dates.
- Stages 1–4: the hierarchical best-first search (years → days → planets →
  degrees/city/minute).
- Weighting hierarchy + the relaxation path (bend Mars, then Venus, then Mercury;
  never Sun/Moon/ASC).
- The M1 acceptance test: 500+ synthetic targets, assert the returned moment
  reproduces all five personal planets + ASC; log match rate and runtime.

## Next up

Continue M1: decide the year range, then build the ingress tables (Stage 0).
