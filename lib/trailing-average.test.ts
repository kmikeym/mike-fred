import { test, expect } from "bun:test";
import { trailingAverage } from "./utils";

test("returns null until the window is full, then the trailing mean", () => {
  // window 3 over four points: first two null, then means of the last-3.
  expect(trailingAverage([1, 2, 3, 4], 3)).toEqual([null, null, 2, 3]);
});

test("computes PPI's real 3-month trend at the last three points", () => {
  // From data/ppi.csv (…,103.75,100,93.75,96.25,83.75). Trailing 3-month:
  // May = mean(103.75,100,93.75)=99.1666…, Jun = mean(100,93.75,96.25)=96.6666…,
  // Jul = mean(93.75,96.25,83.75)=91.25.
  const tail = trailingAverage([103.75, 100, 93.75, 96.25, 83.75], 3);
  expect(tail[2]).toBeCloseTo(99.1667, 3);
  expect(tail[3]).toBeCloseTo(96.6667, 3);
  expect(tail[4]).toBe(91.25);
});

test("a window of 1 is the series itself", () => {
  expect(trailingAverage([5, 6, 7], 1)).toEqual([5, 6, 7]);
});

test("a window longer than the series is all null", () => {
  expect(trailingAverage([1, 2], 6)).toEqual([null, null]);
});

test("empty input yields empty output", () => {
  expect(trailingAverage([], 3)).toEqual([]);
});
