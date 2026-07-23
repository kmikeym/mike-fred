import { loadAllIndicators } from "@/lib/indicators";
import { API_ENVELOPE } from "@/lib/api/types";

export const dynamic = "force-static";

export async function GET() {
  const indicators = await loadAllIndicators();
  const lines = [
    "# MIKE Economic Data",
    "",
    "Read-only JSON API for personal economic indicators, generated at build time",
    "from the same source as the site. Licensed CC0-1.0.",
    "",
    "## Endpoints (base: https://mike.quarterly.systems)",
    "- /api/v1              discovery index",
    "- /api/v1/series       all indicators, current values",
    "- /api/v1/series/{id}  full series: metadata + every observation + notes",
    "- /api/v1/series/{id}/csv   raw CSV",
    "- /api/v1/schema/{name}     JSON Schema (series, series-list, index)",
    "",
    "## Conventions",
    "- Every observation carries `date` (publication) and `period` (month measured).",
    "  Compare series on `period`, never `date` — series use different date conventions.",
    "- `estimated: true` marks an interpolated value, not a measurement.",
    "- Retired series are preserved as vintages, linked from the series they replaced.",
    "",
    "## Series",
    ...indicators.map((i) => `- ${i.id}: ${i.title} — ${i.unit}  →  /api/v1/series/${i.id}`),
    "",
    `Docs: ${API_ENVELOPE.docs}`,
  ];
  return new Response(lines.join("\n") + "\n", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
