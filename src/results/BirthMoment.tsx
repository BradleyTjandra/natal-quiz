import type { City } from "../ephemeris/cities.ts";

interface Props {
  date: Date;
  city: City;
}

// Converts the internally-UTC search result to the birthplace's local civil
// time for display, per SPEC.md ("convert to local civil time only for
// display") — native Intl.DateTimeFormat, no library needed.
export default function BirthMoment({ date, city }: Props) {
  const formatted = new Intl.DateTimeFormat(undefined, {
    timeZone: city.timezone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);

  return (
    <div className="birth-moment">
      <p className="birth-moment-line">{formatted}</p>
      <p className="birth-moment-line">{city.name}</p>
    </div>
  );
}
