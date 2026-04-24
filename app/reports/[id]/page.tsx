import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { loadAllIndicators, loadQuarterlySnapshot, formatValue, formatChangePercent, loadQuarterlyNarrative } from "@/lib/indicators";
import YoYChart, { type YoYIndicator } from "@/components/YoYChart";

interface YoYComparison {
  previousQuarter: string;
  currentQuarter: string;
  indicators: YoYIndicator[];
}

interface NarrativeSection {
  title: string;
  body: string;
  yoyComparison?: YoYComparison;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const REPORTS = {
  "q1-2026": {
    id: "q1-2026",
    quarter: "Q1 2026",
    title: "State of the MIKE Economy - Q1 2026",
    publishedDate: "2026-04-25",
    summary: "Strongest quarter in the dataset. Five of six indicators advanced; three set all-time records. PWI averaged 143.5 (+193% vs Q4) — 'degen quarter' confirmed as sustained regime. PWI tripled from Q4 close (58.6) to Q1 close (189.1), up 223% over the quarter. PHI hit 93.5 in March (all-time high). PPI held above baseline at 102.5 average through international relocation. Knowledge base added 1,104 notes (+31.7%). SCI finally broke 101. Only LMV retreated — attributable to Kosovo departure logistics.",
  },
  "q4-2025": {
    id: "q4-2025",
    quarter: "Q4 2025",
    title: "State of the MIKE Economy - Q4 2025",
    publishedDate: "2026-01-15",
    summary: "Recovery and stabilization quarter. Productivity eased from Q3 peak to baseline (100, -4.8%), while wealth surged +155.9% to 58.6 as employment income took hold. Longform Media Velocity exploded +220% to 16 points (best month of 2025). Knowledge base grew 16.2% to 3,482 notes. Health improved 5% to 75.0. Social capital held steady. First full quarter with all six indicators tracking.",
  },
  "q3-2025": {
    id: "q3-2025",
    quarter: "Q3 2025",
    title: "State of the MIKE Economy - Q3 2025",
    publishedDate: "2025-10-15",
    summary: "High-growth productivity quarter with major financial restructuring. PPI surged +6.3% to 105 (peak 2025 performance, averaging 101.67), PWI declined -61.4% to 22.9 (August debt refactoring, stabilized with full-time employment), Longform Media Velocity dropped -50% to 5 points (4 pts/month average - focus shifted to career momentum). Quarter marked by productivity peak, financial reset for stability, and reduced leisure engagement.",
  },
  "q2-2025": {
    id: "q2-2025",
    quarter: "Q2 2025",
    title: "State of the MIKE Economy - Q2 2025",
    publishedDate: "2025-07-15",
    summary: "Stabilization quarter following Q1 employment transition. PPI flat at 98.75 (stable productivity averaging 97.92), PWI recovered +6.5% to 59.3 (volatile April spike from shareholder purchase), Longform Media Velocity strong at 12 points/month average. Foundation solidified with contract work focus and consistent intellectual engagement.",
  },
  "q1-2025": {
    id: "q1-2025",
    quarter: "Q1 2025",
    title: "State of the MIKE Economy - Q1 2025",
    publishedDate: "2025-04-15",
    summary: "Transitional quarter marked by employment change and strategic repositioning. PPI averaged 95.8 (volatile: 102.5→86.3→98.8), PWI declined -22% (employment transition), Longform Media Velocity strong at 11.3 points/month average. Foundation-setting period with mixed productivity signals and financial adjustment.",
  },
};

export async function generateStaticParams() {
  return Object.keys(REPORTS).map((id) => ({ id }));
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const report = REPORTS[id as keyof typeof REPORTS];

  if (!report) {
    notFound();
  }

  // Load quarterly snapshot data and narrative
  const snapshotData = await loadQuarterlySnapshot(id);
  const indicators = snapshotData || await loadAllIndicators();
  const narrative = await loadQuarterlyNarrative(id);

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

        {/* Executive Summary */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
            Executive Summary
          </h2>
          {narrative ? (
            <div className="text-lg text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
              {narrative.executiveSummary}
            </div>
          ) : (
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {report.summary}
            </p>
          )}
          <div className="bg-blue-50 border-l-4 border-primary p-6 mb-6">
            <p className="text-gray-800">
              <strong>Key Highlights:</strong>
            </p>
            {narrative?.highlights ? (
              <ul className="mt-3 space-y-1 text-gray-800">
                {narrative.highlights.map((h: string, i: number) => (
                  <li key={i}>• {h}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-800 mt-2">{report.summary}</p>
            )}
          </div>
        </section>

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
                  {section.yoyComparison && (
                    <YoYChart
                      indicators={section.yoyComparison.indicators}
                      previousQuarter={section.yoyComparison.previousQuarter}
                      currentQuarter={section.yoyComparison.currentQuarter}
                    />
                  )}
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {section.body}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Indicator Performance Table */}
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
