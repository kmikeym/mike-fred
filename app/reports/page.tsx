import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const reports = [
    {
      id: "q4-2025",
      quarter: "Q4 2025",
      title: "State of the MIKE Economy - Q4 2025",
      summary: "Strong productivity growth driven by AI tooling and workflow optimization. Knowledge base expansion continues at accelerated pace.",
      publishedDate: "2025-11-01",
      status: "current",
    },
    {
      id: "q3-2025",
      quarter: "Q3 2025",
      title: "State of the MIKE Economy - Q3 2025",
      summary: "Sustained momentum across all indicators. Content velocity reaching new highs with multi-platform strategy.",
      publishedDate: "2025-08-01",
      status: "published",
    },
    {
      id: "q2-2025",
      quarter: "Q2 2025",
      title: "State of the MIKE Economy - Q2 2025",
      summary: "Peak engagement in social capital. Project completion rate improvements through better prioritization.",
      publishedDate: "2025-05-01",
      status: "published",
    },
    {
      id: "q1-2025",
      quarter: "Q1 2025",
      title: "State of the MIKE Economy - Q1 2025",
      summary: "Baseline establishment quarter. Strong foundation set across productivity, knowledge, and revenue indicators.",
      publishedDate: "2025-02-01",
      status: "published",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Reports</h1>
        <p className="text-lg text-gray-600">
          Official economic reports from MIKE Economic Data. Comprehensive analysis of performance,
          trends, and strategic outlook published quarterly.
        </p>
      </div>

      {/* Current Report Highlight */}
      {reports[0] && (
        <div className="bg-gradient-to-r from-fed-navy to-blue-900 rounded-lg p-8 mb-12 text-white">
          <div className="flex items-center space-x-2 mb-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
              Latest Report
            </span>
            <span className="text-sm opacity-80">Published {formatDate(reports[0].publishedDate)}</span>
          </div>
          <h2 className="text-3xl font-bold mb-3">{reports[0].title}</h2>
          <p className="text-lg opacity-90 mb-6">{reports[0].summary}</p>
          <Link
            href={`/reports/${reports[0].id}`}
            className="inline-flex items-center px-6 py-3 bg-white text-fed-navy rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Read Full Report →
          </Link>
        </div>
      )}

      {/* Reports Archive */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Report Archive</h2>
        <div className="space-y-6">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{report.quarter}</h3>
                    {report.status === "current" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary text-white">
                        Current
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                      Sample
                    </span>
                  </div>
                  <p className="text-lg text-gray-700 mb-2">{report.title}</p>
                  <p className="text-sm text-gray-600">{report.summary}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-500">Published {formatDate(report.publishedDate)}</span>
                <span className="text-sm text-primary font-medium">Read Report →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* About Reports */}
      <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">About These Reports</h2>
        <div className="prose prose-sm max-w-none text-gray-600">
          <p>
            MIKE Economic Data publishes comprehensive quarterly reports analyzing the state of the MIKE Economy.
            Each report includes:
          </p>
          <ul className="mt-4 space-y-2">
            <li>Executive summary of economic performance</li>
            <li>Detailed analysis of all six key economic indicators</li>
            <li>Historical trends and year-over-year comparisons</li>
            <li>Strategic outlook and forecasts for coming quarter</li>
            <li>Shareholder insights and decision-making context</li>
          </ul>
          <p className="mt-4">
            Reports are published within the first week of each new quarter and reflect data from the previous
            three-month period.
          </p>
        </div>
      </div>
    </main>
  );
}
