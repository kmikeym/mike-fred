# Strategic Outlook Template for Quarterly Reports

This document provides instructions for generating data-driven Strategic Outlook sections for MIKE Economy quarterly reports. Use this template when writing new quarterly reports or updating existing ones.

## Overview

The Strategic Outlook section should be **100% data-driven** and unique to each quarter. It should reference actual indicator values, trends, and highlights from the quarterly JSON snapshot, not generic platitudes.

## Data Sources

Each quarterly snapshot (`/data/quarterly/q[N]-[YEAR].json`) contains:

1. **Quarter Metadata**
   - `quarter`: Quarter identifier (e.g., "Q3 2025")
   - `reportDate`: Publication date
   - `period`: { start, end } dates

2. **Indicators** (6 tracked)
   - `ppi`: Personal Productivity Index
   - `knowledge-expansion`: Knowledge Base Expansion Rate (KBER)
   - `social-capital`: Social Capital Index (SCI)
   - `phi`: Personal Health Index (PHI)
   - `revenue`: Personal Wealth Index (PWI)
   - `completion-rate`: Longform Media Velocity

3. **Per-Indicator Data**
   - `value`: Quarter-end value
   - `change`: Absolute change from previous quarter
   - `changePercent`: Percentage change
   - `trend`: "up", "down", or "neutral"
   - `note`: Rich narrative with monthly progression, averages, context

4. **Quarter-Level Analysis**
   - `summary`: 2-3 sentence comprehensive summary
   - `highlights`: Array of 5-7 key achievements/events

## Step-by-Step Instructions

### Step 1: Identify the Quarter's Theme

Read the `summary` field and `highlights` array to determine the quarter's dominant narrative:

**Common themes:**
- **Transition**: Employment changes, major life shifts, volatile indicators
- **Stabilization**: Recovery from transition, finding rhythm, consistent baselines
- **Acceleration**: Peak performance, major milestones, growth momentum
- **Restructuring**: Financial resets, strategic pivots, portfolio changes
- **Consolidation**: Sustaining gains, optimization, preparation for next phase

**Example from Q3 2025:**
```json
"summary": "High-growth productivity quarter with major financial restructuring..."
```
→ **Theme**: Acceleration + Restructuring (productivity peak + financial reset)

### Step 2: Extract Key Data Points

From each indicator's `note` field, extract:
- Quarter-end value
- Quarterly average (if mentioned)
- Monthly progression
- Specific events or context

**Example from Q3 2025 PPI:**
```
"note": "September value (105). Strong growth quarter averaging 101.67:
         project pivot and launch work (Jul 98.75), new role momentum with
         dual projects (Aug 101.25), peak output with systems optimization (Sep 105).
         Best quarter of 2025."
```

**Extracted insights:**
- Peak: 105 (September)
- Average: 101.67
- Trajectory: 98.75 → 101.25 → 105 (consistent upward)
- Context: Dual projects, systems optimization
- Significance: Best quarter of 2025

### Step 3: Analyze Indicator Relationships

Look for patterns across indicators:
- Do PPI and PWI move together or independently?
- Does media consumption correlate with work intensity?
- Are there trade-offs (e.g., productivity ↑ while leisure ↓)?

**Example from Q3 2025:**
- PPI ↑ +6.3% (peak productivity)
- PWI ↓ -61.4% (financial restructuring)
- Media ↓ -50% (focus shifted to career)

→ **Insight**: Productivity surge came at cost of financial stability (debt refactoring) and leisure time (career focus)

### Step 4: Identify Missing Data

Note which indicators have `null` values and when tracking begins:

**Example from Q1-Q3 2025:**
```json
"knowledge-expansion": {
  "value": null,
  "note": "No data available for Q3 2025. Tracking began October 2025."
}
```

→ **Forward-looking note**: "Q4 2025 will mark the launch of comprehensive six-indicator tracking suite"

### Step 5: Write Data-Specific Priorities

Create 3-4 forward-looking priorities based on **actual data**, not generic goals.

**BAD (Generic):**
```markdown
- Sustained productivity improvements through AI-assisted workflows
- Expansion of knowledge base with focus on emerging technologies
- Revenue optimization across multiple business streams
```

**GOOD (Data-Driven):**
```markdown
1. **Productivity Sustainability**: Maintain Q3's 105 PPI peak without burnout
   - Data context: Achieved 2025 high with dual projects and systems optimization
   - Strategic response: Codify September's optimization patterns, monitor for fatigue signals

2. **Financial Recovery**: Rebuild net worth from post-refactoring baseline (22.9)
   - Data context: August dip to -3.5 recovered to 22.9 with employment stabilization
   - Strategic response: Leverage stable employment for 6-month wealth rebuilding campaign

3. **Indicator Suite Launch**: Establish KBER, SCI, and PHI tracking in Q4
   - Data context: Three indicators not yet tracked (Q1-Q3 baseline period)
   - Strategic response: Q4 represents full six-indicator economic monitoring capability
```

### Step 6: Write the Forecast

Reference actual trajectories and specific numbers, not generic optimism.

**BAD (Generic):**
```
The MIKE Economy is well-positioned for continued growth, with stable
fundamentals and positive momentum across all key indicators.
```

**GOOD (Data-Driven for Q3 → Q4):**
```
The MIKE Economy enters Q4 with strong productivity momentum (105 PPI, +6.3%),
stable employment foundation, and expanded monitoring capabilities. Three new
indicators (KBER, SCI, PHI) will provide comprehensive economic visibility.
Primary Q4 focus: sustaining peak performance while rebuilding financial
position (target: 40+ PWI by year-end) and establishing sustainable engagement
across all six metrics.
```

## Complete Template Structure

```markdown
## Strategic Outlook

### Quarter Momentum Assessment
[1-2 sentences using actual data from summary/highlights]

Example: "Q3 concluded with peak productivity (PPI 105, +6.3%) and major
financial restructuring (PWI 22.9, -61.4% due to August debt refactoring).
The quarter demonstrated capacity for sustained high output (101.67 average)
while managing significant financial transitions."

### Forward-Looking Priorities

Based on Q[N] performance:

1. **[Priority Area - use actual indicator name]**: [Specific, data-driven goal]
   - **Data context**: [Cite specific values, trends, events from notes]
   - **Strategic response**: [Concrete action based on the data]

2. **[Priority Area 2]**: [Specific, data-driven goal]
   - **Data context**: [Cite specific values, trends, events]
   - **Strategic response**: [Concrete action]

3. **[Priority Area 3]**: [Specific, data-driven goal]
   - **Data context**: [Cite specific values, trends, events]
   - **Strategic response**: [Concrete action]

[Optional 4th priority if significant]

### Q[N+1] Outlook
[2-3 sentences with specific projections based on current trajectory. Mention
new indicators launching, specific targets, or phase transitions.]
```

## Full Examples by Quarter Type

### Example 1: Transition Quarter (Q1 2025)

```markdown
## Strategic Outlook

### Quarter Momentum Assessment
Q1 concluded with volatile productivity signals (PPI 95.8 average, ending at 98.75)
and significant financial decline (PWI -29% to 55.7) driven by employment transition.
The quarter represented a foundation-setting period with mixed signals requiring
stabilization focus.

### Forward-Looking Priorities

Based on Q1 performance:

1. **Productivity Stabilization**: Establish consistent 98-100 PPI baseline
   - **Data context**: Q1 volatility (102.5 → 86.3 → 98.8) reflects transition turbulence
   - **Strategic response**: Focus Q2 on workflow consistency and rhythm-finding
     through contract work

2. **Revenue Stream Rebuilding**: Recover from transition-driven decline
   - **Data context**: PWI dropped from 78.1 to 55.7 during job change
   - **Strategic response**: Leverage new employment to establish stable income baseline,
     target 60+ PWI by Q2 end

3. **Media Engagement Consistency**: Sustain intellectual engagement through transition
   - **Data context**: Strong January (20 pts) fell to 11 by March
   - **Strategic response**: Establish sustainable 12-15 pts/month rhythm once
     employment stabilizes

### Q2 2025 Outlook
The MIKE Economy enters Q2 focused on stabilization following Q1's employment transition.
Primary objective: establish consistent productivity baseline (target: 98-100 PPI sustained),
recover financial ground (target: 60+ PWI), and maintain intellectual engagement
(target: 12+ pts/month). Contract work period provides opportunity to build foundation
for future growth.
```

### Example 2: Stabilization Quarter (Q2 2025)

```markdown
## Strategic Outlook

### Quarter Momentum Assessment
Q2 achieved stabilization with flat productivity (PPI 98.75, consistent with Q1 ending)
and recovering finances (PWI +6.5% to 59.3, despite April volatility from shareholder
purchase). The quarter solidified foundations through contract work focus and sustained
intellectual engagement (12 pts/month average).

### Forward-Looking Priorities

Based on Q2 performance:

1. **Productivity Growth Activation**: Build on stable 98.75 baseline toward 100+ territory
   - **Data context**: Q2 averaged 97.92 with consistent output (97.5 → 97.5 → 98.75)
   - **Strategic response**: Q3 transition to full-time role provides platform for
     productivity acceleration

2. **Financial Momentum Sustaining**: Continue upward trajectory from 59.3 baseline
   - **Data context**: Recovered from Q1's 55.7 despite April spike to 91.2 (shareholder event)
   - **Strategic response**: Leverage employment stability for steady wealth accumulation

3. **Media Engagement Optimization**: Maintain strong 12 pts/month rhythm
   - **Data context**: Sustained high engagement (April 12, May 14, June 10)
   - **Strategic response**: Proven sustainable pattern - continue through Q3 role transition

### Q3 2025 Outlook
The MIKE Economy enters Q3 with stable foundations (98.75 PPI, 59.3 PWI) and strong
momentum indicators. Full-time role transition in September positions for potential
productivity acceleration. Primary Q3 objectives: break 100 PPI threshold, sustain
financial recovery trajectory, and maintain intellectual engagement through career shift.
Foundation is solid for growth phase.
```

### Example 3: Acceleration Quarter (Q3 2025)

```markdown
## Strategic Outlook

### Quarter Momentum Assessment
Q3 concluded with peak productivity (PPI 105, +6.3%) and major financial restructuring
(PWI 22.9, -61.4% due to August debt refactoring). The quarter demonstrated capacity
for sustained high output (101.67 average) while managing significant financial transitions.
Media consumption declined sharply (-50% to 5 pts) as focus shifted to career acceleration.

### Forward-Looking Priorities

Based on Q3 performance:

1. **Productivity Peak Sustainability**: Maintain 105 PPI momentum without burnout risk
   - **Data context**: Achieved 2025 peak (98.75 → 101.25 → 105) through dual projects
     and systems optimization
   - **Strategic response**: Codify September's optimization patterns, establish monitoring
     for fatigue signals, target 100-105 sustained range

2. **Financial Position Rebuilding**: Recover from debt refactoring reset
   - **Data context**: August dip to -3.5 recovered to 22.9 with employment stabilization,
     down from Q2's 59.3
   - **Strategic response**: Leverage stable employment and peak productivity for aggressive
     6-month wealth rebuilding campaign (target: 40+ by Q4 end, 60+ by Q1 2026)

3. **Comprehensive Indicator Suite Launch**: Activate KBER, SCI, and PHI tracking
   - **Data context**: Three indicators not tracked in Q1-Q3 (baseline establishment period)
   - **Strategic response**: Q4 represents full six-indicator economic monitoring capability,
     providing complete visibility into productivity, knowledge, social, health, wealth,
     and leisure metrics

4. **Work-Life Integration Rebalancing**: Restore sustainable media engagement from Q3 low
   - **Data context**: Consumption halved to 5 pts as career focus intensified (4 pts/month average)
   - **Strategic response**: Test 8-10 pts/month target in Q4 to restore intellectual
     engagement without compromising productivity gains

### Q4 2025 Outlook
The MIKE Economy enters Q4 with strong productivity momentum (105 PPI, best quarter of 2025),
stable employment foundation, and expanded monitoring capabilities launching. Three new
indicators (KBER, SCI, PHI) will provide comprehensive six-metric economic visibility.
Primary Q4 focus: sustaining peak performance (target: 100-105 PPI range), rebuilding
financial position (target: 40+ PWI by year-end, +75% from Q3), establishing new indicator
baselines, and restoring sustainable work-life integration (target: 8-10 media pts/month).
Foundation is positioned for comprehensive growth across all economic dimensions.
```

## Quarter Type Decision Tree

Use this to quickly identify which template style fits best:

**If PPI is volatile (±10+ swings) AND major life events in highlights:**
→ **Transition Quarter** (focus: stabilization, finding rhythm, recovery)

**If PPI is flat (±2%) AND "stable/consistent" appears in notes:**
→ **Stabilization Quarter** (focus: sustaining, building foundation, preparing for growth)

**If PPI reaches new highs AND "peak/surge/best" appears in notes:**
→ **Acceleration Quarter** (focus: sustainability, capitalizing on momentum, avoiding burnout)

**If PWI shows major restructuring (±50%+) AND debt/refactoring mentioned:**
→ **Restructuring Quarter** (focus: recovery, rebuilding, long-term positioning)

**If indicators are missing (null values) AND tracking launch mentioned:**
→ **Expansion Quarter** (focus: new capabilities, comprehensive monitoring, baseline establishment)

**Most quarters will be a combination** - identify 2-3 dominant themes and blend approaches.

## Language Guidelines

### DO Use:
- Specific numbers: "105 PPI", "22.9 PWI", "+6.3%"
- Actual events: "August debt refactoring", "dual projects", "employment stabilization"
- Monthly progressions: "98.75 → 101.25 → 105"
- Averages: "101.67 average", "4 pts/month average"
- Comparative terms: "peak of 2025", "best quarter", "lowest since Q1"
- Concrete targets: "target: 40+ PWI by Q4 end"

### DON'T Use:
- Generic optimism: "continued strong performance", "positive momentum"
- Vague goals: "revenue optimization", "productivity improvements"
- Ungrounded adjectives: "significant", "major" (without data)
- Copy-paste bullet lists that could apply to any quarter
- Strategic initiatives unconnected to actual performance

## Quality Checklist

Before finalizing, verify:

- [ ] All indicator mentions cite specific values from the JSON
- [ ] Monthly progressions are referenced when available
- [ ] Each priority has both "Data context" and "Strategic response"
- [ ] The forecast mentions specific targets or phase transitions
- [ ] Nothing in the Strategic Outlook could be copy-pasted to another quarter
- [ ] Someone reading only this section would understand the quarter's unique story
- [ ] Missing indicators (null values) are addressed appropriately
- [ ] Trade-offs are acknowledged (e.g., productivity ↑ while leisure ↓)

## Usage with LLMs

To generate a Strategic Outlook using this template with Claude or another LLM:

```
I need to generate a Strategic Outlook section for the [Quarter] [Year]
MIKE Economy quarterly report.

Please read:
1. The quarterly snapshot at /data/quarterly/[id].json
2. The instruction template at /instructions/strategic-outlook-template.md

Then write a data-driven Strategic Outlook section following the template
structure. Ensure all statements reference specific values, trends, and
events from the quarterly JSON data.
```

## Maintenance Notes

- Update this template as indicator suite evolves (e.g., when new metrics are added)
- Add new quarter type examples as different patterns emerge
- Refine language guidelines based on what works well in practice
- Archive exemplar Strategic Outlooks in `/instructions/examples/` for reference

---

**Version**: 1.0
**Last Updated**: 2025-11-12
**Covers**: Q1 2025 - Q3 2025 patterns
