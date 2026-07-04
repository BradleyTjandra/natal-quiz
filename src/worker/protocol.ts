// The message contract between the main thread and the search worker. Kept in
// its own file so both sides import the same definition instead of one side
// importing the other's module.

import type { Answers } from "../quiz/score.ts";
import type { Candidate } from "../ephemeris/stage4.ts";

export interface SearchRequest {
  answers: Answers;
}

export type SearchResponse =
  | { ok: true; candidate: Candidate }
  | { ok: false; error: string };
