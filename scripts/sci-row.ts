// sci-row.ts: compute one SCI 2.0 row from the 11 platform counts.
//
// Called by mike-fred-append-month.sh (--sci-counts). Kept in TypeScript so the
// monthly write path runs the exact functions the tests pin in lib/sci.test.ts,
// rather than a bash re-implementation of the formula that could drift (#12).
//
//   bun scripts/sci-row.ts --date 2026-11-01 --counts "kmikeym-accounts=3970,substack=3380,..." [--source "..."]
//
// Prints KEY=VALUE lines for the shell to read:
//   VALUE=105.61                      the SCI 2.0 index for the row, 2 decimals
//   PLATFORM_ROW=2026-11-01,3970,...  the row for data/inputs/sci-platforms.csv
//   CROSSING=mastodon 98->101         one line per platform whose count crossed 100 since
//                                     the previous row. The RFC asks for a line in that
//                                     month's note (threshold-crossing disclosure). Scoring
//                                     does not change: the floor applies to the frozen
//                                     baseline, not to the monthly count. See SCI2_FLOOR.
import {
  loadPlatformCounts,
  parseCountsArg,
  sci2Baseline,
  sci2Index,
  sci2Weights,
  scoreTableAsOf,
  SCI2_FLOOR,
  SUBSTACK_REACH_DEFAULT,
} from "../lib/sci";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const date = arg("date");
const raw = arg("counts");
const source = (arg("source") ?? "monthly release").replace(/[\n\r]/g, " ");
if (!date || !/^\d{4}-\d{2}-01$/.test(date) || !raw) {
  console.error("usage: bun scripts/sci-row.ts --date YYYY-MM-01 --counts \"id=N,id=N,...\" [--source \"...\"]");
  process.exit(2);
}

let counts: Record<string, number>;
try {
  counts = parseCountsArg(raw);
} catch (e) {
  console.error(`sci-row: ${(e as Error).message}`);
  process.exit(2);
}

const rows = await loadPlatformCounts();
if (rows.some((r) => r.date === date)) {
  console.error(`sci-row: ${date} is already in data/inputs/sci-platforms.csv`);
  process.exit(2);
}
// Every row of the series uses one score table; a release never mixes two (§9).
const weights = sci2Weights(scoreTableAsOf(SUBSTACK_REACH_DEFAULT.publishedAsOf));
const value = sci2Index(counts, sci2Baseline(rows), weights); // throws on missing/unknown

const ids = Object.keys(rows[0]!.counts);
console.log(`VALUE=${value.toFixed(2)}`);
console.log(`PLATFORM_ROW=${[date, ...ids.map((id) => counts[id]), source].join(",")}`);
const prev = rows[rows.length - 1]!.counts;
for (const id of ids) {
  const before = prev[id]! >= SCI2_FLOOR, after = counts[id]! >= SCI2_FLOOR;
  if (before !== after) console.log(`CROSSING=${id} ${prev[id]}->${counts[id]}`);
}
