interface Props {
  current: number; // 0-based index of the question about to be shown
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="progress-wrap">
      <div className="progress-bar" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="progress-label">
        Question {current + 1} of {total}
      </p>
    </div>
  );
}
