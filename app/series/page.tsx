import Link from "next/link";
import { loadAllIndicators, formatValue, formatChangePercent, getTrendArrow, INDICATOR_REGISTRY } from "@/lib/indicators";
import { getTrendClass } from "@/lib/utils";
import type { IndicatorId } from "@/lib/types";

export default async function IndicatorsPage() {
  const indicators = await loadAllIndicators();

  // Categorize indicators
  const categories = {
    "Productivity & Output": ["ppi"],
    "Learning & Growth": ["knowledge-expansion", "completion-rate"],
    "Social & Influence": ["social-capital"],
    "Health & Wellness": ["phi"],
    "Financial": ["revenue"],
  };

  // Ideas for future indicators
  const futureIndicators = [
    {
      category: "Health & Wellness",
      indicators: [
        { name: "Sleep Quality Index", description: "Average sleep hours and quality scores tracked via wearables" },
        { name: "Exercise Consistency", description: "Workout frequency and intensity metrics" },
        { name: "Nutrition Score", description: "Diet quality and macronutrient balance tracking" },
      ],
    },
    {
      category: "Learning & Growth",
      indicators: [
        { name: "Course Completion Rate", description: "Online courses and certifications completed" },
        { name: "Reading Velocity", description: "Books read per month with comprehension metrics" },
        { name: "Skill Acquisition Index", description: "New skills learned and proficiency levels" },
      ],
    },
    {
      category: "Financial Health",
      indicators: [
        { name: "Savings Rate", description: "Percentage of income saved monthly" },
        { name: "Investment Returns", description: "Portfolio performance and ROI tracking" },
        { name: "Net Worth Growth", description: "Total assets minus liabilities over time" },
      ],
    },
    {
      category: "Social & Relationships",
      indicators: [
        { name: "Network Quality Score", description: "Meaningful interactions and relationship depth" },
        { name: "Collaboration Index", description: "Joint projects and partnerships formed" },
        { name: "Community Contribution", description: "Open source contributions and mentoring hours" },
      ],
    },
    {
      category: "Creativity & Innovation",
      indicators: [
        { name: "Ideation Rate", description: "New ideas captured and developed" },
        { name: "Project Launch Velocity", description: "New initiatives started and shipped" },
        { name: "Experimentation Index", description: "Tests run and hypotheses validated" },
      ],
    },
    {
      category: "Work-Life Balance",
      indicators: [
        { name: "Burnout Risk Score", description: "Stress levels and recovery time tracking" },
        { name: "Leisure Time Quality", description: "Hours spent on hobbies and personal interests" },
        { name: "Family Engagement", description: "Quality time with loved ones" },
      ],
    },
    {
      category: "Impact & Legacy",
      indicators: [
        { name: "Mentorship Impact", description: "People mentored and their progress" },
        { name: "Knowledge Sharing", description: "Blog posts, talks, and teaching contributions" },
        { name: "Sustainable Practices", description: "Environmental and ethical choices tracked" },
      ],
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Economic Indicators</h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Comprehensive tracking of key performance metrics across productivity, knowledge, social capital,
          and financial dimensions. Each indicator provides historical trends, current values, and strategic insights.
        </p>
      </div>

      {/* Current Indicators by Category */}
      {Object.entries(categories).map(([category, indicatorIds]) => (
        <div key={category} className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {indicatorIds.map((id) => {
              const indicator = indicators.find((ind) => ind.id === id);
              if (!indicator) return null;

              return (
                <Link
                  key={indicator.id}
                  href={`/series/${indicator.id}`}
                  className="indicator-card bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-600">{indicator.title}</h3>
                      {indicator.id !== "ppi" && indicator.id !== "knowledge-expansion" && indicator.id !== "social-capital" && indicator.id !== "revenue" && indicator.id !== "completion-rate" && indicator.id !== "phi" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Sample
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-sm font-semibold ${getTrendClass(indicator.changePercent)}`}
                    >
                      {getTrendArrow(indicator.trend)} {formatChangePercent(indicator.changePercent)}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatValue(indicator.currentValue, indicator.id)}
                    </div>
                    <div className="text-sm text-gray-500">{indicator.unit}</div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{indicator.description}</p>
                  <div className="text-xs text-gray-400">
                    Updated {indicator.lastUpdate}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Future Indicator Ideas */}
      <div className="mt-16 pt-12 border-t-2 border-gray-200">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Future Indicator Ideas</h2>
          <p className="text-lg text-gray-600">
            Potential metrics to add for more comprehensive tracking across all dimensions of personal and
            professional growth.
          </p>
        </div>

        <div className="space-y-12">
          {futureIndicators.map((group) => (
            <div key={group.category}>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm mr-3">
                  Coming Soon
                </span>
                {group.category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.indicators.map((indicator) => (
                  <div
                    key={indicator.name}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-75"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">{indicator.name}</h4>
                    <p className="text-sm text-gray-600">{indicator.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-12 bg-gradient-to-r from-primary to-accent rounded-lg p-8 text-white">
        <h3 className="text-2xl font-bold mb-3">Have an Indicator Idea?</h3>
        <p className="text-lg mb-6 opacity-90">
          The MIKE Economic Data system is continuously evolving. Suggest new metrics to track or
          categories to explore.
        </p>
        <div className="flex space-x-4">
          <a
            href="mailto:mike@quarterly.systems?subject=Indicator Suggestion"
            className="inline-flex items-center px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Suggest an Indicator
          </a>
          <Link
            href="/reports"
            className="inline-flex items-center px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            View Latest Reports →
          </Link>
        </div>
      </div>
    </main>
  );
}
