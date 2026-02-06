---
name: create-query
description: Create SemanticLayerQuery objects for data retrieval from the semantic layer. Use when building queries with measures, dimensions, filters, and time dimensions.
---

# Creating SemanticLayerQuery

This skill covers creating queries for use in ChartTemplate, NumericalQueryTemplate, and other query-based templates.

## Required Imports

from storyline.semantic.query import SemanticLayerQuery
from storyline.semantic.datasource import ColumnWithCubeName
from storyline.semantic.query_components import QueryTimeDimension
from storyline.semantic.enums import TimeGranularity, Order
from storyline.semantic.filter import BasicFilter, FilterOperator
from storyline.domain.content.filter_template import BasicFilterTemplate
from storyline.domain.content.time_filter_template import TimeFilterTemplate, TimeIntervalWithGranularity
from storyline.domain.resolve.normalized_reference import NormalizedReference
```

---

## Core Query Fields

### measures

```python
# Using cube.get_measure() (preferred)
measures=[cube.get_measure(name="total_revenue", strict=True)]

# Multiple measures (only valid with 0 or 1 dimension)
measures=[
    cube.get_measure(name="total_revenue", strict=True),
    cube.get_measure(name="transaction_count", strict=True),
]
```

### dimensions

```python
# Using cube.get_dimension() (preferred)
dimensions=[cube.get_dimension(name="region", strict=True)]

# Multiple dimensions (max 2 total including time_dimensions)
dimensions=[
    cube.get_dimension(name="region", strict=True),
    cube.get_dimension(name="product_category", strict=True),
]

# Empty dimensions (aggregate across all data)
dimensions=[]
```

### time_dimensions

```python
time_dimensions=[
    QueryTimeDimension(
        dimension=cube.get_dimension(name="created_at", strict=True),
        granularity=TimeGranularity.MONTH,
    )
]
```

**Available granularities**: `DAY`, `WEEK`, `MONTH`, `QUARTER`, `YEAR`

### order and limit

```python
# Order by measure descending
order=[("revenue.total_revenue", Order.DESC)]

# Limit results
limit=10
```

**Important**: Column names must be fully qualified: `"cube_name.column_name"`

---

## Dimension Constraints (for Charts)

| Dimensions | Time Dimensions | Total | Measures Allowed |
|------------|-----------------|-------|------------------|
| 0 | 0 | 0 | Multiple |
| 1 | 0 | 1 | Multiple |
| 0 | 1 | 1 | Multiple |
| 2 | 0 | 2 | Exactly 1 |
| 1 | 1 | 2 | Exactly 1 |

---

## Adding Filters

### Static Filter (BasicFilter)

```python
BasicFilter(
    member=cube.get_dimension(name="status", strict=True),
    operator=FilterOperator.EQUALS,
    values=["completed"],
)
```

### Parameterized Filter (BasicFilterTemplate)

```python
BasicFilterTemplate(
    member=cube.get_dimension(name="client_name", strict=True),
    operator=FilterOperator.EQUALS,
    values_name=NormalizedReference.from_raw(
        source_slide=None,
        original_name="customer_name",
    ),
)
```

### Time Filter (TimeFilterTemplate)

```python
# Last 12 months
TimeFilterTemplate(
    member=cube.get_dimension(name="time", strict=True),
    time_interval=TimeIntervalWithGranularity(
        granularity=TimeGranularity.MONTH,
        count=12,
    ),
    end_date_variable=NormalizedReference.from_raw(
        source_slide=None, original_name="end_date"
    ),
)

# Year-to-date
TimeFilterTemplate(
    member=cube.get_dimension(name="time", strict=True),
    time_interval=TimeIntervalWithGranularity(
        granularity=TimeGranularity.YEAR,
        count="to_date",
    ),
    end_date_variable=end_date_ref,
)
```

See [_shared/filter-reference.md](../_shared/filter-reference.md) for complete filter documentation.

---

## Complete Examples

### Time-Series Query

```python
query = SemanticLayerQuery(
    measures=[cube.get_measure(name="avg_revenue_per_user", strict=True)],
    dimensions=[],
    time_dimensions=[
        QueryTimeDimension(
            dimension=cube.get_dimension(name="time", strict=True),
            granularity=TimeGranularity.MONTH,
        )
    ],
)
```

### Top N Query

```python
query = SemanticLayerQuery(
    measures=[cube.get_measure(name="total_revenue", strict=True)],
    dimensions=[cube.get_dimension(name="region", strict=True)],
    time_dimensions=[],
    order=[("revenue.total_revenue", Order.DESC)],
    limit=10,
)
```

### Filtered Query

```python
end_date_ref = NormalizedReference.from_raw(source_slide=None, original_name="end_date")
customer_ref = NormalizedReference.from_raw(source_slide=None, original_name="customer_name")

query = SemanticLayerQuery(
    measures=[cube.get_measure(name="revenue", strict=True)],
    dimensions=[],
    time_dimensions=[
        QueryTimeDimension(
            dimension=cube.get_dimension(name="time", strict=True),
            granularity=TimeGranularity.MONTH,
        )
    ],
    filters=[
        TimeFilterTemplate(
            member=cube.get_dimension(name="time", strict=True),
            time_interval=TimeIntervalWithGranularity(
                granularity=TimeGranularity.MONTH,
                count=12,
            ),
            end_date_variable=end_date_ref,
        ),
        BasicFilterTemplate(
            member=cube.get_dimension(name="client", strict=True),
            operator=FilterOperator.EQUALS,
            values_name=customer_ref,
        ),
    ],
)
```

---

## NumericalQueryMode (for `update_query_block` MCP tool)

When queries are used inside `NumericalQueryTemplate` (e.g. via the `update_query_block` MCP tool), the `mode` parameter controls how results are returned.

### Modes

| Mode | Value | Description |
|------|-------|-------------|
| `SINGLE_NUMBER` | `"single_number"` | Returns a single aggregate value. The query should use at most two measures (one for value, optionally one for ordering). This is the default. |
| `TABLE` | `"table"` | Returns a full result set with multiple rows/columns. Supports pivoting via `pivot_dimension` and transposing via `transpose`. |

### When to use each mode

- **`single_number`**: KPIs, totals, counts, percentages — any metric that resolves to one number. Example: "Total revenue for Q4", "Number of active users".
- **`table`**: Breakdowns, rankings, comparisons — any query that returns multiple rows. Example: "Revenue by region", "Top 10 customers by spend".

### Related `NumericalQueryTemplate` fields (TABLE mode)

- **`pivot_dimension`**: Dimension to pivot into columns. Accepts `"dim_name"`, `"cube.dim_name"`, or a `ColumnWithCubeName` object. If `None`, no pivot is performed.
- **`transpose`**: When `True`, swaps rows and columns in the exported markdown table. Only meaningful with `mode=TABLE`.

### Using mode with the `update_query_block` MCP tool

The `update_query_block` tool accepts an optional `mode` parameter (string):

- `mode="single_number"` (default) — adds single-number constraints to the LLM prompt
- `mode="table"` — skips single-number constraints, allowing multi-row/multi-column results

---

## Best Practices

1. **Use `cube.get_measure()` and `cube.get_dimension()`** with `strict=True`
2. **Always fully qualify order columns**: `"cube_name.column_name"`
3. **Keep dimension count to 2 or fewer** for chart compatibility
4. **Use `limit` with `order`** for top N results
5. **Use empty lists `[]`** for unused fields

---

## Related Documentation

- Full query docs: [_shared/query-fundamentals.md](../_shared/query-fundamentals.md)
- Filter docs: [_shared/filter-reference.md](../_shared/filter-reference.md)
- Computed expressions: [_shared/query-expressions.md](../_shared/query-expressions.md)
- Context variables: [_shared/resolution-context.md](../_shared/resolution-context.md)
- For grouping/filtering by computed values: see the `derived-dimensions` skill
