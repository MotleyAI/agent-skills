# Skills Reference

This document provides an overview of the skills included in the Motley bundle. Skills help Claude understand how to work with the Motley domain model for data-driven presentation generation.

## When to Use Each Skill

| Task | Skill |
|------|-------|
| Build queries for charts or metrics | [create-query](#create-query) |
| Create bar/line/pie/funnel charts | [create-edit-chart](#create-edit-chart) |
| Generate text content with variables | [create-edit-text-block](#create-edit-text-block) |
| Create data tables | [create-edit-table-block](#create-edit-table-block) |
| Period-over-period calculations | [derived-dimensions](#derived-dimensions) |
| Filter by computed values | [derived-dimensions](#derived-dimensions) |

---

## Core Skills

### create-query

Build SemanticLayerQuery objects for data retrieval from the semantic layer.

**When to use**: Building queries with measures, dimensions, filters, and time dimensions for use in charts, tables, or text blocks.

**Key concepts:**
- `SemanticLayerQuery` - Query container with measures, dimensions, filters
- `QueryTimeDimension` - Time dimensions with granularity (DAY, WEEK, MONTH, QUARTER, YEAR)
- Filter types: `BasicFilter` (static), `BasicFilterTemplate` (parameterized), `TimeFilterTemplate` (date ranges)
- `NumericalQueryMode` - SINGLE_NUMBER for KPIs, TABLE for breakdowns

**Use cases:**
- Aggregate queries (totals, counts, averages)
- Time series with date grouping
- Top N queries with ordering
- Parameterized filters from context variables

**Dimension constraints for charts:**

| Dimensions | Time Dimensions | Total | Measures Allowed |
|------------|-----------------|-------|------------------|
| 0 | 0 | 0 | Multiple |
| 1 | 0 | 1 | Multiple |
| 0 | 1 | 1 | Multiple |
| 2 | 0 | 2 | Exactly 1 |
| 1 | 1 | 2 | Exactly 1 |

[Full documentation](../skills/create-query/SKILL.md)

---

### create-edit-chart

Create data visualizations including bar charts, line charts, pie charts, and funnels.

**When to use**: Creating any chart or graph visualization that displays query data.

**Key concepts:**
- `ChartTemplate` - Container for chart configuration with query and appearance
- `ChartDetailsTemplate` - Appearance settings (series, axes, legend, colors)
- `SeriesConfig` - Per-series type (BAR, LINE, PIE, FUNNEL), axis assignment, formatting
- `compare_date_range_offsets` - Period-over-period comparison (e.g., `[-1]` for YoY)

**Use cases:**
- Bar/line charts for time series data
- Dual-axis charts with different scales (revenue + margin)
- Period-over-period comparisons (current vs previous)
- Funnel charts for conversion analysis
- Pie charts for part-to-whole breakdowns

**Chart types:**

| Type | Best For |
|------|----------|
| `BAR` | Categorical comparisons, time series |
| `LINE` | Trends over time, continuous data |
| `PIE` | Part-to-whole, distribution |
| `FUNNEL` | Conversion stages, sequential processes |

[Full documentation](../skills/create-edit-chart/SKILL.md)

---

### create-edit-text-block

Generate text content with variable substitution and optional LLM enhancement.

**When to use**: Creating text content that includes data values, summaries, or LLM-generated insights.

**Key concepts:**
- `TextBlockTemplate` - Template with `{variable}` placeholders
- `call_llm` - Toggle between direct substitution (false) and LLM generation (true)
- `allowed_outputs` - Constrain LLM to specific responses for deterministic output
- Expression syntax for arithmetic (`{a/b}`) and formatting (`{percent(x)}`)

**Use cases:**
- Static text with data substitution (KPI displays, titles)
- LLM-generated summaries from query data
- Constrained outputs for categorization (plan recommendations)
- Cross-slide content references (`{SlideName::BlockName}`)

**Mode selection:**

| When | Query Mode |
|------|------------|
| `call_llm=False` | SINGLE_NUMBER - inline values |
| `call_llm=True` | TABLE - data for LLM analysis |

[Full documentation](../skills/create-edit-text-block/SKILL.md)

---

### create-edit-table-block

Create formatted tables with flexible sizing and pivoting.

**When to use**: Creating data tables, comparison tables, or any tabular content in slides.

**Key concepts:**
- `TableBlockTemplate` - Extension of TextBlockTemplate for tables
- `target_shape` - Specify table dimensions: exact `(3, 3)`, range `((1, 11), 2)`, or unconstrained `None`
- Query output modes: TABLE for full datasets, SINGLE_NUMBER for individual cells
- `pivot_dimension` - Transform dimension values into columns

**Use cases:**
- Data tables from query results
- LLM-formatted tables with row constraints
- Direct markdown templates with expressions
- Pivoted time series (months as columns)

**target_shape formats:**

| Format | Description |
|--------|-------------|
| `None` | No constraint |
| `(3, 3)` | Exactly 3 rows, 3 columns |
| `(5, None)` | Exactly 5 rows, any columns |
| `((1, 11), 2)` | 1-11 rows, exactly 2 columns |

[Full documentation](../skills/create-edit-table-block/SKILL.md)

---

### derived-dimensions

Create DerivedDimension and DerivedDimensionFilter for advanced time-series calculations or filtering/grouping by computed values.

**When to use**: Period-over-period comparisons (week-over-week change), filtering by computed metrics (show entities where usage decreased), or grouping by computed buckets.

**Key concepts:**
- `DerivedDimension` - Dimension created from expression evaluation via sub-query
- `DerivedDimensionFilter` - Filter based on computed values
- Time-series functions: `change()`, `last()`, `change_latest()`
- Sub-query evaluation with optional dimension inheritance

**Available functions:**

| Function | Description | Example |
|----------|-------------|---------|
| `change(cube.measure)` | Period-over-period change | `change(usage.count)` |
| `last(cube.measure)` | Most recent value per dimension | `last(usage.count)` |
| `last(change(...))` | Current period's change from previous | `last(change(usage.count))` |

**Use cases:**
- Filter schools where usage decreased week-over-week
- Group customers by engagement bucket
- Calculate period-over-period metrics for filtering

**Example - Filter by computed change:**

```python
from storyline.semantic.derived_dimension import DerivedDimension, DerivedDimensionFilter
from storyline.semantic.filter import FilterOperator

# Filter entities where usage increased
DerivedDimensionFilter(
    derived_dimension=DerivedDimension(
        name="usage_change",
        expression="last(change(lesson_completions.count))",
    ),
    operator=FilterOperator.GT,
    value=0,
)
```

**Key differences from QueryExpression:**

| Use Case | Solution |
|----------|----------|
| Compute ratio as column (post-query) | `QueryExpression` |
| Row-by-row consecutive diff | `QueryExpression` with `diff()` |
| Period-over-period change | `DerivedDimension` with `change()` |
| Group by ratio bucket | `DerivedDimension` with `evaluation_dimensions` |
| Filter where computed value > X | `DerivedDimensionFilter` |

**DerivedDimension fields:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | str | Name of the derived dimension |
| `expression` | str | Expression to evaluate |
| `evaluation_dimensions` | list | Explicit dimensions for sub-query |
| `inherit_dimensions` | bool | Include parent query's dimensions (default: true) |
| `inherit_filters` | bool | Inherit static filters from parent (default: true) |

---

## Shared Reference Documents

These documents provide foundational knowledge used across skills:

### query-fundamentals.md

Core query concepts including:
- Measures and dimensions
- Time dimensions with granularity
- Ordering and limiting results
- Dimension count constraints

[View](../skills/_shared/query-fundamentals.md)

### filter-reference.md

Complete filter documentation:
- BasicFilter for static values
- BasicFilterTemplate for runtime values
- TimeFilterTemplate for date ranges
- CompositeFilter for AND/OR logic
- DerivedDimensionFilter for computed values

[View](../skills/_shared/filter-reference.md)

### content-block-fundamentals.md

Expression syntax for templates:
- Variable references `{name}`
- Arithmetic operations
- Formatting functions (percent, integer, number, currency)
- Cross-slide references `{Slide::Block}`

[View](../skills/_shared/content-block-fundamentals.md)

### numerical-query-block.md

NumericalQueryBlock configuration:
- SINGLE_NUMBER vs TABLE modes
- Column extraction
- Pivot dimensions
- Filter templates

[View](../skills/_shared/numerical-query-block.md)

### query-expressions.md

QueryExpression for computed columns:
- Arithmetic on query results
- Available functions (floor, ceil, round, abs, diff)
- Required dimensions/measures
- Comparison with DerivedDimension

[View](../skills/_shared/query-expressions.md)

### resolution-context.md

Auto-generated context variables:
- end_month, start_month, quarter
- now_date, now_month
- customer_name alias
- Using variables in filters and templates

[View](../skills/_shared/resolution-context.md)

---

## Quick Reference

### Expression Functions

| Function | Description | Example |
|----------|-------------|---------|
| `{percent(x)}` | Format as percentage | `{percent(0.45)}` -> "45%" |
| `{integer(x)}` | Round to integer | `{integer(3.7)}` -> "4" |
| `{number(x, decimals=N)}` | Format with decimals | `{number(3.14159, decimals=2)}` -> "3.14" |
| `{currency(x)}` | Format as currency | `{currency(1000)}` -> "$1,000" |
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

---

## Related Documentation

- [MCP Tools Reference](tools.md) - All 32 MCP tools
- [Setup Guide](setup.md) - Installation and configuration
