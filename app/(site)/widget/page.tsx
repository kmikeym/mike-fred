import { loadAllIndicators, formatValue, formatChangePercent } from "@/lib/indicators";
import CopyButton from "@/components/CopyButton";
import Image from "next/image";

export default async function WidgetPage() {
  const indicators = await loadAllIndicators();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Embeddable Widget</h1>
        <p className="text-lg text-gray-600">
          Display live economic indicators on your website with our embeddable widget.
        </p>
      </div>

      {/* Widget Preview - matches FRED "At a Glance" style */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Preview</h2>
        <div className="bg-gray-100 p-8 rounded-lg">
          <div className="max-w-md">
            {/* This matches the embed widget style */}
            <div className="bg-white border border-gray-300 p-4">
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                <a href="https://mike.quarterly.systems" target="_blank" rel="noopener noreferrer">
                  <Image
                    src="/mike-logo-w150.png"
                    alt="MIKE Economic Data"
                    width={150}
                    height={32}
                    style={{ height: '32px', width: 'auto' }}
                  />
                </a>
                <span className="text-sm font-semibold text-gray-700">MIKE At a Glance</span>
              </div>

              <div className="flex flex-col gap-2">
                {indicators.map((indicator) => {
                  const changeClass = indicator.changePercent > 0 ? "text-green-500" :
                                      indicator.changePercent < 0 ? "text-red-500" : "text-gray-500";
                  return (
                    <div key={indicator.id} className="flex flex-col py-1.5 border-b border-gray-100 last:border-b-0">
                      <a
                        href={`https://mike.quarterly.systems/series/${indicator.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#003366] font-medium hover:underline"
                      >
                        {indicator.title}
                      </a>
                      <div className="text-sm text-gray-700 mt-0.5">
                        <strong className={changeClass}>{formatValue(indicator.currentValue, indicator.id)}</strong>
                        {' '}
                        <span className={changeClass}>{formatChangePercent(indicator.changePercent)}</span>
                        {' '}
                        <span className="text-xs text-gray-500">
                          {indicator.lastUpdate ? `on ${indicator.lastUpdate}` : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <a
                  href="https://mike.quarterly.systems"
                  className="text-xs text-[#003366] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ... and more indicators at mike.quarterly.systems
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embed Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Iframe Embed</h2>
          <p className="text-sm text-gray-600 mb-4">
            Copy and paste this code into your HTML:
          </p>
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-x-auto">
{`<iframe
  src="https://mike.quarterly.systems/widget/embed"
  width="420"
  height="380"
  frameborder="0"
  style="border: none;"
></iframe>`}
          </pre>
          <CopyButton
            text={`<iframe src="https://mike.quarterly.systems/widget/embed" width="420" height="380" frameborder="0" style="border: none;"></iframe>`}
            label="Copy Iframe Code"
          />
        </div>

      </div>

      {/* What the embed actually does */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Embed Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Two variants</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <code className="bg-gray-100 px-1 rounded">/widget/embed</code> - all six indicators</li>
              <li>• <code className="bg-gray-100 px-1 rounded">/widget/compact</code> - condensed</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Size</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Responsive by default</li>
              <li>• Minimum width: 320px</li>
              <li>• Recommended height: 400px</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Updates</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Values are baked in at build time</li>
              <li>• Refreshes when the site rebuilds</li>
              <li>• Data releases monthly, on the 1st</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
