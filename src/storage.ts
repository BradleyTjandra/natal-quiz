// Persists quiz progress across a refresh or app-switch (trivial to trigger by
// accident on mobile). Two independent slots: in-progress answers (written by
// QuizFlow) and a finished result (written by App once the search completes).
// Key names are versioned so a future shape change ignores stale old saves
// instead of crashing on them.

import type { Answers } from "./quiz/score.ts";
import type { Candidate } from "./ephemeris/stage4.ts";

const PROGRESS_KEY = "natal-quiz:progress:v1";
const CANDIDATE_KEY = "natal-quiz:candidate:v1";

export interface QuizProgress {
  index: number;
  answers: Answers;
  pastBreather: boolean;
}

// localStorage can throw (private browsing, storage full) — a save failing
// should never break the quiz itself, just mean it won't survive a refresh.
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}
function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function loadProgress(): QuizProgress | null {
  const raw = safeGet(PROGRESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QuizProgress;
  } catch {
    return null; // stale/corrupt save from an older version — ignore it
  }
}

export function saveProgress(progress: QuizProgress): void {
  safeSet(PROGRESS_KEY, JSON.stringify(progress));
}

export function clearProgress(): void {
  safeRemove(PROGRESS_KEY);
}

// Candidate.date is a Date, which JSON.stringify silently turns into an ISO
// string — stored as-is, then converted back to a real Date on load.
export function saveCandidate(candidate: Candidate): void {
  safeSet(CANDIDATE_KEY, JSON.stringify(candidate));
}

export function loadCandidate(): Candidate | null {
  const raw = safeGet(CANDIDATE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Candidate & { date: string };
    return { ...parsed, date: new Date(parsed.date) };
  } catch {
    return null;
  }
}

export function clearCandidate(): void {
  safeRemove(CANDIDATE_KEY);
}

export function clearAll(): void {
  clearProgress();
  clearCandidate();
}
