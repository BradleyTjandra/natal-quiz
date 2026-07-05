import type { Question } from "../score.ts";
import { shuffledIndices } from "../shuffle.ts";

interface Props {
  question: Question;
  onAnswer: (originalIndex: number) => void;
  onBack?: () => void;
  selectedIndex?: number;
}

// Renders one question's options in shuffled order but reports the *original*
// index to onAnswer, so scoreQuiz (which reads q.options[choice]) never has to
// know the display order changed.
export default function QuestionCard({ question, onAnswer, onBack, selectedIndex }: Props) {
  const order = shuffledIndices(question.id, question.options.length);

  return (
    <div className="question-card">
      {onBack && (
        <button type="button" className="back-button" onClick={onBack}>
          ← Back
        </button>
      )}
      <p className="question-text">{question.text}</p>
      <div className="options">
        {order.map((originalIndex) => (
          <button
            key={originalIndex}
            type="button"
            className={
              originalIndex === selectedIndex ? "option-button option-button--selected" : "option-button"
            }
            onClick={() => onAnswer(originalIndex)}
          >
            {question.options[originalIndex].text}
          </button>
        ))}
      </div>
    </div>
  );
}
