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
  // FOLLOWERS, not connections — consistent with every other input, which all
  // measure an audience. Confirmed by Mike 2026-09-04 (operations#572, closed:
  // an earlier reading had this as connections and proposed a year-end switch;
  // there was nothing to switch). On that date: 3,389 followers, 2,101
  // connections. Using connections would have shown a 12% one-month decline to
  // below the October 2025 baseline, which is not a thing LinkedIn connections do.
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
