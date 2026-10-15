import Link from "next/link";

export const metadata = {
  title: "Disclosures | MIKE Economic Data",
  description:
    "Quarterly transparency disclosure for KmikeyM, a publicly traded person. Holdings, income, active ventures, shareholder base, and obligations.",
};

const AS_OF = "September 30, 2026";
const PUBLISHED = "October 14, 2026";
const EDITION = "Q3 2026";

export default function DisclosuresPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Disclosures</span>
      </div>

      {/* Filing header */}
      <div className="bg-gradient-to-r from-fed-navy to-blue-900 rounded-lg p-8 mb-10 text-white">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
            {EDITION}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-fed-gold/90 text-fed-navy">
            FILING
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-3">Disclosures</h1>
        <p className="text-lg text-blue-100 mb-6">
          A quarterly transparency disclosure for a publicly traded person.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/20 pt-5 text-sm">
          <div>
            <div className="text-blue-200 uppercase tracking-wide text-xs mb-1">
              Reporting period ends
            </div>
            <div className="font-semibold text-lg">{AS_OF}</div>
          </div>
          <div>
            <div className="text-blue-200 uppercase tracking-wide text-xs mb-1">
              Published
            </div>
            <div className="font-semibold text-lg">{PUBLISHED}</div>
          </div>
        </div>
      </div>

      {/* Preamble */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
        <p className="text-lg text-gray-700 leading-relaxed">
          KmikeyM is a market in a person. If you hold shares, you own a slice of
          how Mike Merrill spends his money, time, and attention. This page lists
          where those go. It is refreshed every quarter so nothing material sits
          behind the asset.
        </p>
      </div>

      {/* Changes since the prior edition */}
      <div className="rounded-lg border border-fed-gold/60 bg-amber-50 p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
          Changes since Q2 2026
        </h2>
        <ul className="space-y-2 text-gray-800">
          {[
            "Added: the Dead Internet Theory position (section 1), held with shareholder funds since May 2026. It should have appeared in the Q2 2026 edition and did not.",
            "Active ventures: added shareholder poker, Quarterly Systems, agentic consulting and the SFK 2026 talk. The Shareholder Summit was held July 11 and is off the list. The Kosovo development project ended. GumDemo.com is now pending.",
            "Location: updated for the quarter's travel.",
            "Shareholder base: 418 more shares in the open market, 415 of them from the vote 183 grant (see section 4), and 10 more shareholders.",
            "The $KMIKEYM token paragraph is retired. There has been no activity since it was wound down.",
            "Added: a minor investment in local businesses via Honeycomb (section 1).",
            "Unchanged: income and debt (none).",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="text-gray-400">&bull;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-8">
        <Section n={1} title="Investment Holdings">
          <p className="text-gray-700 mb-6">
            The headline versus 2020: the portfolio has shrunk to almost nothing.
            Most positions are closed or dormant. The short list of what is
            actually held:
          </p>

          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
            Active positions
          </h3>
          <ul className="mb-6 divide-y divide-gray-100 border-y border-gray-100">
            {[
              ["Are.na", "via Republic"],
              ["Tender Loving Empire", "via Wefunder"],
              ["Substack", "via Wefunder"],
              ["Mercury", "via Wefunder"],
              ["Wefunder", "via Wefunder"],
              ["Local businesses, minor", "via Honeycomb"],
            ].map(([name, vehicle]) => (
              <li
                key={name}
                className="flex items-center justify-between py-2.5 text-gray-800"
              >
                <span className="font-medium">{name}</span>
                <span className="text-sm text-gray-500">{vehicle}</span>
              </li>
            ))}
          </ul>

          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
            Shareholder fund positions
          </h3>
          <p className="text-gray-700 mb-3">
            Investments made with KmikeyM shareholder funds, approved by
            shareholder vote. Separate from Mike&apos;s personal holdings above.
          </p>
          <ul className="mb-6 divide-y divide-gray-100 border-y border-gray-100">
            <li className="py-3">
              <div className="flex items-center justify-between text-gray-800">
                <span className="font-medium">Dead Internet Theory</span>
                <span className="text-sm text-gray-500">$5,000, funded May 2026</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Revenue share until a 2X cap ($10,000). No equity and no
                follow-on obligation. Approved by shareholder vote 180, May 2026.
                Full loss is possible and was acknowledged in the vote.
              </div>
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
            Dormant or trace only
          </h3>
          <ul className="mb-6 space-y-2 text-gray-700">
            <li className="flex gap-3">
              <span className="text-gray-400">&bull;</span>
              <span>
                <strong className="font-medium text-gray-900">
                  MetaMask, OpenSea, HumanIPO:
                </strong>{" "}
                inactive, possible trace amounts.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gray-400">&bull;</span>
              <span>
                <strong className="font-medium text-gray-900">Robinhood:</strong>{" "}
                zero balance.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gray-400">&bull;</span>
              <span>
                <strong className="font-medium text-gray-900">Cash App:</strong>{" "}
                zero balance, used for personal transfers and taxes. Operational,
                not an investment position.
              </span>
            </li>
          </ul>

          <p className="text-gray-700">
            No real estate owned. No non-platform holdings of note.
          </p>
        </Section>

        <Section n={2} title="Income and Employment">
          <p className="text-gray-700 mb-4">
            Nomadic, working independently, owning no property. At the end of
            the quarter he was in Prishtina for a conference. The route from
            there runs to Los Angeles for consulting work, then back to Oakland.
            More travel is likely.
          </p>
          <p className="text-gray-700">
            Current income comes from savings accumulated and from development
            projects.
          </p>
        </Section>

        <Section n={3} title="Active Ventures">
          <p className="text-gray-700 mb-5">
            Projects competing for Mike&apos;s time:
          </p>
          <ul className="divide-y divide-gray-100 border-y border-gray-100">
            {[
              ["KmikeyM", "The market in Mike itself. Ongoing."],
              ["Blippo+", "Manager of LLC."],
              [
                "Shareholder poker",
                "Recurring games with shareholders. New to this list.",
              ],
              [
                "Quarterly Systems",
                "MIKE Economic Data and the quarterly reports on this site. New to this list.",
              ],
              ["Agentic consulting", "Consulting on AI agent systems. New."],
              [
                "SFK 2026 talk",
                "Prishtina. In preparation at the end of the quarter and delivered in early October. It took a large share of the quarter's time.",
              ],
              ["GumDemo.com", "Pending."],
            ].map(([name, detail]) => (
              <li key={name} className="py-3">
                <div className="font-medium text-gray-900">{name}</div>
                <div className="text-sm text-gray-600">{detail}</div>
              </li>
            ))}
          </ul>
        </Section>

        <Section n={4} title="Shareholder Base and Insider Ownership">
          <p className="text-gray-700 mb-6">
            A point-in-time read of the cap table. Aggregate only. No individual
            shareholders are named. Figures pulled October 4, 2026.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Stat value="25,226" label="Shares in the open market" sub="About 25% of total shares" />
            <Stat value="1,249" label="Shareholders" sub="Holding the public float" />
            <Stat value="~75%" label="Retained by Mike" sub="74,774 shares, non-voting reserve" />
          </div>

          <ul className="space-y-2 text-gray-700">
            <li className="flex gap-3">
              <span className="text-gray-400">&bull;</span>
              <span>
                KmikeyM is authorized at 100,000 shares. The reserve Mike retains
                is dispersed to shareholders over time.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gray-400">&bull;</span>
              <span>
                This quarter 418 shares moved from the reserve into the open
                market. 415 are the grant approved by shareholder vote 183 in
                June. They were credited on October 1, after the period end, for
                technical reasons only, so they are counted in this edition, the
                quarter they were due. The other 3 were small grants to
                shareholders.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gray-400">&bull;</span>
              <span>
                Concentration of the public float: top 3 holders about 25%, top 15
                about 51%, with the remaining roughly half spread across the long
                tail.
              </span>
            </li>
          </ul>
        </Section>

        <Section n={5} title="Obligations">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
            Debt
          </h3>
          <p className="text-gray-700">None. Mike is debt free.</p>
        </Section>

        <Section n={6} title="Methodology">
          <p className="text-gray-700">
            This page is refreshed quarterly. Holdings are self-reported by Mike
            as of the reporting-period end date above. It is a transparency
            disclosure, not investment advice and not a complete financial
            statement. Aggregate cap-table figures come from the shareholder
            registry, pulled on the date stated in section 4.
          </p>
        </Section>
      </div>

      {/* Editions */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          Editions
        </h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="font-medium text-gray-900">
              Q3 2026 (current)
            </span>
            <span className="text-gray-500">As of {AS_OF}</span>
          </li>
          <li className="flex items-center justify-between py-2 border-b border-gray-100">
            <Link
              href="/disclosures/q2-2026"
              className="font-medium text-primary hover:underline"
            >
              Q2 2026
            </Link>
            <span className="text-gray-500">As of June 30, 2026</span>
          </li>
          <li className="flex items-center justify-between py-2">
            <a
              href="https://news.kmikeym.com/disclosures-dec2020/"
              className="font-medium text-primary hover:underline"
            >
              December 2020
            </a>
            <span className="text-gray-500">Prior edition</span>
          </li>
        </ul>
        <p className="mt-6 text-xs text-gray-500">
          Next scheduled edition: Q4 2026, January 2027.
        </p>
      </div>
    </main>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="flex items-baseline gap-3 mb-5 pb-4 border-b border-gray-100">
        <span className="text-sm font-bold text-fed-navy/40 tabular-nums">
          {String(n).padStart(2, "0")}
        </span>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Stat({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="text-2xl font-bold text-fed-navy tabular-nums">
        {value}
      </div>
      <div className="text-sm font-medium text-gray-900 mt-1">{label}</div>
      <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}
