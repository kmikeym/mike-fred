import { test, expect } from "bun:test";
import { API_ENVELOPE } from "./types";

test("the fixed envelope fields match STANDARDS §2", () => {
  expect(API_ENVELOPE.schema_version).toBe("1.0.0");
  expect(API_ENVELOPE.license).toBe("CC0-1.0");
  // Pinned so the published contract cannot change by accident. Note this
  // assertion says nothing about whether the URL *works*: it pinned /api for the
  // whole life of v1 while /api 404d, and would have failed anyone who fixed it.
  // Resolvability is guarded in links.test.ts (#23) — that is the real check.
  expect(API_ENVELOPE.docs).toBe("https://mike.quarterly.systems/llms.txt");
});
