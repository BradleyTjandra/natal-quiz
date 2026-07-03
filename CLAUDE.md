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
  `brad.tj/natal-quiz` (inherits the custom domain from Brad's user-page repo
  automatically — confirmed via GitHub's docs). `vite.config.ts`'s `base` setting
  depends on this; don't change one without the other.
