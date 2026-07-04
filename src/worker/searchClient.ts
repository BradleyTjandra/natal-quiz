// Main-thread side of the search worker: hides the postMessage plumbing
// behind a plain Promise-returning function.

import type { Answers } from "../quiz/score.ts";
import type { Candidate } from "../ephemeris/stage4.ts";
import type { SearchRequest, SearchResponse } from "./protocol.ts";

export function runSearch(answers: Answers): Promise<Candidate> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./searchWorker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (e: MessageEvent<SearchResponse>) => {
      worker.terminate();
      if (e.data.ok) resolve(e.data.candidate);
      else reject(new Error(e.data.error));
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message));
    };
    const request: SearchRequest = { answers };
    worker.postMessage(request);
  });
}
