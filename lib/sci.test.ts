/**
 * Social Capital Index derivation tests.
 *
 * SCI is declared `valueSource: "derived"` in the registry, but until now the
 * repo could not actually derive it: the weighted-composite stage lived only as
 * prose naming 5 of 11 platforms and 2 of 11 weights. These tests pin the whole
 * pipeline so `derived` is a true statement (#17).
 */

import { test, expect } from "bun:test";
import { promises as fs } from "fs";
import path from "path";
import { SCI_WEIGHTS, SCI_BASELINE, weightedComposite, sciIndex } from "./sci";

test("the weight table covers 11 platforms", () => {
  expect(SCI_WEIGHTS.length).toBe(11);
});

test("weights sum to 1", () => {
  const sum = SCI_WEIGHTS.reduce((a, w) => a + w.weight, 0);
  // Tolerance, not equality: 0.35 + 0.30 + ... accumulates binary float error and
  // does not land on exactly 1. The invariant is the intent, not the bit pattern.
  expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
});

test("platform ids are unique", () => {
  const ids = SCI_WEIGHTS.map((w) => w.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("a uniform audience across every platform composites to that same number", () => {
  // Because the weights sum to 1, the composite is a weighted MEAN: if every
  // platform reports 1000 followers, the composite is 1000. This is the property
  // that distinguishes a weighted mean from a weighted sum, and it is the one
  // that made the ~3042 baseline plausible in the first place.
  const counts = Object.fromEntries(SCI_WEIGHTS.map((w) => [w.id, 1000]));
  expect(weightedComposite(counts)).toBeCloseTo(1000, 9);
});

test("weightedComposite applies each platform's weight", () => {
  const counts = Object.fromEntries(SCI_WEIGHTS.map((w) => [w.id, 0]));
  counts["substack"] = 1000; // weight 0.30
  expect(weightedComposite(counts)).toBeCloseTo(300, 9);
});

test("a missing platform count throws rather than silently counting as zero", () => {
  // A dropped platform would quietly deflate the index and read as audience
  // decline. Absent input is an error, not a zero (STANDARDS §6: "no data" and
  // "scored zero" must stay distinguishable).
  const counts = Object.fromEntries(SCI_WEIGHTS.slice(1).map((w) => [w.id, 100]));
  expect(() => weightedComposite(counts)).toThrow(/kmikeym-accounts/);
});

test("an unknown platform throws rather than being ignored", () => {
  const counts = Object.fromEntries(SCI_WEIGHTS.map((w) => [w.id, 100]));
  counts["threads"] = 500;
  expect(() => weightedComposite(counts)).toThrow(/threads/);
});

test("the baseline composite indexes to exactly 100", () => {
  expect(sciIndex(SCI_BASELINE)).toBe(100);
});

// Classic's last two rows were published without "(raw: …)" in the note, so the
// composite is recorded here from the monthly run logs instead (operations#559,
// 2026-09-04 and 2026-10-01). Editing the published notes to add it would break
// STANDARDS §9; this keeps the row reproducible without touching it.
const CLASSIC_RAW_FROM_RUN_LOG: Record<string, number> = {
  "2026-09-01": 3168.7,
  "2026-10-01": 3079.18,
};

test("every published SCI Classic row is reproducible from its raw composite", async () => {
  const csv = await fs.readFile(
    path.join(process.cwd(), "data", "social-capital-classic.csv"),
    "utf-8",
  );
  const rows = csv.trim().split("\n").slice(1);
  expect(rows.length).toBeGreaterThan(0);

  for (const row of rows) {
    const date = row.slice(0, 10);
    const raw = Number(row.match(/raw: ([\d.]+)/)?.[1] ?? CLASSIC_RAW_FROM_RUN_LOG[date]);
    const published = Number(row.split(",")[1]);
    expect(`${date}:${Number.isFinite(raw)}`).toBe(`${date}:true`);

    // Compare at the precision the row was published to — a row stored as 101.15
    // must reproduce to 101.15, one stored as 100.4 to 100.4.
    const decimals = (String(published).split(".")[1] ?? "").length;
    expect(`${date}:${sciIndex(raw).toFixed(decimals)}`).toBe(
      `${date}:${published.toFixed(decimals)}`,
    );
  }
});

// ---------------------------------------------------------------------------
// SCI 2.0 (adopted 2026-09-22, published from the 2026-11-01 release; #688).
// The RFC's "For Agents" block names two checks that must regenerate or the
// table is wrong: the baseline months average to exactly 100, and the 2026-07-01
// row is 104.24 under the adopted score table.
// ---------------------------------------------------------------------------

import {
  SCI2_ADOPTED_TABLE,
  SCI2_FLOOR,
  SCI2_BASELINE_DATES,
  SUBSTACK_REACH_DEFAULT,
  scoreTableAsOf,
  sci2Weights,
  sci2Baseline,
  sci2Index,
  loadPlatformCounts,
  parseCountsArg,
} from "./sci";

const adopted = sci2Weights(SCI2_ADOPTED_TABLE);

test("SCI 2.0 weights are Score / ΣScore with no rounding (adopted table sums to 256)", () => {
  const scores = SCI2_ADOPTED_TABLE.map((c) => c.reach * c.fit * c.path);
  expect(scores.reduce((a, b) => a + b, 0)).toBe(256);
  expect(adopted["kmikeym-accounts"]).toBe(100 / 256);
  expect(Object.values(adopted).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
});

test("SCI 2.0 covers the same 11 platforms as Classic", () => {
  expect(SCI2_ADOPTED_TABLE.map((c) => c.id).sort()).toEqual(SCI_WEIGHTS.map((w) => w.id).sort());
});

test("RFC check: the baseline months average to exactly 100", async () => {
  const rows = await loadPlatformCounts();
  const base = sci2Baseline(rows);
  const [a, b] = SCI2_BASELINE_DATES.map((d) => sci2Index(rows.find((r) => r.date === d)!.counts, base, adopted));
  expect(((a! + b!) / 2).toFixed(4)).toBe("100.0000");
});

test("RFC check: the 2026-07-01 row is 104.24 under the adopted table", async () => {
  const rows = await loadPlatformCounts();
  const base = sci2Baseline(rows);
  const jul = rows.find((r) => r.date === "2026-07-01")!;
  expect(sci2Index(jul.counts, base, adopted).toFixed(2)).toBe("104.24");
});

test("the small-base floor: below 100 followers the denominator is 100, the numerator stays real", () => {
  // Mastodon's baseline is 26. One new follower is +1/100 of a channel point,
  // not +1/26, so a tiny account cannot swing the index (RFC, "Why the floor").
  expect(SCI2_FLOOR).toBe(100);
  const ids = SCI2_ADOPTED_TABLE.map((c) => c.id);
  const base = Object.fromEntries(ids.map((id) => [id, id === "mastodon" ? 26 : 1000]));
  const flat = Object.fromEntries(ids.map((id) => [id, base[id]!]));
  const plusOne = { ...flat, mastodon: 27 };
  const w = Object.fromEntries(ids.map((id) => [id, id === "mastodon" ? 1 : 0]));
  expect(sci2Index(flat, base, w)).toBeCloseTo(100, 12);
  expect(sci2Index(plusOne, base, w)).toBeCloseTo(101, 12);
});

test("the Substack reach default executes in code: R=3 before 2026-10-31, R=2 from it", () => {
  // The RFC: without real Substack engagement data by 2026-10-31, Substack's
  // Reach drops to 2 by default, and "the default must execute in code, not in
  // this prose". Nothing was filed, so the default fired (Mike, 2026-10-20).
  expect(SUBSTACK_REACH_DEFAULT.effective).toBe("2026-10-31");
  const reach = (d: string) => scoreTableAsOf(d).find((c) => c.id === "substack")!.reach;
  expect(reach("2026-10-30")).toBe(3);
  expect(reach("2026-10-31")).toBe(2);
  const total = scoreTableAsOf("2026-11-01").reduce((a, c) => a + c.reach * c.fit * c.path, 0);
  expect(total).toBe(244);
});

test("sci2Index throws on a missing or unknown platform rather than scoring it zero", async () => {
  const rows = await loadPlatformCounts();
  const base = sci2Baseline(rows);
  const { substack: _, ...missing } = rows[0]!.counts;
  expect(() => sci2Index(missing, base, adopted)).toThrow(/substack/);
  expect(() => sci2Index({ ...rows[0]!.counts, threads: 9 }, base, adopted)).toThrow(/threads/);
});

test("every SCI 2.0 row in social-capital.csv is reproducible from data/sci-platforms.csv", async () => {
  // The series is derived: a published 2.0 value that cannot be regenerated from
  // the platform counts checked in beside it is a hand-typed number (#570).
  // Rows with no value are months that were never measured (#573).
  const rows = await loadPlatformCounts();
  const base = sci2Baseline(rows);
  const csv = await fs.readFile(path.join(process.cwd(), "data", "social-capital.csv"), "utf-8");
  const lines = csv.trim().split("\n").slice(1);
  for (const line of lines) {
    const [date, value] = line.split(",");
    if (value === "") {
      expect(`${date}:${rows.some((r) => r.date === date)}`).toBe(`${date}:false`);
      continue;
    }
    const row = rows.find((r) => r.date === date);
    expect(`${date}:${!!row}`).toBe(`${date}:true`);
    const w = sci2Weights(scoreTableAsOf(SUBSTACK_REACH_DEFAULT.publishedAsOf));
    expect(`${date}:${sci2Index(row!.counts, base, w).toFixed(2)}`).toBe(`${date}:${Number(value).toFixed(2)}`);
  }
});

test("the SCI series keeps its unmeasured months as null rows rather than dropping them", async () => {
  const { parseCSV } = await import("./indicators");
  const data = await parseCSV(path.join(process.cwd(), "data", "social-capital.csv"));
  const gap = data.filter((p) => p.value === null).map((p) => p.date);
  expect(gap).toEqual(["2025-12-01", "2026-01-01"]);
});

test("the registry's SCI calculation text states the weights the code uses", async () => {
  // The prose weight list drifted from the code before (#12). Pin every fraction.
  const { INDICATOR_REGISTRY } = await import("./indicators");
  const text = INDICATOR_REGISTRY["social-capital"].calculation;
  const table = scoreTableAsOf(SUBSTACK_REACH_DEFAULT.publishedAsOf);
  const total = table.reduce((a, c) => a + c.reach * c.fit * c.path, 0);
  for (const c of table) {
    const label = SCI_WEIGHTS.find((w) => w.id === c.id)!.label;
    expect(text).toContain(`${label} ${c.reach * c.fit * c.path}/${total}`);
  }
});

test("a blank count in the platform file throws rather than loading as zero", async () => {
  // Number("") is 0, and 0 is finite, so a blank cell used to load as a real zero
  // and score the platform at -100%: a dropped input read as a collapse (STANDARDS §6).
  const dir = await fs.mkdtemp(path.join(process.env.TMPDIR ?? "/tmp", "sci-"));
  const file = path.join(dir, "sci-platforms.csv");
  const real = (await fs.readFile(path.join(process.cwd(), "data", "inputs", "sci-platforms.csv"), "utf-8")).trim().split("\n");
  const blanked = real[1]!.split(",");
  blanked[2] = ""; // substack
  await fs.writeFile(file, [real[0], blanked.join(",")].join("\n") + "\n");
  try {
    await expect(loadPlatformCounts(file)).rejects.toThrow(/substack/);
  } finally {
    await fs.rm(dir, { recursive: true });
  }
});

test("parseCountsArg rejects a blank value, a duplicate id, and anything but a whole number", () => {
  const ok = "kmikeym-accounts=3970,substack=3380";
  expect(parseCountsArg(ok)).toEqual({ "kmikeym-accounts": 3970, substack: 3380 });
  // A count Mike has not supplied yet must stop the row, not score as zero.
  expect(() => parseCountsArg("kmikeym-accounts=3970,substack=")).toThrow(/substack/);
  expect(() => parseCountsArg("kmikeym-accounts=3970,substack= ")).toThrow(/substack/);
  expect(() => parseCountsArg("x=4200,x=42")).toThrow(/x.*twice/);
  expect(() => parseCountsArg("x=4,200")).toThrow();
  expect(() => parseCountsArg("x=-3")).toThrow(/x/);
  expect(() => parseCountsArg("x=1e3")).toThrow(/x/);
});
