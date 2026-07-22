# MIKE Data Standards

Normative conventions for MIKE economic data — the CSVs, the quarterly reports, and the
machine-readable API at `/api/v1/`.

**This document is the rule; the code implements it.** If `scripts/build-api.ts` or a CSV
disagrees with this file, the code is wrong. Read this before adding an indicator, a data
column, or an API field, and update it in the same commit as the change.

Status: **draft** — ratified conventions, API not yet built. See issue #6.

---

## 1. Scope and audience

MIKE publishes the same data twice:

| Surface | Audience | Format |
|---|---|---|
| `mike.quarterly.systems` | humans | HTML, charts, quarterly reports |
| `/api/v1/` | agents, scripts, LLMs | JSON + JSON Schema |

Both are generated from one source of truth (`data/*.csv` + `lib/indicators.ts`) in one
build. A machine surface that is hand-maintained alongside the site will drift from it;
this has already happened once (see §9).

---

## 2. Document envelope

Every JSON document served under `/api/v1/` carries:

```json
{
  "schema_version": "1.0.0",
  "generated_at": "2026-07-22T00:00:00Z",
  "commit": "4372959",
  "license": "CC0-1.0",
  "docs": "https://mike.quarterly.systems/api"
}
```

- `schema_version` — semver for the document schema, not the data.
- `generated_at` — ISO 8601 UTC, build time.
- `commit` — git SHA the build was cut from. Makes any published number reproducible
  against git history, and lets a consumer cite a specific vintage of the whole dataset.
- `license` — see §10.

---

## 3. Dates are never ambiguous

MIKE publishes on a **release lag**: a release dated month N reports month N−1's actuals.
PHI 2.0 instead uses **data-month** dating, where the row date is the month measured.
Both conventions are legitimate; leaving a consumer to guess which is in play is not.

**Every series declares its convention. Every observation carries both dates.**

```json
{
  "date_convention": "release-lag",
  "observations": [
    { "date": "2026-07-01",
      "period": { "start": "2026-06-01", "end": "2026-06-30" },
      "value": 83.75,
      "notes": "Severe drop: XCOM2 + Claude Code customizations" }
  ]
}
```

- `date` — when the value was published (the CSV row date).
- `period` — the span the value actually measures.

`date_convention` is one of `release-lag` | `data-month`. Consumers comparing series
MUST align on `period`, never on `date`.

**The authoritative declaration is `INDICATOR_REGISTRY[id].dateConvention`** in
`lib/indicators.ts` — typed data, read by the site, the monthly append script, and
(under issue #6) the API. It is typed rather than prose because prose drifted: the
convention was stated in five places and was wrong in three of them. As of 2026-07,
PHI is the only `data-month` series; the other five are `release-lag`.

A related field, `valueSource`, declares whether this repository can compute a
series' value (`derived`) or must be handed one (`external`). The write path
refuses to derive a value for an `external` series, which is what prevents a
retired formula being used to produce a current-index row.

All timestamps are ISO 8601. All dates are rendered timezone-independently — never
via `new Date("YYYY-MM-DD").toLocaleDateString()`, which parses as UTC midnight and
then formats locally, shifting the day (and, for month-start data, the month).

---

## 4. Vintages

When an indicator's methodology is rebuilt, the old series is **preserved, not
overwritten**. The superseded series is kept in full and the current series points
at it:

```json
"vintages": [
  { "id": "phi-classic",
    "superseded_on": "2026-07-04",
    "reason": "Rebuilt on Apple Watch recovery/sleep/activity/fitness data (PHI 2.0)",
    "url": "/api/v1/series/phi-classic.json" }
]
```

A vintage is a full series document in its own right and follows every rule here.

A vintage is **closed**: it keeps its published observations and receives no new ones.
Where it is reachable depends on what exists — today PHI-Classic is published as
`data/phi-classic.csv` and rendered in the PHI 2.0 methodology comparison; it has no
series page. Under issue #6 the `url` above becomes a real endpoint. Do not describe a
vintage as "available" at a location that does not serve it.

Rationale: revisions are normal in economic data — this is why FRED has ALFRED. Without
vintages, a methodology change silently rewrites history, and any agent that cached the
old numbers now disagrees with the source for reasons it cannot discover.

---

## 5. Identity

- Series IDs are **permanent**. `ppi` means Personal Productivity Index forever.
- IDs are lowercase kebab-case, stable across renames. `title` may change freely.
- A retired ID is **never** reused for a different meaning.
- Adding a new indicator means adding a registry entry; it appears in the API
  automatically, with no second edit anywhere.

---

## 6. Values

- Numbers are JSON numbers, never strings.
- `NaN` and `Infinity` are forbidden — both are invalid JSON and break strict parsers.
- A missing observation has `"value": null`. It is **never** omitted and **never** `0`.
  "No data" and "scored zero" must stay distinguishable.
- An **estimated** value — interpolated, back-filled, or otherwise not measured — MUST
  begin its note with `ESTIMATED` and state the method and inputs. Prefer `null` where a
  gap is acceptable; estimate only when a break would misrepresent a series (for example
  a hole in a chart implying a collapse rather than a missing reading). The marker exists
  so an estimate is detectable by machine, not only by a human reading prose: an
  unflagged interpolation is indistinguishable from a measurement, which is worse than
  an honest gap.

  Currently one row carries this marker: `phi-classic.csv` `2026-03-01` (February 2026,
  never recorded — the row originally duplicated March).
- Rounding is stated in the series metadata, not applied silently.

---

## 7. Notes

- Free-text UTF-8. May contain commas, em-dashes, semicolons, any punctuation.
- May be `null`. Never an empty string.
- **Never truncated.** Note text MUST round-trip byte-for-byte from the CSV to the API.

This is enforced by a build check, because it has failed before: positional
`split(",")` parsing silently cut every note at its first comma, and the monthly append
script worked around it by rewriting commas as semicolons — corrupting prose to fit a
parser bug. See issue #2.

---

## 8. Provenance

Every series states enough for an agent to explain a number, not merely repeat it:

- `unit` — e.g. `Index (2025 avg = 100)`
- `baseline` — what 100 means and when it was set
- `calculation` — the formula in prose
- `source` — where the raw input came from (RescueTime, Apple Health, …)
- `frequency` — `daily` | `weekly` | `monthly` | `quarterly`

---

## 9. Evolution

**Additive changes are free.** Adding a field is non-breaking and needs no version bump;
consumers must ignore unknown fields.

**Breaking changes get a new path.** Removing a field, changing its type, or changing what
it means requires `/api/v2/`, served alongside v1 during a stated overlap.

**Nothing vanishes silently.** Retired fields and series are marked `"deprecated": true`
with a `sunset` date before removal.

**Published reports are corrected by addition, never by edit.** Once a quarterly report is
published, its figures and prose are permanent. When a number is later restated — a
methodology rebuild, a baseline rebase — or an outright error is found, it is disclosed by
appending a dated addendum, not by changing what the report said.

This holds for plain factual errors too, not only for restatements. There is no exception
for "that sentence was a fact rather than analysis", because deciding which sentences
qualify is a judgment call that gets applied inconsistently. One rule: add, never swap.

The reason is a reader's trust, not archival purity. Someone who remembers what a report
said must still find it saying that; silently corrected history makes a reader doubt their
own memory, which costs more than the wrong number did. Accept the odd-looking result —
a report may show a figure alongside an addendum explaining that the figure is superseded.

The single exception is a **methodology document**, which exists to describe the current
method rather than to record a past view. A wrong number there is a bug; fix it directly.

**Derived beats hand-maintained.** Any value that *can* be computed from the data MUST be,
rather than hardcoded. `nextUpdate` was hand-typed in six registry entries, drifted, and
told the public for weeks that PHI updates in October 2026 (issue #4). Every hardcoded
date is a future inconsistency.

---

## 10. Licensing

Everything in this repository — data and code — is released under **CC0-1.0**: public
domain, no conditions, no attribution required. Copy it, fork it, build on it, sell it.
No permission needed.

- **Data** (`data/**`, everything under `/api/`): CC0-1.0. Matches the norm for public
  statistical data.
- **Code**: CC0-1.0. Noted trade-off: some corporate open-source policies disallow
  CC0-licensed *software* because CC0 expressly declines to grant patent rights, where
  MIT is silent on them. If broad corporate reuse ever becomes a goal, relicensing the
  code half to MIT is the conventional fix.

---

## 11. Compatibility promise

Within a major version, MIKE will not:

- rename or repurpose a series ID
- change the meaning of an existing field
- remove a field without a deprecation period
- alter a historical value without publishing the prior series as a vintage

MIKE makes **no** uptime or latency guarantee. The API is static JSON on a CDN; treat it
as files, cache it freely, and expect it to change only when a build runs.

---

## 12. Checklist: adding a new indicator

1. Add the CSV to `data/`, following §3 (declare the date convention) and §7 (notes).
2. Add the `INDICATOR_REGISTRY` entry with full §8 provenance.
3. Confirm no hardcoded dates were introduced (§9).
4. Run the build; the validator confirms the new series appears in the API.
5. Update this document if the addition introduced a new convention.
