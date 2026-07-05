import { useState } from "react";
import type { Answers } from "./quiz/score.ts";
import type { Candidate } from "./ephemeris/stage4.ts";
import { runSearch } from "./worker/searchClient.ts";
import { useTheme } from "./useTheme.ts";
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
  // Bumped on restart so QuizFlow remounts fresh rather than carrying over
  // its old index/answers state.
  const [quizKey, setQuizKey] = useState(0);
  const [theme, toggleTheme] = useTheme();

  async function handleComplete(answers: Answers) {
    setPhase({ step: "loading" });
    try {
      const candidate = await runSearch(answers);
      setPhase({ step: "results", candidate });
    } catch (err) {
      setPhase({ step: "error", message: (err as Error).message });
    }
  }

  function handleRestart() {
    setQuizKey((k) => k + 1);
    setPhase({ step: "quiz" });
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <a href="https://bradleytjandra.com/">← bradleytjandra.com</a>
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
      </header>
      <main>
        {phase.step === "quiz" && <QuizFlow key={quizKey} onComplete={handleComplete} />}
        {phase.step === "loading" && <LoadingScreen />}
        {phase.step === "results" && (
          <ResultsScreen candidate={phase.candidate} onRestart={handleRestart} />
        )}
        {phase.step === "error" && (
          <p className="error-message">Something went wrong: {phase.message}</p>
        )}
      </main>
    </>
  );
}

export default App;
