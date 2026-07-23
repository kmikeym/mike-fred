// Hand-authored JSON Schema (draft 2020-12) for each document type, published at
// /api/v1/schema/{name}. Authored to match lib/api/types.ts; Task 4's builder
// tests cross-check that real output satisfies requiredFields(...) so the schema
// and the payload cannot silently diverge. No validator dependency — the check is
// a required-fields presence test, and TypeScript guarantees field types.

const ENVELOPE_PROPS = {
  schema_version: { type: "string" },
  generated_at: { type: "string", format: "date-time" },
  commit: { type: "string" },
  license: { type: "string" },
  docs: { type: "string" },
};
const ENVELOPE_REQUIRED = ["schema_version", "generated_at", "commit", "license", "docs"];

export const SCHEMAS: Record<string, object> = {
  series: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "MIKE series document",
    type: "object",
    required: [...ENVELOPE_REQUIRED, "id", "title", "unit", "date_convention", "observations"],
    properties: {
      ...ENVELOPE_PROPS,
      id: { type: "string" },
      title: { type: "string" },
      unit: { type: "string" },
      frequency: { type: "string" },
      category: { type: "string" },
      source: { type: "string" },
      calculation: { type: ["string", "null"] },
      baseline: { type: ["number", "null"] },
      date_convention: { enum: ["release-lag", "data-month"] },
      vintages: { type: "array" },
      observations: {
        type: "array",
        items: {
          type: "object",
          required: ["date", "period", "value", "notes"],
          properties: {
            date: { type: "string" },
            period: {
              type: "object",
              required: ["start", "end"],
              properties: { start: { type: "string" }, end: { type: "string" } },
            },
            value: { type: ["number", "null"] },
            notes: { type: ["string", "null"] },
            estimated: { const: true },
          },
        },
      },
    },
  },
  "series-list": {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "MIKE series list",
    type: "object",
    required: [...ENVELOPE_REQUIRED, "series"],
    properties: { ...ENVELOPE_PROPS, series: { type: "array" } },
  },
  index: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "MIKE API index",
    type: "object",
    required: [...ENVELOPE_REQUIRED, "name", "description", "links"],
    properties: {
      ...ENVELOPE_PROPS,
      name: { type: "string" },
      description: { type: "string" },
      links: { type: "array" },
    },
  },
};

export const SCHEMA_NAMES = Object.keys(SCHEMAS);

export function getSchema(name: string): object | null {
  return SCHEMAS[name] ?? null;
}

export function requiredFields(name: string): string[] {
  const s = SCHEMAS[name] as { required?: string[] } | undefined;
  return s?.required ?? [];
}
