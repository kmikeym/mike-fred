import Link from "next/link";

export const metadata = {
  title: "Disclosures | MIKE Economic Data",
  description:
    "Quarterly transparency disclosure for KmikeyM, a publicly traded person. Holdings, income, active ventures, shareholder base, and obligations.",
};

const AS_OF = "June 30, 2026";
const PUBLISHED = "July 13, 2026";
const EDITION = "Q2 2026";

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
          behind the asset. The last full disclosure was December 2020, and a lot
          has changed since.
        </p>
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
            Mike was recently laid off from Vibes (Vibes DIY).
          </p>
          <p className="text-gray-700 mb-4">
            Currently nomadic, working independently. The 2026 route is LA to
            Kosovo to Portland to Oakland. Currently in Portland, visiting and
            sub-leasing, owning no property.
          </p>
          <p className="text-gray-700">
            Current income comes from savings accumulated at Vibes and from
            independent development projects.
          </p>
        </Section>

        <Section n={3} title="Active Ventures">
          <p className="text-gray-700 mb-5">
            Projects competing for Mike&apos;s time:
          </p>
          <ul className="divide-y divide-gray-100 border-y border-gray-100">
            {[
              [
                "KmikeyM Shareholder Summit",
                "July 11, Portland. The year's flagship event.",
              ],
              ["GumDemo.com", "Active content project."],
              [
                "Custom development project",
                "With a Kosovo-based team. Active.",
              ],
              ["KmikeyM", "The company itself. Ongoing."],
              ["Blippo+", "Manager of LLC."],
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
            shareholders are named.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Stat value="24,808" label="Shares in the open market" sub="About 25% of the company" />
            <Stat value="1,239" label="Shareholders" sub="Holding the public float" />
            <Stat value="~75%" label="Retained by Mike" sub="75,192 shares, non-voting reserve" />
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
                Concentration of the public float: top 3 holders about 26%, top 15
                about 51%, with the remaining roughly half spread across the long
                tail.
              </span>
            </li>
          </ul>
        </Section>

        <Section n={5} title="Obligations and Related Instruments">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Debt
            </h3>
            <p className="text-gray-700">None. Mike is debt free.</p>
          </div>

          <div className="rounded-lg border border-fed-red/30 bg-red-50/50 p-5">
            <h3 className="text-sm font-semibold text-fed-red uppercase tracking-wide mb-2">
              $KMIKEYM token (bags.fm)
            </h3>
            <p className="text-gray-700 mb-3">
              A community token effort that did not work out, and is disclosed
              here as a failure. The bags.fm platform proved unreliable and crypto
              volatility made it unworkable, so the effort has been wound down.
            </p>
            <p className="text-gray-800 font-medium">
              To be clear: the $KMIKEYM token was always a separate instrument
              from KmikeyM shares. Owning shares of Mike is not the same as
              holding that token.
            </p>
          </div>
        </Section>

        <Section n={6} title="Methodology">
          <p className="text-gray-700">
            This page is refreshed quarterly. Holdings are self-reported by Mike
            as of the reporting-period end date above. It is a transparency
            disclosure, not investment advice and not a complete financial
            statement. Aggregate cap-table figures are pulled from the live
            shareholder registry at publish time.
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
              Q2 2026 (current)
            </span>
            <span className="text-gray-500">As of {AS_OF}</span>
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
          Next scheduled edition: Q3 2026, October 2026.
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
