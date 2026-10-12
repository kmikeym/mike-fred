/**
 * Q3 2026 travel map: Portland to Oakland, with the late-September Kosovo trip
 * leaving the frame. A schematic of the US West Coast, not a projection a
 * cartographer would sign: the coastline is a dozen hand-placed points on a
 * flat lon/lat grid, enough to orient a reader who knows the shape. It is a
 * server-rendered inline SVG so it prints and needs no client JS, unlike the
 * Recharts figures. Rendered when a narrative section carries
 * `graphic: "q3-2026-travel"` (see reports/[id]/page.tsx).
 */

// Equirectangular with latitude stretched by 1/cos(40°) so the coast is not
// squashed. Frame: lon -126 to -114, lat 32 to 49.
const X = (lon: number) => (lon + 126) * 40;
const Y = (lat: number) => (49 - lat) * 40 * 1.3;

const COAST: [number, number][] = [
  [-124.7, 48.4], [-124.0, 46.9], [-123.9, 46.2], [-124.0, 45.2], [-124.1, 44.6],
  [-124.4, 43.3], [-124.6, 42.8], [-124.2, 41.75], [-124.4, 40.4], [-123.8, 39.5],
  [-123.7, 38.9], [-123.0, 38.3], [-122.5, 37.8], [-122.4, 37.2], [-121.9, 36.6],
  [-121.3, 35.7], [-120.6, 34.9], [-120.5, 34.45], [-119.2, 34.2], [-118.4, 33.9],
  [-117.6, 33.4], [-117.2, 32.7],
];

const path = (pts: [number, number][]) =>
  pts.map(([lon, lat], i) => `${i ? "L" : "M"}${X(lon).toFixed(1)} ${Y(lat).toFixed(1)}`).join(" ");

const PORTLAND = { lon: -122.68, lat: 45.52 };
const OAKLAND = { lon: -122.27, lat: 37.8 };

export default function TravelMap() {
  const w = X(-114);
  const h = Y(32);
  const px = X(PORTLAND.lon), py = Y(PORTLAND.lat);
  const ox = X(OAKLAND.lon), oy = Y(OAKLAND.lat);
  // Land: coastline closed off along the eastern frame edge.
  const land = `${path(COAST)} L${w} ${Y(32.7)} L${w} ${Y(48.4)} Z`;
  // Inland travel route, bowed slightly east of the coast (I-5, roughly).
  const route = `M${px} ${py} Q${X(-121.5)} ${Y(41.7)} ${ox} ${oy}`;
  // Departure for Kosovo: east, off the frame.
  const away = `M${ox} ${oy} Q${X(-118)} ${Y(37.2)} ${w} ${Y(38.2)}`;

  return (
    <figure className="my-6">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Map of the US West Coast showing the move from Portland to Oakland on July 26, 2026, and travel to Kosovo at the end of September"
        className="w-full max-w-md mx-auto block"
      >
        <rect width={w} height={h} fill="#eff6ff" />
        <path d={land} fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round" />
        {/* State lines: WA/OR and OR/CA, plus California's eastern edge. */}
        <path
          d={`M${X(-123.9)} ${Y(46.2)} L${w} ${Y(46.0)} M${X(-124.2)} ${Y(42)} L${w} ${Y(42)} M${X(-120)} ${Y(42)} L${X(-120)} ${Y(39)} L${X(-114.6)} ${Y(35)}`}
          fill="none" stroke="#d1d5db" strokeWidth="1"
        />
        <text x={X(-121.2)} y={Y(47.6)} className="fill-gray-400" fontSize="11">WASHINGTON</text>
        <text x={X(-121.2)} y={Y(43.6)} className="fill-gray-400" fontSize="11">OREGON</text>
        <text x={X(-119.6)} y={Y(36.6)} className="fill-gray-400" fontSize="11">CALIFORNIA</text>

        <path d={route} fill="none" stroke="#1e3a8a" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
        <path d={away} fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="3 5" strokeLinecap="round" />
        <text x={w - 6} y={Y(38.2) - 8} textAnchor="end" className="fill-gray-500" fontSize="11">
          to Kosovo, late September →
        </text>

        <circle cx={px} cy={py} r="5" fill="#1e3a8a" />
        <text x={px + 10} y={py + 4} className="fill-gray-900" fontSize="12" fontWeight="600">Portland</text>
        <text x={px + 10} y={py + 18} className="fill-gray-600" fontSize="11">July 1 to 26 · Summit July 11</text>

        <circle cx={ox} cy={oy} r="5" fill="#1e3a8a" />
        {/* Labels sit on the ocean side so the Kosovo line does not cross them. */}
        <text x={ox - 10} y={oy - 2} textAnchor="end" className="fill-gray-900" fontSize="12" fontWeight="600">Oakland</text>
        <text x={ox - 10} y={oy + 12} textAnchor="end" className="fill-gray-600" fontSize="11">from July 26</text>
      </svg>
      <figcaption className="text-xs text-gray-500 text-center mt-2">
        Q3 2026 in two places. Portland through the Shareholder Summit, Oakland from July 26, with travel
        to Kosovo in the last days of September.
      </figcaption>
    </figure>
  );
}
