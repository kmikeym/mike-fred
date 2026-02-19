import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { loadAllIndicators, loadQuarterlySnapshot, formatValue, formatChangePercent } from "@/lib/indicators";

interface PageProps {
  params: Promise<{ id: string }>;
}

const REPORTS = {
  "q4-2025": {
    id: "q4-2025",
    quarter: "Q4 2025",
    title: "State of the MIKE Economy - Q4 2025",
    publishedDate: "2026-01-15",
    summary: "Recovery and stabilization quarter. Productivity eased from Q3 peak to baseline (100, -4.8%), while wealth surged +155.9% to 58.6 as employment income took hold. Longform Media Velocity exploded +220% to 16 points (best month of 2025). Knowledge base grew 16.2% to 3,482 notes. Health improved 5% to 75.0. Social capital held steady. First full quarter with all six indicators tracking. A quarter of consolidation after Q3's intensity, with strong financial and cultural engagement gains.",
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

  // Try to load quarterly snapshot data first, fall back to current data
  const snapshotData = await loadQuarterlySnapshot(id);
  const indicators = snapshotData || await loadAllIndicators();

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
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            The MIKE Economy demonstrated strong performance in {report.quarter}, with notable achievements across
            key productivity and output indicators. This report provides a comprehensive analysis of economic
            activity, strategic developments, and forward-looking perspectives for stakeholders.
          </p>
          <div className="bg-blue-50 border-l-4 border-primary p-6 mb-6">
            <p className="text-gray-800 font-medium">
              <strong>Key Highlights:</strong> {report.summary}
            </p>
          </div>
        </section>

        {/* Indicator Performance */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-300">
            Economic Indicator Performance
          </h2>

          <div className="space-y-8">
            {indicators.filter(ind => ind.currentValue !== 0 || ind.data.length > 0).map((indicator) => (
              <div key={indicator.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{indicator.title}</h3>
                    <p className="text-sm text-gray-600">{indicator.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatValue(indicator.currentValue, indicator.id)}
                    </div>
                    <div className={`text-sm font-semibold ${
                      indicator.changePercent > 0 ? "text-green-600" :
                      indicator.changePercent < 0 ? "text-red-600" :
                      "text-yellow-600"
                    }`}>
                      {formatChangePercent(indicator.changePercent)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">{indicator.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Source:</span>
                    <span className="ml-2 text-gray-900">{indicator.source}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Frequency:</span>
                    <span className="ml-2 text-gray-900 capitalize">{indicator.frequency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Strategic Outlook */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
            Strategic Outlook
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Looking ahead to the next quarter, MIKE Economic Data anticipates continued strong performance
            across core indicators. Key strategic initiatives include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
            <li>Sustained productivity improvements through AI-assisted workflows</li>
            <li>Expansion of knowledge base with focus on emerging technologies</li>
            <li>Strategic social capital building in key communities</li>
            <li>Diversification of content channels and formats</li>
            <li>Revenue optimization across multiple business streams</li>
            <li>Enhanced project delivery through improved prioritization</li>
          </ul>
          <div className="bg-green-50 border-l-4 border-green-500 p-6">
            <p className="text-gray-800">
              <strong>Forecast:</strong> The MIKE Economy is well-positioned for continued growth, with
              stable fundamentals and positive momentum across all key indicators.
            </p>
          </div>
        </section>

        {/* Methodology */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
            Methodology & Data Sources
          </h2>

          <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Collection Framework</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            MIKE Economic Data employs a comprehensive multi-source data aggregation infrastructure designed
            for transparent, reproducible economic analysis. Our methodology integrates quantitative metrics
            from six primary domains: productivity measurement (RescueTime API), knowledge management systems
            (Obsidian vault analytics), social capital assessment (platform engagement metrics), health monitoring
            (weight tracking and wellness indicators), financial position tracking (net worth calculations), and
            intellectual engagement measurement (longform media consumption logs).
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mb-3">Processing & Normalization</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Raw data is collected monthly and stored in CSV format for version-controlled historical integrity.
            Each indicator undergoes standardized normalization to enable consistent quarter-over-quarter and
            year-over-year comparisons. Index values are calculated against established baselines (e.g., PPI
            normalized to 2025 average = 100), with percentage changes computed using trailing period methodology.
            All transformations are executed via open-source TypeScript utilities, ensuring algorithmic transparency
            and reproducibility.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mb-3">Reporting Architecture</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Quarterly reports are generated through a hybrid human-AI workflow. Data snapshots are compiled at
            quarter-end, capturing final indicator values and monthly progression narratives. Strategic analysis
            is produced using Claude AI (Anthropic) following standardized prompt templates that enforce data-driven
            insights and prohibit generic commentary. The entire report generation pipeline—from raw data to
            published analysis—is version-controlled and publicly auditable.
          </p>

          <div className="bg-blue-50 border-l-4 border-primary p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Open Data & Reproducibility</h3>
            <p className="text-sm text-gray-700 mb-3">
              All source data, transformation scripts, and report generation prompts are publicly available
              for verification and replication. This commitment to transparency enables stakeholders to audit
              methodologies, reproduce analyses, and adapt frameworks for similar economic modeling applications.
            </p>
            <div className="flex flex-col space-y-2 text-sm">
              <a
                href="https://github.com/kmikeym/mike-fred/tree/main/data"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-accent font-medium"
              >
                → View Source Data (CSV files)
              </a>
              <a
                href="https://github.com/kmikeym/mike-fred/tree/main/data/quarterly"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-accent font-medium"
              >
                → View Quarterly Snapshots (JSON)
              </a>
              <a
                href="https://github.com/kmikeym/mike-fred/tree/main/instructions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-accent font-medium"
              >
                → View Report Generation Prompts
              </a>
              <a
                href="https://github.com/kmikeym/mike-fred"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-accent font-medium"
              >
                → Full Repository & Documentation
              </a>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            For interactive data visualization and real-time indicator monitoring, visit{" "}
            <Link href="/" className="text-primary hover:underline">mike.quarterly.systems</Link>
          </p>
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
