import { SCHEMA_NAMES, getSchema } from "@/lib/api/schema";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return SCHEMA_NAMES.map((name) => ({ name }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const schema = getSchema(name);
  if (!schema) return new Response("Not found", { status: 404 });
  return Response.json(schema);
}
