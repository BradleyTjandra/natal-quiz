interface Props {
  current: number; // 0-based index of the question about to be shown
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="progress-bar" aria-label={`Question ${current + 1} of ${total}`}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
