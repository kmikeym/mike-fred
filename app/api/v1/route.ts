import { buildIndex } from "@/lib/api/documents";
export const dynamic = "force-static";
export async function GET() {
  return Response.json(buildIndex());
}
