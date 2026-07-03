# Natal Chart Personality Quiz — Product Requirements Doc

## One-liner

A personality quiz that tells you your *true* birth chart — complete with the exact date, time, and city you were "really" born — based on who you are, not when you arrived.

## The conceit

Standard astrology derives personality from birth data. This app inverts it: your personality determines your chart, and the chart you test as is your true chart, regardless of your actual birth certificate. The punchline is that the output is **real** — the date, time, and city we give you, entered into any astrology website, reproduces your chart exactly. You might discover you're a 1962 soul, or that you were truly born in Kyoto at 3:14 AM.

## Target experience

1. User takes a ~24-question personality quiz (a few minutes), with a breather at the midpoint.
2. A brief "consulting the heavens" moment while the app finds their cosmic moment.
3. Results reveal: their birth moment (date, time, city) and full natal chart.
4. Optionally, they verify it on a third-party astrology site and it checks out — this is the magic trick.

## What the output includes

- **Birth moment:** specific date, local time (oddly specific, e.g. 3:14 AM), and a real city.
- **Chart:** Sun, Moon, Ascendant, Mercury, Venus, Mars, Jupiter, Saturn, Uranus — signs and degrees.
- **Houses:** all 12 placements, whole sign system, derived from the Ascendant.
- Neptune and Pluto are excluded (generational, not personal).

## Product principles

- **Verifiability is the product.** The chart must correspond to a genuinely real sky. This is why the app searches real ephemeris data rather than fabricating placements.
- **The chart is simply theirs.** Never frame the result as a "best available match," never mention constraints, compromises, or that some chart was physically impossible. No match-quality reporting.
- **Astrological coherence.** Mercury falls within ±1 sign of the Sun and Venus within ±2 — hard rules, as in reality. Personality questions map to genuine astrological theory (elements and modalities).
- **Personality drives personal placements.** Sun, Moon, Ascendant, Mercury, Venus, Mars come from quiz answers. Jupiter, Saturn, Uranus — the social/generational layer — fall out of the birth date, becoming a "cosmic vintage" reveal rather than a chore.
- **Priority hierarchy when reality resists:** big three (Sun/Moon/ASC) are inviolable, personal planets nearly so, social planets are flavour.

## Scope

**In:** quiz, chart generation via real ephemeris search (roughly the last millennium of candidate moments), results screen, ~20–30 candidate cities worldwide.

**Out (for now):** aspects (degrees are captured to enable this later), Neptune/Pluto, saving/sharing results, user accounts, actual-birth-chart comparison mode.

## Success criteria

- **Big three always exact.** Sun, Moon, and Ascendant match the quiz outcome
  exactly, 100% of the time (guaranteed by how the search is built).
- **Personal planets fit or degrade gracefully.** Mercury, Venus, and Mars land on
  their ideal sign in the large majority of cases; and whenever an ideal sign is
  astronomically out of reach, the chart lands on an astrologically *similar* sign
  (same element or modality) rather than an arbitrary one. (Measured 2026-07-04 on
  realistic personas: ~71% land the ideal sign, and of the rest ~93% keep the same
  element or modality — see `scripts/pipeline-diag.ts`.)
  - *Revised from the original "≥99% of outcomes match all five personal planets
    exactly": a real sky can't always place every personal planet in its ideal
    sign at once, which is exactly why personal placements are soft. The graceful
    fallback is the honest, achievable form of this promise.*
- Search completes in under a second on a typical phone.
- A user entering the output into a mainstream astrology site sees the same chart.

## Companion doc

`SPEC.md` — technical design and implementation plan (architecture, search algorithm, milestones).
