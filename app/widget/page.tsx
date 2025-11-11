import { loadAllIndicators, formatValue, formatChangePercent, getTrendArrow } from "@/lib/indicators";
import { formatDateShort } from "@/lib/utils";

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

      {/* Widget Preview */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Preview</h2>
        <div className="bg-gray-100 p-8 rounded-lg">
          <div className="max-w-4xl mx-auto">
            {/* This is the actual widget component */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">MIKE Economy Dashboard</h3>
                <span className="text-xs text-gray-500">
                  Updated {formatDateShort(indicators[0].lastUpdate)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {indicators.map((indicator) => (
                  <div key={indicator.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                      {indicator.shortTitle}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {formatValue(indicator.currentValue, indicator.id)}
                    </div>
                    <div className={`text-sm font-semibold ${
                      indicator.changePercent > 0 ? "text-green-600" :
                      indicator.changePercent < 0 ? "text-red-600" :
                      "text-yellow-600"
                    }`}>
                      {getTrendArrow(indicator.trend)} {formatChangePercent(indicator.changePercent)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <a
                  href="https://mike.quarterly.systems"
                  className="text-sm text-primary hover:text-accent font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Full Dashboard →
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
  width="100%"
  height="400"
  frameborder="0"
  style="border: none; border-radius: 12px;"
></iframe>`}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`<iframe src="https://mike.quarterly.systems/widget/embed" width="100%" height="400" frameborder="0" style="border: none; border-radius: 12px;"></iframe>`);
            }}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors"
          >
            Copy Iframe Code
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">JavaScript Embed</h2>
          <p className="text-sm text-gray-600 mb-4">
            For more control, use our JavaScript snippet:
          </p>
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-x-auto">
{`<div id="mike-widget"></div>
<script src="https://mike.quarterly.systems/widget/embed.js"></script>
<script>
  MIKEWidget.init({
    container: '#mike-widget',
    theme: 'light'
  });
</script>`}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`<div id="mike-widget"></div>\n<script src="https://mike.quarterly.systems/widget/embed.js"></script>\n<script>\n  MIKEWidget.init({\n    container: '#mike-widget',\n    theme: 'light'\n  });\n</script>`);
            }}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors"
          >
            Copy JavaScript Code
          </button>
        </div>
      </div>

      {/* Customization Options */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Customization Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Theme</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <code className="bg-gray-100 px-1 rounded">light</code> - Default light theme</li>
              <li>• <code className="bg-gray-100 px-1 rounded">dark</code> - Dark mode</li>
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
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Auto-refresh</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Updates every 6 hours</li>
              <li>• Cached for performance</li>
              <li>• No page reload required</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
