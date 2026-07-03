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
1. Big three (Sun, Moon, ASC) — exact by construction (Sun defines the date window, only Moon-match days are considered, ASC comes from free choice of time). Hard.
2. Personal (Mercury, Venus, Mars) — **medium soft weight**: scored, not filtered. Mismatch penalty per planet = medium tier weight × that planet's quiz confidence weight, so a landslide result is expensive to bend while a coin-flip result bends cheaply.
3. Social (Jupiter, Saturn) — low soft weight.

Exchange-rate intent: a high-confidence personal planet match should outweigh both social planets combined; a low-confidence one may lose to them or to substantially better degree fit. Total objective = sign-match score + degree-fit score, both weighted by the hierarchy.

**Search algorithm (hierarchical filtering, best-first):**

1. **Stage 0 (precompute, user-independent):** ingress tables (sign-change dates) for Jupiter, Saturn, and Mars across the full year range. Ship as static JSON, a few KB. These give each year's Jupiter/Saturn/Mars contribution (or its maximum) cheaply without ephemeris calls.
2. **Stage 1 (years, branch-and-bound):** from the ingress tables compute each year's **upper bound** — Jupiter/Saturn actual score plus Mars's best-case score plus maximum possible Mercury/Venus/degree score. Walk years in descending upper-bound order.
3. **Stage 2 (days):** Sun sign fixes a ~30-day window. Sample Moon every 12h across the window (cannot skip a sign at ~13°/day), bisect boundaries → ~2–3 Moon-match days.
4. **Stage 3 (planets, scored not filtered):** evaluate Mercury, Venus, Mars at noon on each candidate day (refine near cusps only) and compute the weighted sign-match score. No day is discarded for a mismatch.
5. **Stage 4 (degrees/city/minute):** for the best-scoring days, compute per-city the UTC window when the target ASC sign is rising (analytic via sidereal time — no scanning). Choose the minute placing ASC degree, then Moon degree, closest to targets. Add degree-fit score weighted by the hierarchy. Random selection among near-ties.
6. **Exit:** maintain the best candidate found; stop when its total score ≥ the upper bound of the next year in the queue (guaranteed optimal), or immediately if a candidate achieves the maximum possible score. In practice this terminates after a few dozen years.

Expected cost: ~3–5k ephemeris evaluations typical (10–100 ms); worst case ~30–50k (sub-second). Run in a Web Worker with a "consulting the heavens" loading state.

## Output

- Birth moment: date, local time (e.g. 3:14 AM), city.
- Full chart: Sun through Uranus signs and degrees (Neptune/Pluto excluded), ASC, all 12 houses (whole sign system from ASC).
- Present the chart as simply *theirs* — no match-quality report, no mention of constraints or compromises.

## Milestones (build in this order)

### M1 — Ephemeris search module (riskiest first)
Pure TypeScript module, no UI. Ingress table generator (Node script producing static JSON), Stages 1–4, confidence-weighted scoring, branch-and-bound termination. Verify `astronomy-engine` accuracy range and fix the year range.
**Test:** generate 500+ synthetic targets (random valid sign combos respecting Mercury/Venus constraints, random degrees/weights); assert the returned moment always reproduces Sun, Moon, and ASC exactly; log the personal-planet match rate (expect high when confidence weights are high), the score distribution, and runtime. Separately verify branch-and-bound optimality on a small year range by comparing against exhaustive search. This test validates the entire conceit.

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
- Weighting: big three hard (by construction) > personal medium (soft, confidence-scaled — a mismatch is permitted, priced by quiz margin) > social low (soft).
- Multiple cities as a longitude degree-of-freedom; UTC internally.
- No "best pick" / match-quality framing in the results.

## Conventions

- Python-style code examples in docs; the app itself is TypeScript/React.
- Sparse comments (~1 per 5–10 lines).
- Two-space indents.
