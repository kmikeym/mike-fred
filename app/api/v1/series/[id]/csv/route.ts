import { promises as fs } from "fs";
import path from "path";
import { ALL_SERIES_IDS } from "@/lib/api/vintages";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_SERIES_IDS.map((id) => ({ id }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ALL_SERIES_IDS.includes(id)) return new Response("Not found", { status: 404 });
  const csv = await fs.readFile(path.join(process.cwd(), "data", `${id}.csv`), "utf-8");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8" } });
}
