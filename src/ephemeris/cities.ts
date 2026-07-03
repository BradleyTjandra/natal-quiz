// The pool of birthplaces the search can choose from. Their purpose is the
// longitude spread: at a fixed UTC instant, the Ascendant and the Moon's
// displayed degree depend on *where* you stand, so a wide east–west spread of
// cities gives the search ~±6° of control over the Moon degree (SPEC §Layer 3)
// and lets it hit any target Ascendant sign at some hour of the day.
//
// `longitudeEast` is degrees east of Greenwich (negative = west), matching the
// convention `ascendant()` in sky.ts expects. `timezone` is an IANA identifier
// stored now as static data but not used until M4 (converting the winning UTC
// moment to local civil time for the reveal); the search itself uses only
// latitude/longitude. Cities are chosen to be globally recognisable and to have
// unambiguous timezone histories.

export interface City {
  name: string;
  latitude: number; // degrees north (negative = south)
  longitudeEast: number; // degrees east of Greenwich (negative = west)
  timezone: string; // IANA tz id, for M4 local-time display only
}

export const CITIES: City[] = [
  { name: "Auckland", latitude: -36.85, longitudeEast: 174.76, timezone: "Pacific/Auckland" },
  { name: "Sydney", latitude: -33.87, longitudeEast: 151.21, timezone: "Australia/Sydney" },
  { name: "Tokyo", latitude: 35.68, longitudeEast: 139.69, timezone: "Asia/Tokyo" },
  { name: "Seoul", latitude: 37.57, longitudeEast: 126.98, timezone: "Asia/Seoul" },
  { name: "Beijing", latitude: 39.90, longitudeEast: 116.41, timezone: "Asia/Shanghai" },
  { name: "Jakarta", latitude: -6.21, longitudeEast: 106.85, timezone: "Asia/Jakarta" },
  { name: "Kolkata", latitude: 22.57, longitudeEast: 88.36, timezone: "Asia/Kolkata" },
  { name: "Dubai", latitude: 25.20, longitudeEast: 55.27, timezone: "Asia/Dubai" },
  { name: "Moscow", latitude: 55.76, longitudeEast: 37.62, timezone: "Europe/Moscow" },
  { name: "Cairo", latitude: 30.04, longitudeEast: 31.24, timezone: "Africa/Cairo" },
  { name: "Nairobi", latitude: -1.29, longitudeEast: 36.82, timezone: "Africa/Nairobi" },
  { name: "Istanbul", latitude: 41.01, longitudeEast: 28.98, timezone: "Europe/Istanbul" },
  { name: "Cape Town", latitude: -33.92, longitudeEast: 18.42, timezone: "Africa/Johannesburg" },
  { name: "London", latitude: 51.51, longitudeEast: -0.13, timezone: "Europe/London" },
  { name: "Lagos", latitude: 6.52, longitudeEast: 3.38, timezone: "Africa/Lagos" },
  { name: "Reykjavik", latitude: 64.15, longitudeEast: -21.94, timezone: "Atlantic/Reykjavik" },
  { name: "Rio de Janeiro", latitude: -22.91, longitudeEast: -43.17, timezone: "America/Sao_Paulo" },
  { name: "Buenos Aires", latitude: -34.60, longitudeEast: -58.38, timezone: "America/Argentina/Buenos_Aires" },
  { name: "New York", latitude: 40.71, longitudeEast: -74.01, timezone: "America/New_York" },
  { name: "Mexico City", latitude: 19.43, longitudeEast: -99.13, timezone: "America/Mexico_City" },
  { name: "Chicago", latitude: 41.88, longitudeEast: -87.63, timezone: "America/Chicago" },
  { name: "Denver", latitude: 39.74, longitudeEast: -104.99, timezone: "America/Denver" },
  { name: "Los Angeles", latitude: 34.05, longitudeEast: -118.24, timezone: "America/Los_Angeles" },
  { name: "Honolulu", latitude: 21.31, longitudeEast: -157.86, timezone: "Pacific/Honolulu" },
];
