/**
 * Data-integrity tests for the CSV parser.
 *
 * STANDARDS.md §7: note text MUST round-trip byte-for-byte from the CSV.
 * Regression guard for issue #2.
 */

import { test, expect } from "bun:test";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { parseCSV } from "./indicators";

async function withTempCsv<T>(contents: string, fn: (p: string) => Promise<T>): Promise<T> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "mike-fred-test-"));
  const file = path.join(dir, "fixture.csv");
  await fs.writeFile(file, contents, "utf-8");
  try {
    return await fn(file);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test("preserves a note containing a comma", async () => {
  const note = await withTempCsv(
    "date,value,notes\n2026-07-01,11,3 books, 3 films\n",
    async (p) => (await parseCSV(p))[0]!.notes,
  );

  expect(note).toBe("3 books, 3 films");
});

test("preserves a note containing several commas", async () => {
  const note = await withTempCsv(
    "date,value,notes\n2026-03-01,102.6,Near baseline — fitness strong. Based in Koreatown, LA, USA.\n",
    async (p) => (await parseCSV(p))[0]!.notes,
  );

  expect(note).toBe("Near baseline — fitness strong. Based in Koreatown, LA, USA.");
});

test("reads ppi hours from the last column when the note contains a comma", async () => {
  const point = await withTempCsv(
    "date,value,notes,pulse,hours\n2026-07-01,83.75,Severe drop: XCOM2, Claude Code,67,157.2\n",
    async (p) => (await parseCSV(p))[0]!,
  );

  expect(point.notes).toBe("Severe drop: XCOM2, Claude Code");
  expect(point.hours).toBe(157.2);
});

test("leaves an absent ppi hours column undefined", async () => {
  // ppi.csv always declares all five columns; early rows simply stop after `pulse`.
  const point = await withTempCsv(
    "date,value,notes,pulse,hours\n2025-01-01,102.5,McDonald's employment period,82\n",
    async (p) => (await parseCSV(p))[0]!,
  );

  expect(point.notes).toBe("McDonald's employment period");
  expect(point.hours).toBeUndefined();
});

test("handles a trailing empty hours field without swallowing it into the note", async () => {
  // mike-fred-append-month.sh emits `...,80,` when --hours is not supplied.
  const point = await withTempCsv(
    "date,value,notes,pulse,hours\n2026-08-01,100.00,Test, with a comma,80,\n",
    async (p) => (await parseCSV(p))[0]!,
  );

  expect(point.notes).toBe("Test, with a comma");
  expect(point.hours).toBeUndefined();
});

test("treats an empty note as undefined", async () => {
  const note = await withTempCsv(
    "date,value,notes\n2026-07-01,11,\n",
    async (p) => (await parseCSV(p))[0]!.notes,
  );

  expect(note).toBeUndefined();
});

test("every note in every shipped CSV round-trips byte-for-byte", async () => {
  const dir = path.join(process.cwd(), "data");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".csv"));
  expect(files.length).toBeGreaterThan(0);

  for (const file of files) {
    const full = path.join(dir, file);
    const isPpi = file === "ppi.csv";
    const raw = (await fs.readFile(full, "utf-8")).trim().split("\n").slice(1);
    const parsed = await parseCSV(full);

    expect(parsed.length).toBe(raw.length);

    raw.forEach((line, i) => {
      const fields = line.split(",");
      // 3-column files: the note is everything after the 2nd comma.
      // ppi.csv is date,value,notes,pulse[,hours] — the note ends before the
      // trailing numeric columns.
      const trailing = isPpi ? (fields.length >= 5 ? 2 : 1) : 0;
      const expected = fields.slice(2, fields.length - trailing).join(",").trim();

      expect(`${file}:${i}:${parsed[i]!.notes ?? ""}`).toBe(`${file}:${i}:${expected}`);
    });
  }
});

test("estimated values are flagged so they cannot be mistaken for measurements", async () => {
  // STANDARDS.md §6: an interpolated or back-filled value must announce itself.
  // Regression guard for phi-classic's February 2026 row (#9 D2), which was a
  // duplicate of March before it was replaced with a flagged interpolation.
  const dir = path.join(process.cwd(), "data");
  const feb = (await parseCSV(path.join(dir, "phi-classic.csv"))).find((p) => p.date === "2026-03-01");

  expect(feb!.notes?.startsWith("ESTIMATED")).toBe(true);
  expect(feb!.notes).toContain("midpoint");
});

test("no series' latest reading follows an unmeasured month", async () => {
  // The headline change compares the last two MEASURED rows. If the latest row
  // follows a gap, that comparison spans several months while every page labels it
  // a one-period move. That cannot happen today (SCI's gap is Dec 2025 to Jan 2026);
  // this fails if it ever does, so the label is fixed before it misleads.
  const { INDICATOR_REGISTRY } = await import("./indicators");
  for (const id of Object.keys(INDICATOR_REGISTRY)) {
    const data = await parseCSV(path.join(process.cwd(), "data", `${id}.csv`));
    const lastMeasured = data.map((p) => p.value !== null).lastIndexOf(true);
    const before = data[lastMeasured - 1];
    expect(`${id}:${before === undefined || before.value !== null}`).toBe(`${id}:true`);
  }
});

test("a measured previous value of 0 is a real 0, not a missing value", async () => {
  // Guard on the operator, not the data: `||` read 0 as missing and fell back to
  // the current value, reporting no change.
  const src = await fs.readFile(path.join(process.cwd(), "lib", "indicators.ts"), "utf-8");
  expect(src).not.toContain("?.value || currentValue");
});
