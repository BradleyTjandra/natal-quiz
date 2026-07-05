interface Props {
  onContinue: () => void;
  onBack?: () => void;
}

export default function Breather({ onContinue, onBack }: Props) {
  return (
    <div className="breather">
      {onBack && (
        <button type="button" className="back-button" onClick={onBack}>
          ← Back
        </button>
      )}
      <p>Halfway there. Take a breath.</p>
      <p className="breather-sub">The next questions are about how you think, love, and fight.</p>
      <button type="button" className="option-button" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
