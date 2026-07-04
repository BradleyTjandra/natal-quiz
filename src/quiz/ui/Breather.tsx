interface Props {
  onContinue: () => void;
}

export default function Breather({ onContinue }: Props) {
  return (
    <div className="breather">
      <p>Halfway there. Take a breath.</p>
      <p className="breather-sub">The next questions are about how you think, love, and fight.</p>
      <button type="button" className="option-button" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
