import { INDICATOR_REGISTRY } from "@/lib/indicators";
import type { VintageRef } from "./types";

/**
 * Metadata for retired series that live as a CSV but have no INDICATOR_REGISTRY
 * entry. PHI-Classic is the legacy sleep/activity/weight index, frozen when PHI
 * 2.0 shipped (STANDARDS.md §4). Its convention is release-lag (a row dated
 * month N holds month N-1 data), which PHI 2.0 also adopted in 2026-08.
 */
export const VINTAGE_META: Record<
  string,
  {
    title: string;
    unit: string;
    frequency: string;
    category: string;
    source: string;
    calculation: string | null;
    baseline: number | null;
    date_convention: "release-lag" | "data-month";
  }
> = {
  "phi-classic": {
    title: "Personal Health Index — Classic (retired)",
    unit: "Index (legacy scale)",
    frequency: "monthly",
    category: "Health & Wellness",
    source: "Manual sleep/activity/weight tally",
    calculation: "sleep% × 0.4 + activity% × 0.35 + weight% × 0.25 (retired 2026-07)",
    baseline: null,
    date_convention: "release-lag",
  },
  // Frozen at the 2026-11-01 release, when SCI 2.0 replaced it (operations#688). Every
  // row stays exactly as published, including the 2026-09-01 LinkedIn reading that the
  // October note corrected: a vintage records what was said, not what is now believed.
  "social-capital-classic": {
    title: "Social Capital Index — Classic (retired)",
    unit: "Index (Oct 2025 composite = 100)",
    frequency: "monthly",
    category: "Social",
    source: "Follower counts across 11 platforms (manual + platform pages)",
    calculation:
      "Weighted mean of raw follower counts (KmikeyM accounts 0.35, Substack 0.30, LinkedIn 0.09, X 0.09, Instagram 0.07, YouTube 0.04, five small platforms 0.02 to 0.01), indexed to the October 2025 composite (3041.9) = 100. Retired 2026-11: weighting raw counts let the largest audiences dominate whatever the weights said.",
    baseline: 100,
    date_convention: "release-lag",
  },
};

/** The vintages a current series supersedes. */
export function vintagesFor(seriesId: string): VintageRef[] {
  if (seriesId === "phi") {
    return [
      {
        id: "phi-classic",
        superseded_on: "2026-07-04",
        reason: "Rebuilt on Apple Watch recovery/sleep/activity/fitness data (PHI 2.0)",
        url: "/api/v1/series/phi-classic.json",
      },
    ];
  }
  if (seriesId === "social-capital") {
    return [
      {
        id: "social-capital-classic",
        superseded_on: "2026-11-01",
        reason: "Rebuilt as SCI 2.0: each platform normalized to its own Oct-Nov 2025 baseline before weighting, with weights derived from a published Reach × Fit × Path score table",
        url: "/api/v1/series/social-capital-classic.json",
      },
    ];
  }
  return [];
}

export function isVintage(id: string): boolean {
  return id in VINTAGE_META;
}

/** Every fetchable series id: current indicators plus retired vintages. */
export const ALL_SERIES_IDS: string[] = [
  ...Object.keys(INDICATOR_REGISTRY),
  ...Object.keys(VINTAGE_META),
];
