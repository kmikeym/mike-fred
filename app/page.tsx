import Link from "next/link";
import { loadAllIndicators, formatValue, formatChangePercent } from "@/lib/indicators";

export default async function Home() {
  // Load real data from CSV files
  const indicators = await loadAllIndicators();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          State of the MIKE Economy
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Official economic indicators and performance metrics from MIKE Economic Data.
          Transparent, data-driven insights into personal productivity, growth, and strategic output.
        </p>
        <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500">
          <span>Last Updated: November 1, 2025</span>
          <span>•</span>
          <span>Next Update: December 1, 2025</span>
        </div>
      </div>

      {/* Economic Summary Banner */}
      <div className="bg-gradient-to-r from-fed-navy to-blue-900 rounded-lg p-8 mb-12 text-white">
        <h2 className="text-2xl font-bold mb-4">Economic Overview - Q4 2025</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm opacity-80 mb-1">Overall Performance</div>
            <div className="text-3xl font-bold">Strong Growth</div>
          </div>
          <div>
            <div className="text-sm opacity-80 mb-1">Productivity Trend</div>
            <div className="text-3xl font-bold trend-up">+3.8%</div>
          </div>
          <div>
            <div className="text-sm opacity-80 mb-1">Strategic Outlook</div>
            <div className="text-3xl font-bold">Positive</div>
          </div>
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Economic Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {indicators.map((indicator) => (
            <Link
              key={indicator.id}
              href={`/series/${indicator.id}`}
              className="indicator-card bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2 flex-1 mr-2">
                  <h3 className="text-sm font-medium text-gray-600">{indicator.title}</h3>
                  {indicator.id !== "ppi" && indicator.id !== "knowledge-expansion" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                      Sample
                    </span>
                  )}
                </div>
                <span
                  className={`text-sm font-semibold ${
                    indicator.changePercent > 0
                      ? "trend-up"
                      : indicator.changePercent < 0
                      ? "trend-down"
                      : "trend-neutral"
                  }`}
                >
                  {indicator.changePercent > 0 ? "↑" : indicator.changePercent < 0 ? "↓" : "→"}{" "}
                  {formatChangePercent(indicator.changePercent)}
                </span>
              </div>
              <div className="mb-2">
                <div className="text-3xl font-bold text-gray-900">
                  {formatValue(indicator.currentValue, indicator.id)}
                </div>
                <div className="text-sm text-gray-500">{indicator.unit}</div>
              </div>
              <div className="text-xs text-gray-400">
                Updated {indicator.lastUpdate}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Latest Report</h3>
          <p className="text-gray-600 mb-4">
            Q4 2025 State of the MIKE Economy - Comprehensive analysis of performance,
            trends, and strategic outlook.
          </p>
          <Link href="/reports/q4-2025" className="text-primary hover:text-accent font-medium">
            Read Report →
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Embed Widget</h3>
          <p className="text-gray-600 mb-4">
            Display live economic indicators on your website with our embeddable widget.
          </p>
          <Link href="/widget" className="text-primary hover:text-accent font-medium">
            Get Widget Code →
          </Link>
        </div>
      </div>
    </main>
  );
}
