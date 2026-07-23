import { INDICATOR_REGISTRY } from "@/lib/indicators";
import type { VintageRef } from "./types";

/**
 * Metadata for retired series that live as a CSV but have no INDICATOR_REGISTRY
 * entry. PHI-Classic is the legacy sleep/activity/weight index, frozen when PHI
 * 2.0 shipped (STANDARDS.md §4). Its convention is release-lag (a row dated
 * month N holds month N-1 data), unlike PHI 2.0's data-month dating.
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
};

/** The vintages a current series supersedes. */
export function vintagesFor(seriesId: string): VintageRef[] {
  if (seriesId === "phi") {
    return [
      {
        id: "phi-classic",
        superseded_on: "2026-07-04",
        reason: "Rebuilt on Apple Watch recovery/sleep/activity/fitness data (PHI 2.0)",
        url: "/api/v1/series/phi-classic",
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
