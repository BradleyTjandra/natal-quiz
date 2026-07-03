// The span of history the search draws birth moments from. Provisional: 1600 is
// comfortably within astronomy-engine's high-accuracy range, so generated charts
// match mainstream (Swiss Ephemeris-based) astrology sites closely. We can widen
// this toward ~1000 AD later — it's a one-line change plus regenerating the
// ingress tables — once we've spot-checked how far back the displayed degrees
// still line up (an M1 task; see PLAN.md).
export const SEARCH_START_YEAR = 1600;
export const SEARCH_END_YEAR = 2100;
