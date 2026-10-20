/**
 * Social Capital Index (SCI) derivation.
 *
 * SCI is computed in two stages, and until this file existed only the second one
 * was written down anywhere:
 *
 *   11 platform counts --[weights]--> raw composite --[/ 3041.9 * 100]--> index
 *
 * The registry named 5 of the 11 platforms and 2 of the 11 weights in prose;
 * CLAUDE.md documented the indexing step. Nobody could reproduce a published
 * figure from what was checked in, which meant the registry's
 * `valueSource: "derived"` was asserting a capability the repo did not have.
 * Weights live here as tested data for the same reason `dateConvention` is typed
 * rather than prose: the prose version drifted and was wrong in three of five
 * places (#12). See STANDARDS.md §8 and issue #17.
 */

import { promises as fs } from "fs";
import path from "path";

export interface SciPlatformWeight {
  id: string;
  label: string;
  weight: number;
}

/**
 * The weighting Mike applies across the 11 tracked platforms.
 *
 * Weights sum to 1, which makes the composite a weighted *mean* of follower
 * counts rather than a sum — the composite is denominated in followers, so
 * ~3042 is "the weighted-average audience," not a total across platforms. A
 * test pins the sum; changing a weight without rebalancing fails the build.
 *
 * Changing any weight silently re-scales the whole series against a baseline
 * captured under the old weighting. Treat this table as a methodology change
 * requiring a restatement (STANDARDS.md §9), never a routine edit.
 */
export const SCI_WEIGHTS: readonly SciPlatformWeight[] = [
  // "KmikeyM accounts" = the TOTAL NUMBER OF USER ACCOUNTS on kmikeym.com, read
  // off the ADMIN PANEL (Mike, 2026-09-04). NOT the shareholder count: on the
  // same day those were 3,965 accounts against 1,248 shareholders, so the two
  // differ by more than 3x and picking the wrong one would move the index by
  // roughly a third of its value.
  //
  // Confirmed rather than assumed. Back-solving July's published composite
  // (3078.06) against the six measurable platforms left ~1,738 for this input
  // plus the four auth-walled ones, implying 3,700-4,800 here. The real figure,
  // 3,965, landed inside that range.
  //
  // Only Mike can supply this today. It lives in the site's admin panel, which
  // no agent can reach: /users/leaderboard 302s to /login, and the MCP
  // leaderboard tool returns at most 50 rows with no total. Requested as an MCP
  // field in operations#571; until that ships, this is a monthly ask.
  { id: "kmikeym-accounts", label: "KmikeyM accounts", weight: 0.35 },
  { id: "substack", label: "Substack", weight: 0.30 },
  // FOLLOWERS, not connections, consistent with every other input. The profile
  // shows both under the headline: on 2026-10-01, 2,400 followers and 2,108
  // connections. The series has always been followers (Mike's sheet: 2,177 at
  // the Oct 2025 baseline, ~+20/mo since).
  // ⚠️ The 2026-09-01 row used 3,389. LinkedIn's own follower export
  // (2026-07-04..10-01) shows no jump: 21 new followers in August, max 8 in a
  // day, ~2,381 on 9/04. Suspected cause (Mike): a spam-account wave later
  // scrubbed from LinkedIn's record. Also noted: Substack read 3,387 the same
  // day. The row is published and stays as filed; the 2026-10-01 note discloses.
  // Always read the number labelled "followers" and diff it against the sheet.
  { id: "linkedin", label: "LinkedIn", weight: 0.09 },
  { id: "x", label: "X", weight: 0.09 },
  { id: "instagram", label: "Instagram", weight: 0.07 },
  { id: "youtube", label: "YouTube", weight: 0.04 },
  { id: "bluesky", label: "Bluesky", weight: 0.02 },
  { id: "mastodon", label: "Mastodon", weight: 0.01 },
  { id: "kmikeym-linkedin-biz", label: "KmikeyM LinkedIn (business)", weight: 0.01 },
  { id: "facebook-personal", label: "Facebook (personal)", weight: 0.01 },
  { id: "kmikeym-facebook-biz", label: "KmikeyM Facebook (business)", weight: 0.01 },
];

/**
 * The October 2025 composite, frozen as the index anchor.
 *
 * A baseline is set once and never recomputed (STANDARDS.md §8) — re-deriving it
 * from later data would silently re-scale every historical value and break
 * comparability with every already-published report.
 */
export const SCI_BASELINE = 3041.9;

/**
 * Combine per-platform follower counts into the raw composite.
 *
 * Unknown and missing platforms both throw. A missing count would otherwise be
 * treated as zero followers and read as a genuine audience collapse — exactly
 * the "no data" vs "scored zero" confusion STANDARDS.md §6 forbids. An unknown
 * key almost always means a platform was added upstream without being weighted
 * here, and silently dropping it would understate the index with no signal.
 */
export function weightedComposite(counts: Record<string, number>): number {
  const known = new Set(SCI_WEIGHTS.map((w) => w.id));

  const unknown = Object.keys(counts).filter((id) => !known.has(id));
  if (unknown.length) {
    throw new Error(`sci: unknown platform(s): ${unknown.join(", ")}`);
  }

  const missing = SCI_WEIGHTS.filter((w) => typeof counts[w.id] !== "number").map((w) => w.id);
  if (missing.length) {
    throw new Error(`sci: missing follower count(s): ${missing.join(", ")}`);
  }

  return SCI_WEIGHTS.reduce((total, w) => total + w.weight * counts[w.id]!, 0);
}

/**
 * Index a raw composite against the October 2025 baseline.
 *
 * This is the stage that was already documented (CLAUDE.md's monthly checklist);
 * it lives here so the write path and the read path share one implementation
 * instead of the formula being retyped each month.
 */
export function sciIndex(raw: number): number {
  return (raw / SCI_BASELINE) * 100;
}

// ===========================================================================
// SCI 2.0 — normalize each platform against its own baseline, then weight.
//
// Adopted 2026-09-22 (operations proposals/rfcs/2026-07-27-sci-2.0-economic-pull-index.md),
// first published in the 2026-11-01 release (operations#688). Everything above this line
// is now SCI Classic: it computed every row in data/social-capital-classic.csv and
// receives no new rows (STANDARDS.md §4).
//
// Why 2.0 exists: Classic weighted RAW counts, so a platform's real influence was its
// size times its weight, and the two biggest audiences held ~78% of the index whatever
// the weights said. 2.0 puts every platform on its own scale first, the way PHI scores
// each metric against its goal, so the weight is the weight.
// ===========================================================================


export interface Sci2Channel {
  id: string;
  /** Live reach, 1-5: a size bucket read off the follower count, adjusted for liveness. */
  reach: number;
  /** Share of the audience who could plausibly become economically involved, 1-5. */
  fit: number;
  /** How short the road from the platform to a dollar, 1-5. */
  path: number;
}

/**
 * The score table as the Board adopted it (RFC "The score table").
 *
 * Weights are a pure function of this table: `w = R·F·P / Σ(R·F·P)`. There is no
 * rounding step and there are no human overrides, so a weight that does not
 * regenerate from these three numbers means the table is wrong. The RFC's check
 * value (2026-07-01 = 104.24) is computed against THIS table; the table in force
 * for publication is `scoreTableAsOf`, which applies the Substack default below.
 */
export const SCI2_ADOPTED_TABLE: readonly Sci2Channel[] = [
  { id: "kmikeym-accounts", reach: 4, fit: 5, path: 5 },
  { id: "substack", reach: 3, fit: 4, path: 3 },
  { id: "linkedin", reach: 2, fit: 4, path: 4 },
  { id: "x", reach: 2, fit: 4, path: 3 },
  { id: "bluesky", reach: 3, fit: 3, path: 2 },
  // Path 2: "it's a long path from IG to a dollar" (Mike, 2026-10-20). The only other
  // Path score with a recorded reason is LinkedIn's 4 (Sorge: a DM becomes a call).
  { id: "instagram", reach: 2, fit: 3, path: 2 },
  { id: "youtube", reach: 2, fit: 3, path: 2 },
  { id: "facebook-personal", reach: 2, fit: 2, path: 2 },
  { id: "kmikeym-linkedin-biz", reach: 1, fit: 3, path: 2 },
  { id: "kmikeym-facebook-biz", reach: 1, fit: 2, path: 2 },
  { id: "mastodon", reach: 1, fit: 2, path: 2 },
];

/**
 * The RFC's self-executing default for Substack.
 *
 * Substack's Reach of 3 rested on no open-rate data, so the RFC set a trigger: re-run
 * the framework with real Substack engagement by 2026-10-31, or Reach drops to 2 by
 * default. Colbert's review required that the default "execute in code, not in this
 * prose" — a rule that only exists in a document is a hidden manual step. No
 * engagement data was filed, so it fired, the day before 2.0's first release; Mike
 * chose to launch on the post-default table rather than change the method twice in
 * two releases (2026-10-20, operations#688).
 *
 * `publishedAsOf` is the date whose table the published series uses. Every row of the
 * series is computed with one table; changing the table is a restatement (§9).
 */
export const SUBSTACK_REACH_DEFAULT = {
  channel: "substack",
  effective: "2026-10-31",
  reach: 2,
  publishedAsOf: "2026-11-01",
} as const;

/** The score table in force on `date` (YYYY-MM-DD). */
export function scoreTableAsOf(date: string): readonly Sci2Channel[] {
  if (date < SUBSTACK_REACH_DEFAULT.effective) return SCI2_ADOPTED_TABLE;
  return SCI2_ADOPTED_TABLE.map((c) =>
    c.id === SUBSTACK_REACH_DEFAULT.channel ? { ...c, reach: SUBSTACK_REACH_DEFAULT.reach } : c,
  );
}

/** Weights as exact fractions `Score / ΣScore`. Compute from scores, never from rounded percentages. */
export function sci2Weights(table: readonly Sci2Channel[]): Record<string, number> {
  const total = table.reduce((a, c) => a + c.reach * c.fit * c.path, 0);
  return Object.fromEntries(table.map((c) => [c.id, (c.reach * c.fit * c.path) / total]));
}

/**
 * Below this many followers the normalizing denominator floors here.
 *
 * Plain normalization makes a platform's sensitivity scale with 1/baseline, so one
 * new Mastodon follower on a base of 26 would move the index more than five Substack
 * subscribers. The floor keeps the numerator real and stops a tiny account swinging
 * the index. 100 is round, not derived, and labelled that way in the RFC. A platform
 * crossing it in either direction changes how it is scored, so every crossing gets a
 * line in that month's note.
 */
export const SCI2_FLOOR = 100;

/** The two rows averaged into each platform's baseline (October and November 2025). */
export const SCI2_BASELINE_DATES = ["2025-10-01", "2025-11-01"] as const;

export interface PlatformRow {
  date: string;
  counts: Record<string, number>;
  source: string;
}

/**
 * Read the per-platform counts behind every SCI 2.0 row.
 *
 * Classic kept only the composite and discarded the eleven inputs, so no published
 * number could be rebuilt from the repo (operations#570). This file is the inputs.
 * It lives in data/inputs/ because it is not a series: the corpus tests that sweep
 * data/*.csv as date,value,notes would misread it. `source` is last so it may hold
 * commas.
 */
export async function loadPlatformCounts(
  file = path.join(process.cwd(), "data", "inputs", "sci-platforms.csv"),
): Promise<PlatformRow[]> {
  const lines = (await fs.readFile(file, "utf-8")).trim().split("\n");
  const ids = lines[0]!.split(",").slice(1, -1);
  return lines.slice(1).map((line) => {
    const f = line.split(",");
    const counts = Object.fromEntries(ids.map((id, i) => [id, Number(f[i + 1])]));
    for (const [id, n] of Object.entries(counts)) {
      if (!Number.isFinite(n)) throw new Error(`sci: non-numeric ${id} count in row ${f[0]}`);
    }
    return { date: f[0]!, counts, source: f.slice(ids.length + 1).join(",") };
  });
}

/**
 * Each platform's baseline: the mean of its October and November 2025 counts.
 *
 * Frozen by definition: these two rows never change, so the baseline cannot drift.
 * Re-anchoring it (the RFC suggests an annual review) is a versioned event, not an edit.
 */
export function sci2Baseline(rows: PlatformRow[]): Record<string, number> {
  const picked = SCI2_BASELINE_DATES.map((d) => {
    const r = rows.find((x) => x.date === d);
    if (!r) throw new Error(`sci: baseline row ${d} is missing from the platform counts`);
    return r.counts;
  });
  return Object.fromEntries(Object.keys(picked[0]!).map((id) => [id, (picked[0]![id]! + picked[1]![id]!) / 2]));
}

/**
 * SCI 2.0 for one row: normalize each platform, then take the weighted sum.
 *
 *   Norm = (count − baseline) / max(baseline, 100) × 100 + 100
 *   SCI  = Σ Norm × w
 *
 * Every platform is 100 at its baseline, so the index is 100 there. Missing and
 * unknown platforms throw for the same reason as Classic's `weightedComposite`: a
 * dropped input would read as an audience collapse (STANDARDS.md §6).
 */
export function sci2Index(
  counts: Record<string, number>,
  baseline: Record<string, number>,
  weights: Record<string, number>,
): number {
  const known = Object.keys(weights);
  const unknown = Object.keys(counts).filter((id) => !(id in weights));
  if (unknown.length) throw new Error(`sci: unknown platform(s): ${unknown.join(", ")}`);
  const missing = known.filter((id) => typeof counts[id] !== "number");
  if (missing.length) throw new Error(`sci: missing follower count(s): ${missing.join(", ")}`);
  return known.reduce((sum, id) => {
    const b = baseline[id]!;
    return sum + weights[id]! * (((counts[id]! - b) / Math.max(b, SCI2_FLOOR)) * 100 + 100);
  }, 0);
}
