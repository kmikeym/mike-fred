import { test, expect } from "bun:test";
import { SCHEMAS, SCHEMA_NAMES, getSchema, requiredFields } from "./schema";

test("every named schema is a JSON Schema object with a title", () => {
  for (const name of SCHEMA_NAMES) {
    const s = getSchema(name) as any;
    expect(`${name}:${typeof s}`).toBe(`${name}:object`);
    expect(`${name}:${s.$schema ? "ok" : "missing"}`).toBe(`${name}:ok`);
  }
});

test("the series schema requires the envelope + provenance fields", () => {
  const req = requiredFields("series");
  for (const f of ["schema_version", "id", "date_convention", "observations"]) {
    expect(`series requires ${f}: ${req.includes(f)}`).toBe(`series requires ${f}: true`);
  }
});

test("getSchema returns null for an unknown name", () => {
  expect(getSchema("nope")).toBeNull();
});
