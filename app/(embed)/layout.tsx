import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MIKE At a Glance",
  description: "Embeddable MIKE economic indicators widget",
};

/**
 * Root layout for embeddable widgets — deliberately bare.
 *
 * These pages are rendered inside an iframe on other people's sites, so they
 * carry none of mike.quarterly.systems' chrome: no nav, no footer, no
 * globals.css. Each widget page supplies its own scoped <style>.
 *
 * This is a second root layout (Next.js route groups). Before it existed the
 * widget pages emitted their own <html> nested inside the site layout's, which
 * browsers resolve by ignoring the inner tags — so the site header and footer
 * rendered inside the iframe, including a copyright line, on kmikeym.com.
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
