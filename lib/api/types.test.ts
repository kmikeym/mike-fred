import { test, expect } from "bun:test";
import { API_ENVELOPE } from "./types";

test("the fixed envelope fields match STANDARDS §2", () => {
  expect(API_ENVELOPE.schema_version).toBe("1.0.0");
  expect(API_ENVELOPE.license).toBe("CC0-1.0");
  expect(API_ENVELOPE.docs).toBe("https://mike.quarterly.systems/api");
});
