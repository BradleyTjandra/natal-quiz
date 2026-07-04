import { houseSigns } from "../ephemeris/houses.ts";
import { SIGNS } from "../ephemeris/signs.ts";

interface Props {
  ascSignIndex: number;
}

export default function HouseTable({ ascSignIndex }: Props) {
  const signs = houseSigns(ascSignIndex);
  return (
    <ul className="house-table">
      {signs.map((sign, i) => (
        <li key={i}>
          <span className="house-number">House {i + 1}</span>
          <span className="house-sign">{SIGNS[sign]}</span>
        </li>
      ))}
    </ul>
  );
}
