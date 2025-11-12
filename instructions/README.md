# MIKE Economic Data - Instructions & Templates

This directory contains instruction templates and guidelines for creating content for the MIKE Economy dashboard.

## Available Templates

### Strategic Outlook Template
**File**: `strategic-outlook-template.md`

**Purpose**: Generate data-driven Strategic Outlook sections for quarterly reports that reference actual indicator values, trends, and events rather than generic platitudes.

**When to use**:
- Writing new quarterly reports (Q4 2025, 2026 quarters, etc.)
- Updating existing reports with better Strategic Outlook sections
- Training LLMs to generate report content

**What it covers**:
- How to extract insights from quarterly JSON snapshots
- Step-by-step process for writing data-specific priorities
- Examples for different quarter types (transition, stabilization, acceleration)
- Language guidelines (specific numbers vs. generic optimism)
- Quality checklist to ensure data-driven content

**Quick start**:
```bash
# To use this template with Claude or another LLM:
cat instructions/strategic-outlook-template.md

# Then provide the quarterly JSON:
cat data/quarterly/q3-2025.json

# And ask the LLM to generate a Strategic Outlook section
# following the template structure
```

## Directory Structure

```
instructions/
├── README.md                          # This file - index of available templates
├── strategic-outlook-template.md      # Template for quarterly report Strategic Outlook sections
└── examples/                          # (Future) Archive of exemplar outputs
    ├── q3-2025-strategic-outlook.md
    └── ...
```

## Contributing New Templates

When adding new instruction templates to this directory:

1. Create a descriptive filename (e.g., `executive-summary-template.md`)
2. Include clear usage instructions and examples
3. Reference specific data sources (CSV files, JSON snapshots, etc.)
4. Add the template to this README index
5. Version your template (include "Last Updated" date)

## Related Documentation

- **Project README**: `/README.md` - Overall project setup and deployment
- **CLAUDE.md**: `/CLAUDE.md` - Development guidelines for Claude Code
- **Data Files**: `/data/` - CSV indicator data and quarterly snapshots
- **Report Pages**: `/app/reports/` - Next.js pages that render the reports

---

**Last Updated**: 2025-11-12
