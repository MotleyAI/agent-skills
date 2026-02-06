# Skills Reference

This document provides an overview of the skills included in the Motley bundle. These skills help Claude understand how to work with the Motley domain model.

## Core Skills

### create-edit-chart

Create data visualizations including bar charts, line charts, pie charts, and funnels.

**Key concepts:**
- `ChartTemplate` - Container for chart configuration
- `ChartDetailsTemplate` - Appearance settings (series, axes, legend)
- `SeriesConfig` - Per-series type, axis, and formatting
- Query dimension constraints (max 2 dimensions total)

**Use cases:**
- Bar/line charts for time series data
- Dual-axis charts with different scales
- Period-over-period comparisons
- Funnel charts for conversion analysis

[Full documentation →](../skills/create-edit-chart/SKILL.md)

---

### create-edit-text-block

Generate text content with variable substitution and optional LLM enhancement.

**Key concepts:**
- `TextBlockTemplate` - Template with `{variable}` placeholders
- `call_llm` - Toggle between direct substitution and LLM generation
- `allowed_outputs` - Constrain LLM to specific responses
- Expression syntax for arithmetic and formatting

**Use cases:**
- Static text with data substitution
- LLM-generated summaries from query data
- Constrained outputs for deterministic text
- Cross-slide content references

[Full documentation →](../skills/create-edit-text-block/SKILL.md)

---

### create-edit-table-block

Create formatted tables with flexible sizing and pivoting.

**Key concepts:**
- `TableBlockTemplate` - Extension of TextBlockTemplate for tables
- `target_shape` - Specify table dimensions or ranges
- Query output modes (TABLE vs SINGLE_NUMBER)
- Pivot dimensions for columnar data

**Use cases:**
- Data tables from query results
- LLM-formatted tables with row ranges
- Direct markdown templates with expressions
- Pivoted time series as columns

[Full documentation →](../skills/create-edit-table-block/SKILL.md)

---

### create-query

Build semantic layer queries for data retrieval.

**Key concepts:**
- `SemanticLayerQuery` - Query with measures, dimensions, filters
- `QueryTimeDimension` - Time dimensions with granularity
- Filter types (BasicFilter, BasicFilterTemplate, TimeFilterTemplate)
- NumericalQueryMode (SINGLE_NUMBER vs TABLE)

**Use cases:**
- Aggregate queries (totals, counts)
- Time series with date grouping
- Top N queries with ordering
- Parameterized filters from context

[Full documentation →](../skills/create-query/SKILL.md)

---

## Shared Reference Documents

These documents provide foundational knowledge used across skills:

### query-fundamentals.md

Core query concepts including:
- Measures and dimensions
- Time dimensions with granularity
- Ordering and limiting results
- Dimension count constraints

[View →](../skills/_shared/query-fundamentals.md)

### filter-reference.md

Complete filter documentation:
- BasicFilter for static values
- BasicFilterTemplate for runtime values
- TimeFilterTemplate for date ranges
- CompositeFilter for AND/OR logic
- DerivedDimensionFilter for computed values

[View →](../skills/_shared/filter-reference.md)

### content-block-fundamentals.md

Expression syntax for templates:
- Variable references `{name}`
- Arithmetic operations
- Formatting functions (percent, integer, number, currency)
- Cross-slide references `{Slide::Block}`

[View →](../skills/_shared/content-block-fundamentals.md)

### numerical-query-block.md

NumericalQueryBlock configuration:
- SINGLE_NUMBER vs TABLE modes
- Column extraction
- Pivot dimensions
- Filter templates

[View →](../skills/_shared/numerical-query-block.md)

### query-expressions.md

QueryExpression for computed columns:
- Arithmetic on query results
- Available functions (floor, ceil, round, abs, diff)
- Required dimensions/measures
- Comparison with DerivedDimension

[View →](../skills/_shared/query-expressions.md)

### resolution-context.md

Auto-generated context variables:
- end_month, start_month, quarter
- now_date, now_month
- customer_name alias
- Using variables in filters and templates

[View →](../skills/_shared/resolution-context.md)

---

## Quick Reference

### Expression Functions

| Function | Description | Example |
|----------|-------------|---------|
| `{percent(x)}` | Format as percentage | `{percent(0.45)}` → "45%" |
| `{integer(x)}` | Round to integer | `{integer(3.7)}` → "4" |
| `{number(x, decimals=N)}` | Format with decimals | `{number(3.14159, decimals=2)}` → "3.14" |
| `{currency(x)}` | Format as currency | `{currency(1000)}` → "$1,000" |
| `{sum(ref)}` | Sum numeric columns | `{sum(Chart)}` |

### Time Granularities

| Granularity | Use Case |
|-------------|----------|
| `DAY` | Daily data |
| `WEEK` | Weekly rollups |
| `MONTH` | Monthly reports |
| `QUARTER` | Quarterly analysis |
| `YEAR` | Annual comparisons |

### Chart Types

| Type | Best For |
|------|----------|
| `BAR` | Categorical comparisons |
| `LINE` | Trends over time |
| `PIE` | Part-to-whole |
| `FUNNEL` | Conversion stages |

### Filter Operators

| Operator | Description |
|----------|-------------|
| `EQUALS` | Exact match |
| `IN` | Value in list |
| `GT/GTE/LT/LTE` | Numeric comparisons |
| `CONTAINS` | Substring match |
| `SET/NOT_SET` | Null checks |
| `IN_DATE_RANGE` | Date range |
