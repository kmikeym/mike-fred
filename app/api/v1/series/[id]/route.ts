import path from "path";
import { loadIndicatorData, parseCSV, INDICATOR_REGISTRY } from "@/lib/indicators";
import { buildSeriesDocument, buildObservation, buildEnvelope } from "@/lib/api/documents";
import { ALL_SERIES_IDS, isVintage, VINTAGE_META } from "@/lib/api/vintages";
import type { SeriesDocument } from "@/lib/api/types";

export const dynamic = "force-static";
export const dynamicParams = false; // only the known ids; anything else 404s

export function generateStaticParams() {
  return ALL_SERIES_IDS.map((id) => ({ id }));
}

async function vintageDocument(id: string): Promise<SeriesDocument> {
  const meta = VINTAGE_META[id]!;
  const data = await parseCSV(path.join(process.cwd(), "data", `${id}.csv`));
  const observations = data.map((p) => buildObservation(p, meta.date_convention));
  for (const o of observations) {
    if (o.value !== null && !Number.isFinite(o.value)) {
      throw new Error(`api: non-finite value in vintage ${id} at ${o.date}`);
    }
  }
  return {
    ...buildEnvelope(),
    id,
    title: meta.title,
    unit: meta.unit,
    frequency: meta.frequency,
    category: meta.category,
    source: meta.source,
    calculation: meta.calculation,
    baseline: meta.baseline,
    date_convention: meta.date_convention,
    vintages: [],
    observations,
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isVintage(id)) return Response.json(await vintageDocument(id));
  if (id in INDICATOR_REGISTRY) {
    return Response.json(buildSeriesDocument(await loadIndicatorData(id as keyof typeof INDICATOR_REGISTRY)));
  }
  return new Response("Not found", { status: 404 });
}
