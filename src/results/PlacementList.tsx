import { CHART_BODIES, type Chart } from "../ephemeris/sky.ts";
import { formatPosition } from "../ephemeris/signs.ts";

interface Props {
  chart: Chart;
}

export default function PlacementList({ chart }: Props) {
  return (
    <ul className="placement-list">
      <li>
        <span className="placement-name">Ascendant</span>
        <span className="placement-position">{formatPosition(chart.ascendant)}</span>
      </li>
      {CHART_BODIES.map((body) => (
        <li key={body}>
          <span className="placement-name">{body}</span>
          <span className="placement-position">{formatPosition(chart.positions[body])}</span>
        </li>
      ))}
    </ul>
  );
}
