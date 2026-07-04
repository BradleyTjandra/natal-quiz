// Play the whole pipeline: answer the real question bank, get a real birth
// moment. Answers come from the command line as one letter per question in bank
// order (a/b/c/d = option 1..4), or "random". Prints each question with the
// chosen answer, then the chart the search lands on.
// Run: npm run try:quiz -- abcabca...   or   npm run try:quiz -- random

import { QUESTIONS } from "../src/quiz/questions.ts";
import { scoreQuiz, type Answers } from "../src/quiz/score.ts";
import { solve } from "../src/solver/solve.ts";
import { search } from "../src/ephemeris/search.ts";
import { CHART_BODIES } from "../src/ephemeris/sky.ts";
import { formatPosition, SIGNS } from "../src/ephemeris/signs.ts";

const arg = process.argv[2] ?? "random";
const answers: Answers = {};

for (let i = 0; i < QUESTIONS.length; i++) {
  const q = QUESTIONS[i];
  const n = q.options.length;
  const choice =
    arg === "random"
      ? Math.floor(Math.random() * n)
      : Math.min(n - 1, Math.max(0, (arg.toLowerCase().charCodeAt(i) || 97) - 97));
  answers[q.id] = choice;
  console.log(`${String(i + 1).padStart(2)}. [${q.placement}] ${q.text}`);
  console.log(`    → ${q.options[choice].text}\n`);
}

const target = solve(scoreQuiz(QUESTIONS, answers));
console.log("— target —");
for (const [k, t] of Object.entries(target)) {
  console.log(
    `${k.padEnd(10)} ${SIGNS[t.sign].padEnd(12)} conf ${t.confidence.toFixed(2)}  degree ${t.degree.toFixed(0)}°`,
  );
}

const t0 = Date.now();
const r = search(target, { acceptRatio: 0.99, maxYears: 40 });
console.log(`\n— your cosmic moment (${Date.now() - t0} ms) —`);
console.log(`born ${r.date.toISOString()} UTC in ${r.city.name}`);
console.log(`Ascendant  ${formatPosition(r.chart.ascendant)}`);
for (const body of CHART_BODIES) {
  console.log(`${body.padEnd(10)} ${formatPosition(r.chart.positions[body])}`);
}
