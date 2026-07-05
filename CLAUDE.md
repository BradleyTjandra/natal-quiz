# Working with Brad on this project

## Who you're working with

Brad is new to software development and to working with an AI coding assistant
("vibecoding"). He is not new to precise thinking — the PRD and SPEC docs he wrote
for this project are unusually clear and specific — but he doesn't yet have the
vocabulary or mental models of professional software development. Treat him as
smart and capable, just not yet fluent in this particular domain.

## How to communicate

- **Explain the why, not just the what.** Before or while making a change, briefly
  say why this approach and not another. "I put `astronomy-engine` in
  `dependencies` not `devDependencies` because the browser needs it at runtime,
  not just during building" teaches something. "Installing astronomy-engine" does not.
- **Define jargon on first use, briefly, inline.** Don't assume he knows what a
  "build step," "dependency," "commit," or "subpath" means. A short parenthetical
  is enough — don't turn every message into a lecture.
- **Prefer small, explainable increments over large unexplained diffs.** Especially
  for the algorithmic parts (ephemeris search, solver), build and explain in
  stages he can follow, rather than dropping a finished module.
- **Check in before big decisions**, especially ones the docs don't already settle:
  new architecture, new dependencies, changes to scope. If SPEC.md already answers
  the question, just follow it and say so — don't re-ask settled things (see its
  "Key Decisions Log").
- Keep responses concise. Educational doesn't mean long — a well-chosen sentence
  teaches more than a paragraph he'll skim.

## Project conventions (from docs/SPEC.md — don't relitigate without discussion)

- App itself: TypeScript + React (Vite). Code *examples inside docs* are
  Python-style pseudocode — that's a docs-writing convention, not a hint to use
  Python anywhere in the app.
- Sparse comments: roughly one comment per 5–10 lines, and only where the *why*
  isn't obvious from the code itself.
- Two-space indents.
- Hard astrological constraints (Mercury/Venus near Sun), real-ephemeris search
  (not fabricated charts), weighting hierarchy (big three > personal > social) —
  these are settled design decisions in SPEC.md's Key Decisions Log. If a change
  would touch one of these, flag it explicitly rather than quietly working around it.

## Process

- `docs/PRD.md` and `docs/SPEC.md` are the source of truth for *what* we're
  building and *how*. `PLAN.md` tracks *status* only — update it as milestones
  progress, don't let it go stale.
- Build in the milestone order SPEC.md lays out (M1 ephemeris search first — it's
  the riskiest part and validates the whole concept, before investing in quiz
  content or UI around it).
- Each milestone in SPEC.md has its own test plan — write and run those tests as
  part of finishing the milestone, not as an afterthought.
- Deployment is GitHub Pages, project repo `natal-quiz`, serving at
  `bradleytjandra.com/natal-quiz` (inherits the custom domain from Brad's user-page repo
  automatically — confirmed via GitHub's docs). `vite.config.ts`'s `base` setting
  depends on this; don't change one without the other.

## Lessons learned (working notes — update as we go)

Practical things that have bitten us or worked well. Read before touching the
ephemeris code or adding tooling.

- **Three toolchains, one codebase — they resolve imports differently.** The same
  code runs in the browser (Vite), tests (Vitest), and Node scripts (the ingress
  generator). "Passes the tests" does NOT mean "runs everywhere." Always actually
  run new code in the toolchain it will run in. Concretely:
  - Import `astronomy-engine` with **named imports** (`import { GeoVector } from
    …`), not `import * as Astronomy` — the namespace form came through empty under
    Node/tsx.
  - Import JSON with the attribute: `import x from "./f.json" with { type:
    "json" }`. Works in all three; plain Node errors without it.
  - Run TS scripts with `node --experimental-strip-types
    --disable-warning=ExperimentalWarning script.ts` (see `npm run gen:ingress`).
    No extra dependency needed.
- **Verify against independent sources, never hand-copied or remembered numbers.**
  What's worked: cross-check our output against the library's *own* separate
  calculations (equinox/solstice instants, horizon math) and against a published
  ephemeris. This is also the product's core promise, so the tests double as proof
  the conceit holds. Don't assert against a number you typed from memory.
- **Tests catch wrong *assumptions*, not just wrong code.** A failing test has
  twice been the test's expectation being wrong (e.g. a retrograde sign-ingress
  lands at the *top* of a sign, not the bottom), while the code was right. When a
  test fails, check which side is actually wrong before "fixing" the code.
- **Run `tsc` AND the tests.** Vitest strips types without checking them, so it
  silently passes type errors (missing imports, bad types). `npx tsc --noEmit`
  catches those. The `build` script runs both; do the same when iterating.
- **Prefer a valid-but-loose bound/estimate first, tighten later.** The Stage 1
  upper bound assumes best-case for everything except Mars — correct and simple
  now, with the tightening (Sun-window reuse) logged in PLAN.md rather than done
  prematurely. Corollary bite: a *loose* branch-and-bound bound is still correct
  but *slow* — every Mars-reachable year shares the same `maxScore` ceiling, so
  B&B can't rank among them and scans many. Loose-first is right; just know the
  cost shows up as runtime, not wrong answers.
- **The Ascendant is monotonic in time and analytically invertible — don't scan
  for it.** It advances one direction through all 360° per sidereal day, so any
  target ASC longitude is hit exactly once per sidereal day, and you can solve the
  ascendant formula backwards for the required sidereal time, then convert that to
  UTC linearly (sidereal time is ~linear in UT). `stage4.ts` does this; a
  bisection scan was ~10× slower for no accuracy gain. SPEC already called for
  "analytic via sidereal time — no scanning."
- **The Moon's longitude is geocentric here — city-independent.** The city tunes
  the Moon degree *only* indirectly: each city needs a different UTC instant to
  bring the same Ascendant onto its horizon, and that time shift moves the Moon.
  Don't look for a per-city Moon term; there isn't one.
- **Vitest hides `console.log` under the default reporter.** In `vitest run` a
  test's `console.log` (e.g. the acceptance summary) doesn't print until you pass
  `--reporter=verbose`. Don't assume the log didn't fire — check with verbose.
