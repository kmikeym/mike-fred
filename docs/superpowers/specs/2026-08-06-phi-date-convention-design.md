# PHI moves to release-lag dating

**Date:** 2026-08-06
**Author:** Charlie
**Status:** approved, not yet implemented

## The problem

PHI is the only `data-month` series in MIKE. Its row for July's health data is dated
`2026-07-01`, while every other indicator's July reading is dated `2026-08-01`. On the
site this reads as PHI being a month stale next to its five neighbours, and any chart
or reader that lines the six series up by row date has PHI offset by one against
everything else.

Both conventions are legitimate and the API declares which is in play (STANDARDS §3),
so a careful consumer was never misled. The cost is presentational and it is paid on
every visit to the front page.

## The change

PHI adopts the release-lag convention the other five series use. A row dated month N
holds month N−1's data.

### Data

All 43 data rows in `data/phi.csv` shift their date forward one month:

| before | after |
|---|---|
| `2023-01-01` | `2023-02-01` |
| … | … |
| `2026-07-01` | `2026-08-01` |

Values and note text are untouched, byte for byte. The notes never name a month, so
none of them needs rewriting; this was checked across all 43 rows.

`data/phi-classic.csv` is **not** touched. The retired vintage was always release-lag
(`lib/api/vintages.ts`), so it is already aligned.

### Code

`INDICATOR_REGISTRY.phi.dateConvention` becomes `"release-lag"`.

That one field is the whole propagation surface, which is why this change is small.
It is read by the site, by `lib/api/documents.ts` (both the published `date_convention`
and each observation's `period`), by `nextReleaseDate`, and by
`scripts/mike-fred-append-month.sh` via `bun -e`. The write path cannot drift from the
read path because they consult the same value.

`loadPhiOverlap()` in `lib/indicators.ts` currently shifts PHI-Classic back one month
to meet PHI's data-month dating. With both series on release-lag that shim is wrong
and is deleted; the function becomes a plain merge on row date.

The `data-month` machinery stays: the type union, `rowDateForRelease`,
`observationPeriod`, and the append script's month-completeness guard. Deleting it
would strip a guard and a documented API promise for the benefit of a few unused
branches, and a future data-month series would pay to rebuild them.

### The cross-repo piece

`operations/governance/mike-fred/phi/phi_fit.py` is Wooden's PHI generator harness. It
reads this repo's `data/phi.csv` and keys published values by the row date's month:

```python
pub[r[0][:7]] = float(r[1])
```

then joins that map directly against health-archive months extracted from real data
months. After the shift, every comparison in the acceptance test is off by one. It must
subtract a month when building `pub`, and it must land in the same sitting as the CSV
change. This is the only thing in the change that fails silently rather than loudly.

(The harness README says 42 published rows; the file now holds 43, because July shipped
after the harness was written. Do not hardcode either count while fixing the join.)

### Docs

Statements that PHI is the data-month series, in: `STANDARDS.md` §3, `CLAUDE.md`
(three places, including the `phi.csv` table row), `README.md:81`, `data/SOURCES.md`,
the `VINTAGE_META` comment in `lib/api/vintages.ts`, and the explanatory copy in
`components/PhiOverlapChart.tsx`.

`INDICATOR_REGISTRY.phi.calculation` says "Series starts 2023-01". That stays true of
the data and stops being true of the first row date, so it is reworded to name the data.

## Acceptance

The change is correct when all four hold.

1. **The API's semantic output is unchanged.** Capture the built PHI series document
   before the change; after it, every observation's `period` and `value` are identical
   and only `date` has moved. This is the exact contract STANDARDS §3 makes to
   consumers ("align on `period`, never on `date`"), so if it holds, no correct reader
   of the published data sees any change at all.
2. **`bun test` is green**, from a green baseline recorded before any edit.
3. **PHI's `nextUpdate` is still `2026-09-01`.** The derivation counts two periods for
   data-month and one for release-lag, so the advertised date is invariant under this
   change. The suite's "no indicator advertises a next update in the past" check stays
   green.
4. **`phi_fit.py` still reports its pre-change fit statistics.** Same MAE, same worst
   month. A changed number here means the join broke.

## Tests to retarget

About seven expectations name PHI as *the* data-month series, in
`lib/conventions.test.ts`, `lib/release-schedule.test.ts`, and
`lib/api/documents.test.ts`. They are rewritten to exercise the helpers directly rather
than through PHI, so the `data-month` machinery keeps its coverage without pinning PHI
to a convention it no longer uses.

`lib/conventions.test.ts` gains the replacement invariant: **all six series are
release-lag.** That is the assertion which will fail loudly if a seventh series is
added on the other convention without a decision being made.

## Disclosure

None. Mike's call, 2026-08-06: treat this as a display fix. No published value changes,
and the API already declared the convention and published the observation period, so
nothing a correct consumer read has changed. The git history and this document are the
record.

Note that this is a decision about *disclosure*, not about accuracy: the internal docs
listed above are still corrected, because a doc that says PHI is data-month would be
false the moment this ships.

## Rollback

`git revert`. Nothing here is generated, migrated, or written outside version control.
The one manual step is reverting `phi_fit.py` in the operations repo alongside it.

## Recorded, not fixed

The next quarterly report must select PHI's value by observation `period`, not by row
date, or Q3 picks up a neighbouring month. No code does that selection today; the
quarterly JSON snapshots are hand-authored. This is a note for whoever builds Q3, not
work in this change.
