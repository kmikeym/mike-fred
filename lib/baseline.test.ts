import { test, expect } from "bun:test";
import { INDICATOR_REGISTRY } from "./indicators";

test("PPI declares a baseline of 100", () => {
  expect(INDICATOR_REGISTRY.ppi.baseline).toBe(100);
});

test("count/point series declare no baseline — a line at 100 would be meaningless", () => {
  // KBER is Total Notes, LMV is Points; 100 is not a reference on those scales.
  expect(INDICATOR_REGISTRY["knowledge-expansion"].baseline).toBeUndefined();
  expect(INDICATOR_REGISTRY["completion-rate"].baseline).toBeUndefined();
});
