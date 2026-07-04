// Runs off the main thread (SPEC.md: "Run in a Web Worker with a 'consulting
// the heavens' loading state") since the search is the one slow step in the
// pipeline. Everything here is the already-tested M1-M3 pipeline; this file
// just wires it to worker messages.

import { QUESTIONS } from "../quiz/questions.ts";
import { scoreQuiz } from "../quiz/score.ts";
import { solve } from "../solver/solve.ts";
import { search } from "../ephemeris/search.ts";
import type { SearchRequest, SearchResponse } from "./protocol.ts";

// This file runs in a worker, but the project's tsconfig uses the DOM lib
// (needed by the rest of the app), which doesn't type worker globals. One
// narrow cast here is simpler than a second tsconfig just for this file.
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<SearchRequest>) => void) | null;
  postMessage: (r: SearchResponse) => void;
};

ctx.onmessage = (e) => {
  try {
    const vectors = scoreQuiz(QUESTIONS, e.data.answers);
    const target = solve(vectors);
    const candidate = search(target);
    ctx.postMessage({ ok: true, candidate });
  } catch (err) {
    ctx.postMessage({ ok: false, error: (err as Error).message });
  }
};
