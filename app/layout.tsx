import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIKE Economic Data | Dashboard",
  description: "Official economic indicators and quarterly reports from the MIKE Economy",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">
        <nav className="fed-header border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <a href="/" className="flex items-center flex-shrink-0">
                  <Image
                    src="/mike-logo-light.png"
                    alt="MIKE Economic Data"
                    width={120}
                    height={120}
                  />
                </a>
                <div className="hidden md:block">
                  <div className="flex items-baseline space-x-4">
                    <a href="/" className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Dashboard
                    </a>
                    <a href="/series" className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Indicators
                    </a>
                    <a href="/reports" className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Reports
                    </a>
                    <a href="/disclosures" className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Disclosures
                    </a>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-300">
                Est. 2025
              </div>
            </div>
          </div>
        </nav>
        {children}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                © 2025 MIKE Economic Data. Released under CC0 1.0 — public domain.
              </p>
              <p className="text-sm text-gray-500">
                A <a href="https://quarterly.systems" className="text-primary hover:underline">Quarterly Systems</a> project
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
