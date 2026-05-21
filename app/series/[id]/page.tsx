import { notFound } from "next/navigation";
import { loadIndicatorData, INDICATOR_REGISTRY, formatValue, formatChangePercent, getTrendArrow } from "@/lib/indicators";
import { formatDate, formatDateShort, getTrendClass } from "@/lib/utils";
import type { IndicatorId } from "@/lib/types";
import IndicatorChart from "@/components/IndicatorChart";
import HoursBarChart from "@/components/HoursBarChart";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return Object.keys(INDICATOR_REGISTRY).map((id) => ({ id }));
}

export default async function IndicatorPage({ params }: PageProps) {
  const { id } = await params;

  // Validate indicator ID
  if (!(id in INDICATOR_REGISTRY)) {
    notFound();
  }

  const indicator = await loadIndicatorData(id as IndicatorId);

  // Get recent 10 data points for table
  const recentData = indicator.data.slice(-10).reverse();

  // PPI carries a secondary "total tracked hours" series (column 5 of ppi.csv)
  const hasHours = indicator.data.some((point) => typeof point.hours === "number");

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{indicator.shortTitle}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-4xl font-bold text-gray-900">{indicator.title}</h1>
          {indicator.id !== "ppi" && indicator.id !== "knowledge-expansion" && indicator.id !== "social-capital" && indicator.id !== "revenue" && indicator.id !== "completion-rate" && indicator.id !== "phi" && (
            <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-yellow-100 text-yellow-800">
              Sample Data
            </span>
          )}
        </div>
        <p className="text-lg text-gray-600">{indicator.description}</p>
      </div>

      {/* Current Value Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Current Value</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatValue(indicator.currentValue, indicator.id)}
            </div>
            <div className="text-sm text-gray-500">{indicator.unit}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Change</div>
            <div className={`text-2xl font-semibold ${getTrendClass(indicator.changePercent)}`}>
              {getTrendArrow(indicator.trend)} {formatChangePercent(indicator.changePercent)}
            </div>
            <div className="text-sm text-gray-500">vs. previous period</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Last Updated</div>
            <div className="text-lg font-medium text-gray-900">
              {formatDateShort(indicator.lastUpdate)}
            </div>
            <div className="text-sm text-gray-500">{indicator.frequency} frequency</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Next Update</div>
            <div className="text-lg font-medium text-gray-900">
              {formatDateShort(indicator.nextUpdate)}
            </div>
            <div className="text-sm text-gray-500">Scheduled</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Historical Data</h2>
          <div className="flex space-x-2 text-sm">
            <button className="px-3 py-1 rounded-md bg-primary text-white font-medium">
              All
            </button>
            <button className="px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100">
              1Y
            </button>
            <button className="px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100">
              6M
            </button>
            <button className="px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100">
              3M
            </button>
          </div>
        </div>
        <IndicatorChart data={indicator.data} color={indicator.color} unit={indicator.unit} />
      </div>

      {/* Total Hours Bar Chart (PPI only) */}
      {hasHours && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Total Hours Tracked</h2>
            <p className="text-sm text-gray-500 mt-1">
              Monthly total tracked hours (RescueTime). The index above measures
              productivity quality; this shows raw volume.
            </p>
          </div>
          <HoursBarChart data={indicator.data} color={indicator.color} />
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Observations</h2>
          <a
            href={`https://github.com/kmikeym/mike-fred/blob/main/data/${indicator.id}.csv`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-accent font-medium"
          >
            Download Full Dataset →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentData.map((point, index) => (
                <tr key={point.date} className={index === 0 ? "bg-blue-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatDate(point.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                    {formatValue(point.value, indicator.id)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {point.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Indicator Details</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="text-sm text-gray-900">{indicator.category}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Data Source</dt>
              <dd className="text-sm text-gray-900">{indicator.source}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Update Frequency</dt>
              <dd className="text-sm text-gray-900 capitalize">{indicator.frequency}</dd>
            </div>
            {indicator.calculation && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Calculation Method</dt>
                <dd className="text-sm text-gray-900">{indicator.calculation}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Resources</h3>
          <ul className="space-y-3">
            <li>
              <Link href="/reports" className="text-sm text-primary hover:text-accent">
                → View Reports
              </Link>
            </li>
            <li>
              <Link href="/" className="text-sm text-primary hover:text-accent">
                → Back to Dashboard
              </Link>
            </li>
            <li>
              <Link href="/widget" className="text-sm text-primary hover:text-accent">
                → Embed This Indicator
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
