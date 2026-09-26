import { useEffect, useState } from "react";
import { QUESTIONS, BREATHER_AFTER } from "../questions.ts";
import type { Answers } from "../score.ts";
import { loadProgress, saveProgress, clearProgress } from "../../storage.ts";
import QuestionCard from "./QuestionCard.tsx";
import ProgressBar from "./ProgressBar.tsx";
import Breather from "./Breather.tsx";

interface Props {
  onComplete: (answers: Answers) => void;
}

export default function QuizFlow({ onComplete }: Props) {
  // Lazy-loaded once on mount, not on every render.
  const [saved] = useState(loadProgress);
  const [index, setIndex] = useState(saved?.index ?? 0);
  const [answers, setAnswers] = useState<Answers>(saved?.answers ?? {});
  const [pastBreather, setPastBreather] = useState(saved?.pastBreather ?? false);

  // Re-save on every change so switching apps or refreshing mid-quiz (easy to
  // do by accident on mobile) resumes at the same question instead of
  // starting over.
  useEffect(() => {
    saveProgress({ index, answers, pastBreather });
  }, [index, answers, pastBreather]);

  const showBreather = index === BREATHER_AFTER && !pastBreather;

  function handleAnswer(originalIndex: number) {
    const question = QUESTIONS[index];
    const next = { ...answers, [question.id]: originalIndex };
    setAnswers(next);
    if (index + 1 === QUESTIONS.length) {
      clearProgress(); // App takes over persistence once results are computed
      onComplete(next);
    } else {
      setIndex(index + 1);
    }
  }

  // Stepping back from just past the breather (pastBreather already true)
  // lands on the breather's index but skips re-showing it, since showBreather
  // checks !pastBreather too.
  const handleBack = index > 0 ? () => setIndex(index - 1) : undefined;

  if (showBreather) {
    return <Breather onContinue={() => setPastBreather(true)} onBack={handleBack} />;
  }

  return (
    <div className="quiz-flow">
      <ProgressBar current={index} total={QUESTIONS.length} />
      <QuestionCard
        question={QUESTIONS[index]}
        onAnswer={handleAnswer}
        onBack={handleBack}
        selectedIndex={answers[QUESTIONS[index].id]}
      />
    </div>
  );
}
