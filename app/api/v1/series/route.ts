import { loadAllIndicators } from "@/lib/indicators";
import { buildSeriesList } from "@/lib/api/documents";
export const dynamic = "force-static";
export async function GET() {
  return Response.json(buildSeriesList(await loadAllIndicators()));
}
