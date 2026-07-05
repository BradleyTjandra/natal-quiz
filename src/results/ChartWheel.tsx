import { CHART_BODIES, type Chart, type ChartBody } from "../ephemeris/sky.ts";
import {
  HOUSE_CUSP_ANGLES,
  HOUSE_LABEL_ANGLES,
  signWedges,
  signElement,
  wedgePath,
  bodyAngle,
  ascendantMarkerAngle,
  pointOnWheel,
  assignLanes,
} from "./wheelLayout.ts";

interface Props {
  chart: Chart;
}

const SIZE = 400;
const CENTER = SIZE / 2;
const R_OUTER = 190; // outer edge of the sign band
const R_SIGN_INNER = 155; // inner edge of the sign band / where house spokes reach
const R_SIGN_LABEL = (R_OUTER + R_SIGN_INNER) / 2;
const R_SPOKE_INNER = 12; // small gap at center so all 12 spokes don't converge into a knot
const R_HOUSE_LABEL = (R_SIGN_INNER + R_SPOKE_INNER) / 2; // house numbers sit inside the spokes, between them and center
const R_PLANET_BASE = 140; // lane 0 (innermost-of-the-planet-lanes... see LANE_STEP)
const LANE_STEP = 25; // each collision-avoidance lane steps this far further in

const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const PLANET_GLYPHS: Record<ChartBody, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
};

// No aspect lines between planets -- out of scope for this product (PRD).
export default function ChartWheel({ chart }: Props) {
  const wedges = signWedges(chart.ascendant);
  const ascMarkerTheta = ascendantMarkerAngle(chart.ascendant);

  const bodies = CHART_BODIES.map((body) => ({
    body,
    longitude: chart.positions[body],
  }));
  const laned = assignLanes(bodies).map((b) => ({
    ...b,
    theta: bodyAngle(b.longitude, chart.ascendant),
    radius: R_PLANET_BASE - b.lane * LANE_STEP,
  }));

  return (
    <svg
      className="chart-wheel"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="Your natal chart wheel"
    >
      {wedges.map((wedge) => (
        <path
          key={`tint-${wedge.sign}`}
          d={wedgePath(wedge, R_OUTER, R_SIGN_INNER, CENTER, CENTER)}
          className={`wedge-tint wedge-${signElement(wedge.sign)}`}
        />
      ))}

      <circle cx={CENTER} cy={CENTER} r={R_OUTER} className="wheel-ring" />
      <circle cx={CENTER} cy={CENTER} r={R_SIGN_INNER} className="wheel-ring" />

      {HOUSE_CUSP_ANGLES.map((theta, house) => {
        const inner = pointOnWheel(theta, R_SPOKE_INNER, CENTER, CENTER);
        const outer = pointOnWheel(theta, R_OUTER, CENTER, CENTER);
        return (
          <line
            key={house}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            className={house === 0 ? "house-cusp house-cusp-asc" : "house-cusp"}
          />
        );
      })}

      {HOUSE_LABEL_ANGLES.map((theta, i) => {
        const pos = pointOnWheel(theta, R_HOUSE_LABEL, CENTER, CENTER);
        return (
          <text key={i} x={pos.x} y={pos.y} className="house-label">
            {i + 1}
          </text>
        );
      })}

      {wedges.map((wedge) => {
        const mid = wedge.thetaStart - 15;
        const pos = pointOnWheel(mid, R_SIGN_LABEL, CENTER, CENTER);
        return (
          <text key={wedge.sign} x={pos.x} y={pos.y} className="sign-glyph">
            {SIGN_GLYPHS[wedge.sign]}
          </text>
        );
      })}

      {(() => {
        const inner = pointOnWheel(ascMarkerTheta, R_SPOKE_INNER, CENTER, CENTER);
        const outer = pointOnWheel(ascMarkerTheta, R_OUTER, CENTER, CENTER);
        const labelPos = pointOnWheel(ascMarkerTheta, R_OUTER + 14, CENTER, CENTER);
        return (
          <>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} className="asc-marker" />
            <text x={labelPos.x} y={labelPos.y} className="asc-label">
              ASC
            </text>
          </>
        );
      })()}

      {laned.map(({ body, theta, radius }) => {
        const pos = pointOnWheel(theta, radius, CENTER, CENTER);
        return (
          <text key={body} x={pos.x} y={pos.y} className="planet-glyph">
            {PLANET_GLYPHS[body]}
          </text>
        );
      })}
    </svg>
  );
}
