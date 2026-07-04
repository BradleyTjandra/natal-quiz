import type { Candidate } from "../ephemeris/stage4.ts";
import { signIndexOf } from "../ephemeris/signs.ts";
import BirthMoment from "./BirthMoment.tsx";
import PlacementList from "./PlacementList.tsx";
import HouseTable from "./HouseTable.tsx";

interface Props {
  candidate: Candidate;
}

// Presents the chart as simply the user's own (PRD: "never frame the result
// as a best available match") — nothing here reads candidate.score.
export default function ResultsScreen({ candidate }: Props) {
  const ascSignIndex = signIndexOf(candidate.chart.ascendant);

  return (
    <div className="results-screen">
      <h1>Your true birth moment</h1>
      <BirthMoment date={candidate.date} city={candidate.city} />

      <h2>Your chart</h2>
      <PlacementList chart={candidate.chart} />

      <h2>Your houses</h2>
      <HouseTable ascSignIndex={ascSignIndex} />

      <p className="verification-hint">
        Check it yourself on any astrology site.
      </p>
    </div>
  );
}
