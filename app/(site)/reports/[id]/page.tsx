import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { loadAllIndicators, loadQuarterlySnapshot, formatValue, formatChangePercent, loadQuarterlyNarrative, loadPhiOverlap, loadReport, loadReportIndex } from "@/lib/indicators";
import type { ReportUpdate } from "@/lib/types";
import YoYChart, { type YoYIndicator } from "@/components/YoYChart";
import PhiOverlapChart from "@/components/PhiOverlapChart";
import TravelMap from "@/components/TravelMap";
import QuarterChart from "@/components/QuarterChart";
import { INDICATOR_REGISTRY } from "@/lib/indicators";
import type { IndicatorId } from "@/lib/types";

interface YoYComparison {
  previousQuarter: string;
  currentQuarter: string;
  indicators: YoYIndicator[];
}

interface NarrativeSection {
  title: string;
  body: string;
  yoyComparison?: YoYComparison;
  // Names a server-rendered figure for this section. Figures are components,
  // not data, so the JSON carries only an id and the page maps it.
  graphic?: string;
  // Names the indicator this section is about, so the page can chart the
  // quarter's months (frozen in the snapshot) under the heading.
  indicator?: IndicatorId;
  // One short paragraph: the acronym, what the series measures, how it is
  // computed. Frozen in the snapshot because methods change (PHI 2.0 did).
  about?: string;
  // A question-and-answer section: `lead` above, one block per question
  // (bold question, verdict, answer), then `body` as the closing paragraph.
  lead?: string;
  qa?: { question: string; verdict: string; answer: string }[];
}

// Highlight cards quote the number the prose quotes: 93.75, 101.23, 15, not
// the series page's one-decimal display (93.8, 101.2, 15.0). So format at the
// precision the snapshot value itself carries. Percentages keep at least one
// decimal so +35 reads as +35.0% like the scorecard.
const atOwnPrecision = (v: number, min = 0) => {
  const d = Math.max(min, Math.min(2, (String(v).split(".")[1] ?? "").length));
  return v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
};

const SECTION_GRAPHICS: Record<string, React.ComponentType> = {
  "q3-2026-travel": TravelMap,
};

interface PageProps {
  params: Promise<{ id: string }>;
}

// Report metadata lives in data/quarterly/*.json, not here — see loadReportIndex
// for why (#13).

export async function generateStaticParams() {
  return (await loadReportIndex()).map(({ id }) => ({ id }));
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const report = await loadReport(id);

  if (!report) {
    notFound();
  }

  // A withdrawn report serves its statement and nothing else. We deliberately do
  // NOT 404 or redirect: the URL was published and may be linked, so a reader who
  // follows it is owed an explanation rather than a dead end. See STANDARDS.md §9,
  // where withdrawal is defined as distinct from correction.
  if (report.withdrawn) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/reports" className="hover:text-gray-700">Reports</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{report.quarter}</span>
        </div>

        <div className="fed-document">
          <div className="text-center mb-10 pb-8 border-b-2 border-gray-300">
            <div className="text-sm text-gray-500 mb-2">MIKE ECONOMIC DATA</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {report.quarter}: Report Withdrawn
            </h1>
            <div className="text-lg text-gray-600">
              Withdrawn: {formatDate(report.withdrawn.date)}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-300 border-l-4 border-l-amber-500 p-6 print:border-black">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-3">
              Notice
            </div>
            <div className="text-gray-800 leading-relaxed whitespace-pre-line">
              {report.withdrawn.statement}
            </div>
          </div>

          <p className="mt-8 text-sm text-gray-600">
            The underlying indicator data was not withdrawn. It remains available on the{" "}
            <Link href="/" className="text-primary hover:text-accent font-medium">
              indicator pages
            </Link>
            , each carrying its own revision history.
          </p>
        </div>
      </main>
    );
  }

  // Load quarterly snapshot data and narrative
  // A published report shows the values frozen at publication, so it reads as a
  // record rather than a dashboard. `null` means this document has no snapshot
  // and wants live values — the PHI 2.0 methodology report is the only one, since
  // it describes the index as it stands now rather than reporting a quarter.
  // A corrupt snapshot now throws rather than landing here; see loadQuarterlySnapshot.
  const snapshotData = await loadQuarterlySnapshot(id);
  const indicators = snapshotData || await loadAllIndicators();
  const narrative = await loadQuarterlyNarrative(id);
  const overlap = id === "phi-2.0-methodology" ? await loadPhiOverlap() : null;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/reports" className="hover:text-gray-700">Reports</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{report.quarter}</span>
      </div>

      {/* Header */}
      <div className="fed-document">
        <div className="text-center mb-12 pb-8 border-b-2 border-gray-300">
          <div className="text-sm text-gray-500 mb-2">MIKE ECONOMIC DATA</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{report.title}</h1>
          <div className="text-lg text-gray-600">
            For Release: {formatDate(report.publishedDate)}
          </div>
        </div>

        {/* Dated addenda. Published figures are never edited — a restatement or
            correction is disclosed by appending an entry here (see #11). Placed
            directly under the masthead so a reader meets it before the original
            analysis, and visually distinct so it never reads as original text. */}
        {narrative?.updates && narrative.updates.length > 0 && (
          <section className="mb-12">
            {narrative.updates.map((u: ReportUpdate, i: number) => (
              <div
                key={i}
                className="bg-amber-50 border border-amber-300 border-l-4 border-l-amber-500 p-6 mb-4 print:border-black"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                    Update
                  </span>
                  <time dateTime={u.date} className="text-sm text-amber-800">
                    {formatDate(u.date)}
                  </time>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{u.title}</h3>
                <div className="text-gray-800 leading-relaxed whitespace-pre-line">{u.body}</div>
                {u.link && (
                  <Link
                    href={u.link.href}
                    className="inline-block mt-3 text-sm font-medium text-primary hover:text-accent"
                  >
                    {u.link.label} →
                  </Link>
                )}
              </div>
            ))}
            <p className="text-xs text-gray-500 italic">
              Figures below are as originally published. Updates above describe subsequent
              restatements and corrections.
            </p>
          </section>
        )}

        {/* Executive Summary */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
            Executive Summary
          </h2>
          {/* A report may now carry updates without a narrative block (the 2025
              quarters), so key the fallback on the summary itself, not on
              `narrative` being present. */}
          {narrative?.executiveSummary ? (
            <div className="text-lg text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
              {narrative.executiveSummary}
            </div>
          ) : (
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {report.summary}
            </p>
          )}
          {/* Highlights as a card grid, one per indicator, when the report
              supplies them (first: q3-2026). The frozen scorecard values supply
              the number and change; the card carries the one-line story. */}
          {narrative?.highlightCards ? (
            <div className="mb-6">
              <p className="text-gray-800 mb-4">
                <strong>Key Highlights:</strong> {narrative.highlightCards.lead}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {narrative.highlightCards.cards.map((card: { indicator: IndicatorId; headline: string }) => {
                  const meta = INDICATOR_REGISTRY[card.indicator];
                  const ind = indicators.find((i) => i.id === card.indicator);
                  if (!meta || !ind) return null;
                  const up = ind.changePercent > 0, down = ind.changePercent < 0;
                  return (
                    <div key={card.indicator} className="bg-white border border-gray-200 rounded-lg p-4 print:border-black">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">{meta.shortTitle}</span>
                      </div>
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-2xl font-bold text-gray-900">{atOwnPrecision(ind.currentValue)}</span>
                        <span className={`text-sm font-semibold ${up ? "text-green-600" : down ? "text-red-600" : "text-yellow-600"}`}>
                          {up ? "↑" : down ? "↓" : "→"} {up ? "+" : ""}{atOwnPrecision(ind.changePercent, 1)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-snug">{card.headline}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
          <div className="bg-blue-50 border-l-4 border-primary p-6 mb-6">
            <p className="text-gray-800">
              <strong>Key Highlights:</strong>
            </p>
            {narrative?.highlights?.length ? (
              <ul className="mt-3 space-y-1 text-gray-800">
                {narrative.highlights.map((h: string, i: number) => (
                  <li key={i}>• {h}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-800 mt-2">{report.summary}</p>
            )}
          </div>
          )}
        </section>

        {/* Editorial note. Context a reader needs before the analysis (how this
            report relates to a prior one, a cadence change) that is not itself a
            finding. Boxed and small so it reads as a note, not as a section, and
            distinct from the amber addenda above, which record changes made after
            publication. Optional: most reports carry none. */}
        {narrative?.note && (
          <aside className="mb-12 bg-gray-50 border border-gray-300 border-l-4 border-l-gray-500 p-5 text-sm print:border-black">
            {narrative.note.title && (
              <h3 className="font-semibold text-gray-900 mb-2">{narrative.note.title}</h3>
            )}
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">{narrative.note.body}</div>
          </aside>
        )}

        {/* PHI overlap chart (methodology report only) */}
        {overlap && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-300">
              Old PHI vs. New PHI
            </h2>
            <PhiOverlapChart data={overlap} />
          </section>
        )}

        {/* Narrative Analysis Sections */}
        {narrative?.sections && narrative.sections.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-300">
              Detailed Analysis
            </h2>
            <div className="space-y-10">
              {narrative.sections.map((section: NarrativeSection, i: number) => (
                <div key={i}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h3>
                  {section.about && (
                    <aside className="mb-4 bg-gray-50 border border-gray-300 border-l-4 border-l-gray-500 px-4 py-3 text-sm print:border-black">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                        What it measures
                      </div>
                      <div className="text-gray-700 leading-relaxed">{section.about}</div>
                    </aside>
                  )}
                  {section.indicator && narrative?.indicators?.[section.indicator]?.months && (
                    <QuarterChart
                      months={narrative.indicators[section.indicator].months}
                      meta={INDICATOR_REGISTRY[section.indicator]}
                      quarter={report.quarter}
                    />
                  )}
                  {section.yoyComparison && (
                    <YoYChart
                      indicators={section.yoyComparison.indicators}
                      previousQuarter={section.yoyComparison.previousQuarter}
                      currentQuarter={section.yoyComparison.currentQuarter}
                    />
                  )}
                  {/* A section figure sits in a right sidebar on wide screens and
                      stacks above the text on narrow ones. The travel map is tall
                      and narrow, so inline it would push the prose a screen down. */}
                  {section.graphic && SECTION_GRAPHICS[section.graphic] ? (
                    (() => {
                      const G = SECTION_GRAPHICS[section.graphic]!;
                      return (
                        <div className="md:flex md:gap-8 md:items-start">
                          <div className="text-gray-700 leading-relaxed whitespace-pre-line md:flex-1">
                            {section.body}
                          </div>
                          <div className="mt-6 md:mt-0 md:w-56 md:shrink-0">
                            <G />
                          </div>
                        </div>
                      );
                    })()
                  ) : section.qa ? (
                    <div className="text-gray-700 leading-relaxed">
                      {section.lead && <p className="mb-5">{section.lead}</p>}
                      <div className="space-y-5 mb-6">
                        {section.qa.map((item, j) => (
                          <div key={j} className="border-l-4 border-gray-300 pl-4">
                            <div className="flex flex-wrap items-baseline gap-x-3 mb-1">
                              <span className="text-lg font-bold text-gray-900">{item.question}</span>
                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 bg-gray-100 border border-gray-300 rounded px-2 py-0.5">
                                {item.verdict}
                              </span>
                            </div>
                            <p>{item.answer}</p>
                          </div>
                        ))}
                      </div>
                      <div className="whitespace-pre-line">{section.body}</div>
                    </div>
                  ) : (
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {section.body}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Indicator Performance Table (skipped for the PHI methodology report) */}
        {id !== "phi-2.0-methodology" && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-300">
            Indicator Scorecard
          </h2>

          <div className="space-y-4">
            {indicators.filter(ind => ind.currentValue !== 0 || ind.data.length > 0).map((indicator) => (
              <div key={indicator.id} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{indicator.shortTitle}</h3>
                    <p className="text-sm text-gray-500">{indicator.category}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatValue(indicator.currentValue, indicator.id)}
                    </div>
                    <div className={`text-sm font-semibold ${
                      indicator.changePercent > 0 ? "text-green-600" :
                      indicator.changePercent < 0 ? "text-red-600" :
                      "text-yellow-600"
                    }`}>
                      {indicator.changePercent > 0 ? "↑" : indicator.changePercent < 0 ? "↓" : "→"}{" "}
                      {formatChangePercent(indicator.changePercent)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Strategic Outlook */}
        {narrative?.outlook ? (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
              {narrative.outlook.title}
            </h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {narrative.outlook.body}
            </div>
          </section>
        ) : (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
              Strategic Outlook
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {report.summary}
            </p>
          </section>
        )}

        {/* Methodology */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
            Methodology & Data Sources
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            MIKE Economic Data tracks six indicators across productivity, financial, health, social, and intellectual
            domains. Raw data is collected monthly in CSV format, normalized against established baselines, and
            snapshotted quarterly for historical comparison. All source data and transformation logic is open-source
            and publicly auditable.
          </p>
          <div className="bg-blue-50 border-l-4 border-primary p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Open Data</h3>
            <div className="flex flex-col space-y-2 text-sm">
              <a href="https://github.com/kmikeym/mike-fred/tree/main/data" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent font-medium">→ Source Data (CSV)</a>
              <a href="https://github.com/kmikeym/mike-fred/tree/main/data/quarterly" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent font-medium">→ Quarterly Snapshots (JSON)</a>
              <a href="https://github.com/kmikeym/mike-fred" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent font-medium">→ Full Repository</a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t-2 border-gray-300">
          <p className="text-sm text-gray-600 mb-2">
            © 2025 MIKE Economic Data. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            A <Link href="https://quarterly.systems" className="text-primary hover:underline">Quarterly Systems</Link> project
          </p>
        </div>
      </div>
    </main>
  );
}
