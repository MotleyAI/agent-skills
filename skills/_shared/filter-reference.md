# Filter Reference

This document describes how to filter data in semantic layer queries using the Motley filtering system.

## Filter Types Overview

| Filter Type | Use Case |
|-------------|----------|
| `BasicFilter` | Static filters with hardcoded values |
| `BasicFilterTemplate` | Parameterized filters resolved at runtime |
| `TimeFilterTemplate` | Time-based filters for date range filtering |
| `CompositeFilter` | Logical combinations of filters (AND/OR) |
| `DerivedDimensionFilter` | Filters on computed/derived values |

## Required Imports

```python
# Core filter classes
from storyline.semantic.filter import BasicFilter, CompositeFilter, FilterOperator, LogicalOperator

# Filter templates for parameterized values
from storyline.domain.content.filter_template import BasicFilterTemplate

# Time filter template
from storyline.domain.content.time_filter_template import TimeFilterTemplate

# For parameterized filter values
from storyline.domain.resolve.normalized_reference import NormalizedReference

# Time interval configuration
from storyline.semantic.enums import TimeGranularity, TimeIntervalWithGranularity

# Query classes
from storyline.semantic.query import SemanticLayerQuery
from storyline.semantic.datasource import ColumnWithCubeName
```

---

## 1. BasicFilter (Static Filters)

Use `BasicFilter` when filter values are known at template creation time.

```python
BasicFilter(
    member=ColumnWithCubeName(name="status", cube_name="orders"),
    operator=FilterOperator.EQUALS,
    values=["completed"],
)
```

### Examples

```python
# Multiple values with IN operator
BasicFilter(
    member=ColumnWithCubeName(name="region", cube_name="sales"),
    operator=FilterOperator.IN,
    values=["North America", "Europe", "Asia"],
)

# Date range filtering
BasicFilter(
    member=ColumnWithCubeName(name="created_at", cube_name="orders"),
    operator=FilterOperator.IN_DATE_RANGE,
    values=["2025-01-01", "2025-12-31"],
)

# Numeric comparison
BasicFilter(
    member=ColumnWithCubeName(name="amount", cube_name="transactions"),
    operator=FilterOperator.GTE,
    values=[1000],
)

# Check field is set (not null)
BasicFilter(
    member=ColumnWithCubeName(name="request_sent_at", cube_name="prospect"),
    operator=FilterOperator.SET,
    values=[],
)
```

---

## 2. BasicFilterTemplate (Parameterized Filters)

Use `BasicFilterTemplate` when filter values are determined at runtime through context resolution.

```python
from storyline.domain.content.filter_template import BasicFilterTemplate
from storyline.domain.resolve.normalized_reference import NormalizedReference

# Create a reference to the runtime variable
customer_ref = NormalizedReference.from_raw(
    source_slide=None,  # None for global variables
    original_name="customer_name",  # Variable name in resolution context
)

filter_template = BasicFilterTemplate(
    member=ColumnWithCubeName(name="customer", cube_name="orders"),
    operator=FilterOperator.EQUALS,
    values_name=customer_ref,  # Reference to variable, NOT the value itself
)
```

### Standard Variable Names

The following variable names are automatically available in the standard resolution context:

| Variable | Description |
|----------|-------------|
| `end_date` | End date of the report period |
| `start_date` | Start date of the report period |
| `customer_name` | Customer/client filter value |
| `client_name` | Alias for customer_name |

See [resolution-context.md](resolution-context.md) for full list of auto-generated variables.

---

## 3. TimeFilterTemplate (Time Filtering)

Use `TimeFilterTemplate` for date range filtering that resolves relative to a context date.

### Relative Period (Last N periods)

```python
end_date_ref = NormalizedReference.from_raw(source_slide=None, original_name="end_date")

time_filter = TimeFilterTemplate(
    member=ColumnWithCubeName(name="time", cube_name="revenue"),
    time_interval=TimeIntervalWithGranularity(
        granularity=TimeGranularity.MONTH,
        count=12,  # Last 12 months
    ),
    end_date_variable=end_date_ref,
)
```

### Explicit Date Range

```python
start_date_ref = NormalizedReference.from_raw(source_slide=None, original_name="start_date")
end_date_ref = NormalizedReference.from_raw(source_slide=None, original_name="end_date")

time_filter = TimeFilterTemplate(
    member=ColumnWithCubeName(name="time", cube_name="revenue"),
    start_date_variable=start_date_ref,
    end_date_variable=end_date_ref,
)
```

### Period-to-Date (YTD, QTD, MTD, WTD)

Use `count="to_date"` for period-to-date filtering:

```python
# Year-to-Date (YTD)
ytd_filter = TimeFilterTemplate(
    member=ColumnWithCubeName(name="created_at", cube_name="transactions"),
    time_interval=TimeIntervalWithGranularity(
        granularity=TimeGranularity.YEAR,
        count="to_date",  # Special value for period-to-date
    ),
    end_date_variable=end_date_ref,
)

# Quarter-to-Date (QTD)
qtd_filter = TimeFilterTemplate(
    member=ColumnWithCubeName(name="created_at", cube_name="transactions"),
    time_interval=TimeIntervalWithGranularity(
        granularity=TimeGranularity.QUARTER,
        count="to_date",
    ),
    end_date_variable=end_date_ref,
)

# Month-to-Date (MTD)
mtd_filter = TimeFilterTemplate(
    member=ColumnWithCubeName(name="created_at", cube_name="transactions"),
    time_interval=TimeIntervalWithGranularity(
        granularity=TimeGranularity.MONTH,
        count="to_date",
    ),
    end_date_variable=end_date_ref,
)
```

### Future Date Range (Negative Count)

Use negative count to filter forward from end_date:

```python
# Filter 3 months forward from end_date
future_filter = TimeFilterTemplate(
    member=ColumnWithCubeName(name="scheduled_date", cube_name="tasks"),
    time_interval=TimeIntervalWithGranularity(
        granularity=TimeGranularity.MONTH,
        count=-3,  # Negative count = forward
    ),
    end_date_variable=end_date_ref,
)
```

| Count | Direction | Date Range |
|-------|-----------|------------|
| `3` (positive) | Backward | `[end_date - 3 periods + 1 day, end_date]` |
| `-3` (negative) | Forward | `[end_date, end_date + 3 periods - 1 day]` |
| `"to_date"` | Period start | `[period_start(end_date), end_date]` |

---

## 4. CompositeFilter (Logical Combinations)

Combine multiple filters with AND/OR logic:

```python
from storyline.semantic.filter import CompositeFilter, LogicalOperator

# OR logic: status is "active" OR "pending"
or_filter = CompositeFilter(
    filters=[
        BasicFilter(member=status_col, operator=FilterOperator.EQUALS, values=["active"]),
        BasicFilter(member=status_col, operator=FilterOperator.EQUALS, values=["pending"]),
    ],
    operator=LogicalOperator.OR,
)

# AND logic (default): region is "US" AND amount >= 1000
and_filter = CompositeFilter(
    filters=[
        BasicFilter(member=region_col, operator=FilterOperator.EQUALS, values=["US"]),
        BasicFilter(member=amount_col, operator=FilterOperator.GTE, values=[1000]),
    ],
    operator=LogicalOperator.AND,
)
```

---

## 5. DerivedDimensionFilter

Use `DerivedDimensionFilter` when you need to filter based on computed values that require sub-query evaluation:

```python
from storyline.semantic.derived_dimension import DerivedDimension, DerivedDimensionFilter

# Filter schools where usage increased week-over-week
DerivedDimensionFilter(
    derived_dimension=DerivedDimension(
        name="usage_change",
        expression="last(change(lesson_completions.count))",
    ),
    operator=FilterOperator.GT,
    value=0,
)
```

For full documentation, see the `derived-dimensions` skill.

---

## FilterOperator Reference

| Operator | Description | Example Values |
|----------|-------------|----------------|
| `EQUALS` | Exact match | `["value"]` |
| `NOT_EQUALS` | Not equal | `["value"]` |
| `CONTAINS` | String contains substring | `["substr"]` |
| `NOT_CONTAINS` | String does not contain | `["substr"]` |
| `STARTS_WITH` | String starts with prefix | `["prefix"]` |
| `NOT_STARTS_WITH` | String does not start with | `["prefix"]` |
| `ENDS_WITH` | String ends with suffix | `["suffix"]` |
| `NOT_ENDS_WITH` | String does not end with | `["suffix"]` |
| `GT` | Greater than | `[100]` |
| `GTE` | Greater than or equal | `[100]` |
| `LT` | Less than | `[100]` |
| `LTE` | Less than or equal | `[100]` |
| `IN` | Value in list | `["a", "b", "c"]` |
| `SET` | Value is set (not null) | `[]` |
| `NOT_SET` | Value is not set (null) | `[]` |
| `IN_DATE_RANGE` | Date within range (inclusive) | `["2025-01-01", "2025-12-31"]` |
| `NOT_IN_DATE_RANGE` | Date outside range | `["2025-01-01", "2025-12-31"]` |
| `BEFORE_DATE` | Date before specified date | `["2025-01-01"]` |
| `AFTER_DATE` | Date after specified date | `["2025-01-01"]` |
| `MEASURE_FILTER` | Filter on aggregated measure value | `[1000]` |

---

## When to Use Each Filter Type

| Use Case | Filter Type |
|----------|-------------|
| Fixed, hardcoded filter values | `BasicFilter` |
| Filter value from runtime context | `BasicFilterTemplate` |
| Date range relative to report period | `TimeFilterTemplate` with `time_interval` |
| Explicit start/end date from context | `TimeFilterTemplate` with `start_date_variable` |
| YTD/QTD/MTD filtering | `TimeFilterTemplate` with `count="to_date"` |
| Future date range from report period | `TimeFilterTemplate` with negative `count` |
| Complex AND/OR logic | `CompositeFilter` |
| Filter on computed/derived values | `DerivedDimensionFilter` |
