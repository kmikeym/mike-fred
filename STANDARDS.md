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
A second convention, **data-month** dating, puts the row date on the month measured.
PHI 2.0 used it until 2026-08; no series uses it today, and it remains supported.
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
convention was stated in five places and was wrong in three of them. As of 2026-08,
all six series are `release-lag`; PHI moved off `data-month` so the six line up.

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

  The note must also say, in words, that the value is **not a measurement**, and state
  the method and inputs — the marker serves machines, the sentence serves the human
  reading the series page.

  Do not maintain an inventory of marked rows here. This paragraph used to name the one
  row carrying the marker; it was wrong for months while four rows across two live
  series read `Estimated linear growth` and published as measurements (#21). Both rules
  above are swept over every `data/*.csv` by `lib/conventions.test.ts`, which fails the
  build on a violation. A count maintained by hand in prose drifts on the next commit;
  a test does not.
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

### A `derived` series must be derivable *here*

`valueSource: "derived"` is a claim that this repository can compute the value. It is
load-bearing — the monthly append script reads it and refuses to derive a value for an
`external` series (#12) — so it must be true, not aspirational.

Prose in `calculation` does not satisfy it. A formula stated only in prose cannot be
executed, cannot be tested, and drifts: SCI was marked `derived` for months while its
weighting stage existed nowhere in the repo except a sentence naming 5 of 11 platforms
and 2 of 11 weights. Nobody could reproduce a published figure from what was checked in.

So: **if a series is `derived`, its formula lives in `lib/` as tested code**, with
`calculation` describing that code in prose for humans. `lib/sci.ts` is the reference
shape — a weight table, a composite function, an indexing function, and tests that
reproduce every published row from its stored inputs.

### A baseline is frozen

A baseline is captured once and never recomputed (SCI's is `3041.9`, the October 2025
composite). Re-deriving it from later data silently re-scales every historical value and
breaks comparability with every already-published report.

The same applies to anything the baseline was measured *under*. Changing SCI's platform
weights re-scales the series against an anchor captured under the old weighting, so a
weight change is a methodology change requiring a restatement (§9) — never a routine edit.

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

### Withdrawal is a different act from correction

Correction assumes the document should exist and one part of it is wrong. That assumption
fails when a report **should not have been published when it was**. Appending a fourth
addendum to a document whose conclusions have already been overturned does not serve a
reader; it produces a page where the corrections carry the document rather than annotate
it, and the original analysis is still the first thing anyone reads.

So a report may be **withdrawn**, subject to all of the following. Withdrawal is rare by
design and is not a softer form of correction.

1. **The URL keeps serving.** Never 404, never redirect. The address was published and may
   be linked; a reader who follows it is owed an explanation, not a dead end.
2. **A dated statement replaces the document**, saying plainly that it is withdrawn, when,
   and why. The figures and prose stop being served.
3. **Only the analysis is withdrawn, never the data.** Indicator series are published
   separately and keep their own revision history. If withdrawing a report would remove
   the only published home of a number, it is not eligible for withdrawal.
4. **A replacement, if any, gets a new URL and its own publication date.** A reissue must
   not silently occupy the withdrawn document's address.
5. **The decision is recorded**, with who made it and on what grounds.

The trust argument in the previous section still binds, and withdrawal satisfies it
differently: a reader who remembers the report finds an honest account of its removal
rather than a quietly altered version of what they read. What is forbidden is the
document disappearing without a word.

**First use: Q2 2026, withdrawn 2026-08-06 on Mike's instruction.** Published July 4,
eleven days ahead of the fixed cadence and before June's figures had settled. It had
accumulated three addenda in a month, including a restatement of every Health Index
figure, and its central claim that the quarter was the strongest on record had not
survived. This clause was written in the same commit that withdrew it rather than
afterwards, because a rule invented to justify an action already taken is not a rule.

**Published prose lives with the report's data, never in a component.** A report's
title, dates, card blurb and summary belong in `data/quarterly/<id>.json`, not in a
constant inside a page. Text duplicated into a component cannot be corrected by the
addendum mechanism above, and it drifts: this metadata previously existed in the JSON
*and* in two hand-maintained `REPORTS` constants, the JSON copy went unread and
diverged from the rendered text in three of six reports, and both component copies
went stale together twice when a figure was restated (#13).

One exception, deliberate: **navigation and teaser copy is written fresh, not
inherited from a published summary.** A report's summary is frozen as published, so
piping it into a homepage teaser would resurface superseded figures — the Q2 2026
summary still reads "PHI set three straight all-time highs (119.5)", which is
correct as history and wrong as a current claim.

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
