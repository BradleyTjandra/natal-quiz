import { useState } from "react";
import { QUESTIONS, BREATHER_AFTER } from "../questions.ts";
import type { Answers } from "../score.ts";
import QuestionCard from "./QuestionCard.tsx";
import ProgressBar from "./ProgressBar.tsx";
import Breather from "./Breather.tsx";

interface Props {
  onComplete: (answers: Answers) => void;
}

export default function QuizFlow({ onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [pastBreather, setPastBreather] = useState(false);

  const showBreather = index === BREATHER_AFTER && !pastBreather;

  function handleAnswer(originalIndex: number) {
    const question = QUESTIONS[index];
    const next = { ...answers, [question.id]: originalIndex };
    setAnswers(next);
    if (index + 1 === QUESTIONS.length) {
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
      <QuestionCard question={QUESTIONS[index]} onAnswer={handleAnswer} onBack={handleBack} />
    </div>
  );
}
