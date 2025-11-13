import { loadAllIndicators, formatValue, formatChangePercent, getTrendArrow } from "@/lib/indicators";
import { formatDateShort } from "@/lib/utils";

// Compact widget without footer - perfect for tight embedding spaces
export default async function CompactWidget() {
  const indicators = await loadAllIndicators();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>MIKE Economy Widget</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: transparent;
            padding: 16px;
          }
          .widget {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
            padding: 24px;
            max-width: 1000px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            flex-wrap: wrap;
            gap: 12px;
          }
          .logo {
            height: 40px;
            width: auto;
          }
          .updated {
            font-size: 12px;
            color: #6b7280;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
          }
          .indicator {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            transition: box-shadow 0.2s;
          }
          .indicator:hover {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .indicator-label {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
          }
          .indicator-value {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 4px;
          }
          .indicator-change {
            font-size: 14px;
            font-weight: 600;
          }
          .trend-up { color: #10b981; }
          .trend-down { color: #ef4444; }
          .trend-neutral { color: #f59e0b; }
          @media (max-width: 640px) {
            .grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .indicator-value {
              font-size: 20px;
            }
          }
        `}} />
      </head>
      <body>
        <div className="widget">
          <div className="header">
            <img src="/mike-logo-w150.png" alt="MIKE Economic Data" className="logo" />
            <span className="updated">Updated {indicators[0]?.lastUpdate ? formatDateShort(indicators[0].lastUpdate) : 'N/A'}</span>
          </div>

          <div className="grid">
            {indicators.map((indicator) => (
              <div key={indicator.id} className="indicator">
                <div className="indicator-label">{indicator.shortTitle}</div>
                <div className="indicator-value">
                  {formatValue(indicator.currentValue, indicator.id)}
                </div>
                <div className={`indicator-change ${
                  indicator.changePercent > 0 ? "trend-up" :
                  indicator.changePercent < 0 ? "trend-down" :
                  "trend-neutral"
                }`}>
                  {getTrendArrow(indicator.trend)} {formatChangePercent(indicator.changePercent)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </body>
    </html>
  );
}
