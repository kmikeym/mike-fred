import { loadAllIndicators, formatValue, formatChangePercent } from "@/lib/indicators";

// This page is designed to be embedded in iframes
// Styled to match FRED "At a Glance" widget for seamless drop-in replacement
export default async function EmbedWidget() {
  const indicators = await loadAllIndicators();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>MIKE At a Glance</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: transparent;
            padding: 8px;
          }
          .widget {
            background: #fff;
            border: 1px solid #ddd;
            padding: 16px;
            width: 100%;
          }
          .header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid #eee;
          }
          .logo {
            height: 32px;
            width: auto;
          }
          .title {
            font-size: 14px;
            font-weight: 600;
            color: #333;
          }
          .indicators {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .indicator {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .indicator:last-child {
            border-bottom: none;
          }
          .indicator-name {
            font-size: 14px;
            color: #003366;
            text-decoration: none;
            font-weight: 500;
          }
          .indicator-name:hover {
            text-decoration: underline;
          }
          .indicator-value {
            font-size: 14px;
            color: #333;
            text-align: right;
            white-space: nowrap;
          }
          .indicator-value strong {
            font-weight: 700;
          }
          .trend-up { color: #10b981; }
          .trend-down { color: #ef4444; }
          .trend-neutral { color: #666; }
          .footer {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #eee;
          }
          .footer a {
            font-size: 12px;
            color: #003366;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
        `}} />
      </head>
      <body>
        <div className="widget">
          <div className="header">
            <a href="https://mike.quarterly.systems" target="_blank" rel="noopener noreferrer">
              <img src="https://mike.quarterly.systems/mike-logo-w150.png" alt="MIKE Economic Data" className="logo" />
            </a>
            <span className="title">MIKE At a Glance</span>
          </div>

          <div className="indicators">
            {indicators.map((indicator) => {
              const changeClass = indicator.changePercent > 0 ? "trend-up" :
                                  indicator.changePercent < 0 ? "trend-down" : "trend-neutral";
              return (
                <div key={indicator.id} className="indicator">
                  <a
                    href={`https://mike.quarterly.systems/series/${indicator.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="indicator-name"
                  >
                    {indicator.title}
                  </a>
                  <div className="indicator-value">
                    <strong className={changeClass}>{formatValue(indicator.currentValue, indicator.id)}</strong>
                    {' '}
                    <span className={changeClass}>{formatChangePercent(indicator.changePercent)}</span>
                    {' '}
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      {indicator.lastUpdate ? `on ${indicator.lastUpdate}` : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="footer">
            <a href="https://mike.quarterly.systems" target="_blank" rel="noopener noreferrer">
              ... and more indicators at mike.quarterly.systems
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
