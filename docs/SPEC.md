# Natal Chart Personality Quiz — Technical Spec & Implementation Plan

## Concept

A React web app personality quiz that outputs a **real natal chart** — including a specific birth date, time, and city — derived from personality responses rather than actual birth data. The conceit: the chart you test as is your true chart. The output must be verifiable: entering the generated date/time/city into any standard astrology calculator must reproduce the chart.

## Architecture Overview

Three layers, in data-flow order:

1. **Quiz layer** — ~24 questions scoring the personal placements (Sun, Moon, Ascendant, Mercury, Venus, Mars) on element/modality axes, projected into per-planet 12-sign score vectors.
2. **Target resolution (solver)** — converts score vectors into a target chart: one sign per planet, subject to hard astrological constraints, plus a confidence weight and target degree per planet derived from score margins.
3. **Ephemeris search** — finds a real historical moment (date, UTC time, city) whose actual sky best matches the target. The final chart is read off this moment, guaranteeing internal consistency. Jupiter, Saturn, Uranus are read from the winning date (not quizzed).

## Layer 1: Quiz

- 6 quizzed placements: Sun, Moon, ASC, Mercury, Venus, Mars — 4 questions each (~24 total).
- Questions score on **element** (fire/earth/air/water) and **modality** (cardinal/fixed/mutable) axes where natural; element score + modality score project into a 12-sign vector per planet.
- Some questions may dual-load (e.g. conflict style loads mostly Mars, partly Sun element).
- Mid-quiz breather after Sun/Moon/ASC questions.
- Jupiter/Saturn: 2 light questions each (optional milestone, see M5) used only as low-weight tie-breakers between candidate years.

## Layer 2: Target Resolution

- Solve for the sign assignment maximising total score subject to **hard constraints**:
  - Mercury within ±1 sign of Sun
  - Venus within ±2 signs of Sun
- Joint space is tiny (12 Sun × 3 Mercury × 5 Venus; other planets independent) — brute force.
- For each planet, derive from the score margin (winner vs runner-up):
  - **Confidence weight** — landslide = non-negotiable in search; coin-flip = flexible.
  - **Target degree** — map normalised margin to 0–29° (landslide → ~5–10° solidly placed; narrow → ~25–29° cuspy).

## Layer 3: Ephemeris Search

**Library:** `astronomy-engine` (pure JS, client-side). Year range: as wide as the library's accuracy supports, ideally back to ~1000 AD; minimum 1600–present. Verify accuracy limits in M1 before fixing the range.

**Reference frame:** all computation in UTC internally; convert to local civil time only for display. Curated list of ~20–30 well-known cities spanning all longitudes with unambiguous timezone histories (e.g. Auckland, Tokyo, Kolkata, Moscow, Cairo, London, Rio de Janeiro, Mexico City, Honolulu). Longitude choice gives ~±6° of control over Moon degree; that is its purpose.

**Weighting hierarchy (governs both matching and degree scoring):**
1. Big three (Sun, Moon, ASC) — exact by construction, never bend.
2. Personal (Mercury, Venus, Mars) — must match exactly; only bend (Mars first) if no match exists in the entire year range.
3. Social (Jupiter, Saturn) — tie-breakers only, never veto.

**Search algorithm (hierarchical filtering, best-first):**

1. **Stage 0 (precompute, user-independent):** ingress tables (sign-change dates) for Jupiter, Saturn, and Mars across the full year range. Ship as static JSON, a few KB. Turns Stage 1 into lookups and lets whole years be skipped when Mars can't match.
2. **Stage 1 (years):** rank years by Jupiter/Saturn fit via ingress tables. Skip years where Mars is never in the target sign during the Sun window (Mars ingress table). Walk years best-first.
3. **Stage 2 (days):** Sun sign fixes a ~30-day window. Sample Moon every 12h across the window (cannot skip a sign at ~13°/day), bisect boundaries → ~2–3 Moon-match days.
4. **Stage 3 (planets):** check Mars first (most selective), then Mercury, Venus at noon on each candidate day; refine near cusps only. Keep days matching all five personal planets.
5. **Stage 4 (degrees/city/minute):** for surviving days, compute per-city the UTC window when the target ASC sign is rising (analytic via sidereal time — no scanning). Choose the minute placing ASC degree, then Moon degree, closest to targets. Score degree-fit weighted by the hierarchy above. Random selection among near-ties.
6. **Exit:** stop at the first perfect-signs match with degree score above a good-enough threshold; otherwise continue and keep the best. If no five-planet match exists anywhere, relax Mars, then Venus, then Mercury — never Sun/Moon/ASC.

Expected cost: ~3–5k ephemeris evaluations typical (10–100 ms); worst case ~30–50k (sub-second). Run in a Web Worker with a "consulting the heavens" loading state.

## Output

- Birth moment: date, local time (e.g. 3:14 AM), city.
- Full chart: Sun through Uranus signs and degrees (Neptune/Pluto excluded), ASC, all 12 houses (whole sign system from ASC).
- Present the chart as simply *theirs* — no match-quality report, no mention of constraints or compromises.

## Milestones (build in this order)

### M1 — Ephemeris search module (riskiest first)
Pure TypeScript module, no UI. Ingress table generator (Node script producing static JSON), Stages 1–4, weighting, relaxation path. Verify `astronomy-engine` accuracy range and fix the year range.
**Test:** generate 500+ synthetic targets (random valid sign combos respecting Mercury/Venus constraints, random degrees/weights); assert the returned moment reproduces all five personal planet signs and the ASC; log match rate and runtime distribution. This test validates the entire conceit.

### M2 — Solver
Score vectors → constrained sign assignment + weights + target degrees.
**Test:** hand-built score vectors with known correct outputs, including cases where constraints force Mercury/Venus away from their raw winners and where a marginal Sun should flip to improve the joint fit.

### M3 — Quiz content & scoring
Question bank as data (JSON): text, options, per-option axis loadings, planet assignment. Scoring engine mapping answers → score vectors.
**Test:** answer patterns designed to produce each element/modality extreme land in the expected signs.

### M4 — UI
React app: quiz flow with mid-point breather, Web Worker search with loading state, results screen (chart wheel or placement list, birth moment reveal, house placements). Verification hint: "check it yourself on any astrology site."

### M5 (optional) — Jupiter/Saturn questions
Add 4 questions; feed results into Stage 1 year ranking as low-weight preferences.

## Key Decisions Log (do not re-litigate without discussion)

- Hard constraints, not soft — a real date/time requires a physically real chart.
- Real-ephemeris search over fabricated charts — verifiability is the product.
- Jupiter/Saturn/Uranus derived from the date, not quizzed (M5 may add light Jupiter/Saturn quizzing as tie-breakers only).
- Weighting: big three > personal > social.
- Multiple cities as a longitude degree-of-freedom; UTC internally.
- No "best pick" / match-quality framing in the results.

## Conventions

- Python-style code examples in docs; the app itself is TypeScript/React.
- Sparse comments (~1 per 5–10 lines).
- Two-space indents.
