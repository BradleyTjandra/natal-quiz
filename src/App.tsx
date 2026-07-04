import { useState } from "react";
import type { Answers } from "./quiz/score.ts";
import type { Candidate } from "./ephemeris/stage4.ts";
import { runSearch } from "./worker/searchClient.ts";
import QuizFlow from "./quiz/ui/QuizFlow.tsx";
import LoadingScreen from "./quiz/ui/LoadingScreen.tsx";
import ResultsScreen from "./results/ResultsScreen.tsx";

type Phase =
  | { step: "quiz" }
  | { step: "loading" }
  | { step: "results"; candidate: Candidate }
  | { step: "error"; message: string };

function App() {
  const [phase, setPhase] = useState<Phase>({ step: "quiz" });

  async function handleComplete(answers: Answers) {
    setPhase({ step: "loading" });
    try {
      const candidate = await runSearch(answers);
      setPhase({ step: "results", candidate });
    } catch (err) {
      setPhase({ step: "error", message: (err as Error).message });
    }
  }

  return (
    <main>
      {phase.step === "quiz" && <QuizFlow onComplete={handleComplete} />}
      {phase.step === "loading" && <LoadingScreen />}
      {phase.step === "results" && <ResultsScreen candidate={phase.candidate} />}
      {phase.step === "error" && (
        <p className="error-message">Something went wrong: {phase.message}</p>
      )}
    </main>
  );
}

export default App;
