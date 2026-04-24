import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const reports = [
    {
      id: "q1-2026",
      quarter: "Q1 2026",
      title: "State of the MIKE Economy - Q1 2026",
      summary: "Strongest quarter in the dataset. PWI averaged 143.5 (+193% vs Q4) — 'degen quarter' confirmed as sustained regime, not a one-month spike. Net worth grew from $11,653 to $37,624 (+223%). PHI hit 93.5 in March (all-time high). PPI held above baseline through international relocation. Knowledge base added 1,104 notes. SCI finally broke 101.",
      publishedDate: "2026-04-25",
      status: "current",
    },
    {
      id: "q4-2025",
      quarter: "Q4 2025",
      title: "State of the MIKE Economy - Q4 2025",
      summary: "Recovery and stabilization quarter. PWI surged +155.9% to 58.6, Media Velocity hit 16 (best month of 2025), Knowledge Base crossed 3,400 notes. All six indicators now actively tracking.",
      publishedDate: "2026-01-15",
      status: "published",
    },
    {
      id: "q3-2025",
      quarter: "Q3 2025",
      title: "State of the MIKE Economy - Q3 2025",
      summary: "High-growth productivity quarter with major financial restructuring. PPI surged +6.3% to 105 (peak 2025 performance).",
      publishedDate: "2025-10-15",
      status: "published",
    },
    {
      id: "q2-2025",
      quarter: "Q2 2025",
      title: "State of the MIKE Economy - Q2 2025",
      summary: "Stabilization quarter following Q1 employment transition. PPI flat at 98.75, PWI recovered +6.5% to 59.3.",
      publishedDate: "2025-07-15",
      status: "published",
    },
    {
      id: "q1-2025",
      quarter: "Q1 2025",
      title: "State of the MIKE Economy - Q1 2025",
      summary: "Transitional quarter marked by employment change. PPI averaged 95.8 (volatile), PWI declined -28.6% during job transition.",
      publishedDate: "2025-04-15",
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
