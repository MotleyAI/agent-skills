# Query Fundamentals

This document explains how to create `SemanticLayerQuery` objects for use in ChartTemplate, NumericalQueryTemplate, and other query-based templates.

## Required Imports

```python
from storyline.semantic.query import SemanticLayerQuery, ColumnWithCubeName
from storyline.semantic.query_components import QueryTimeDimension
from storyline.semantic.datasource import DimensionParent
from storyline.semantic.enums import TimeGranularity, Order
from storyline.cube.cube_models import CubeDataType
```

## Prerequisites

All examples assume you have:
- `cube_models`: Dictionary of Cube objects mapping a cube name to a Cube object
- `cube`: A Cube object obtained via `cube = cube_models["cube_name"]`

---

## Core Query Fields

### measures

A list of measure columns to aggregate. Measures are typically counts, sums, averages, or other aggregate functions.

```python
# Using ColumnWithCubeName directly
measures=[ColumnWithCubeName(name="total_revenue", cube_name="revenue")]

# Using cube.get_measure() (preferred pattern)
measures=[cube.get_measure(name="total_revenue", strict=True)]

# Multiple measures (only valid with 0 or 1 dimension)
measures=[
    cube.get_measure(name="total_revenue", strict=True),
    cube.get_measure(name="transaction_count", strict=True),
]
```

### dimensions

A list of non-time dimension columns for grouping results.

```python
# Using ColumnWithCubeName directly
dimensions=[ColumnWithCubeName(name="region", cube_name="sales")]

# Using cube.get_dimension() (preferred pattern)
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

A list of time-based dimensions with granularity for time-series queries.

```python
from storyline.semantic.query_components import QueryTimeDimension
from storyline.semantic.enums import TimeGranularity

# Time dimension with monthly granularity
time_dimensions=[
    QueryTimeDimension(
        dimension=cube.get_dimension(name="created_at", strict=True),
        granularity=TimeGranularity.MONTH,
    )
]

# Empty time_dimensions (non-time-series query)
time_dimensions=[]
```

**Available granularities:**
- `TimeGranularity.DAY`
- `TimeGranularity.WEEK`
- `TimeGranularity.MONTH`
- `TimeGranularity.QUARTER`
- `TimeGranularity.YEAR`

### dateRange on QueryTimeDimension

For rolling window measures or fixed date range queries:

```python
time_dimensions=[
    QueryTimeDimension(
        dimension=cube.get_dimension(name="timestamp", strict=True),
        granularity=TimeGranularity.MONTH,
        dateRange=["2020-01-01", "2025-06-30"],  # Fixed date range
    )
]
```

---

## Ordering and Limiting

### order

A list of tuples specifying sort order. Each tuple contains a fully-qualified column name and an `Order` enum value.

```python
from storyline.semantic.enums import Order

# Order by a measure descending
order=[("revenue.total_revenue", Order.DESC)]

# Order by dimension ascending
order=[("sales.region", Order.ASC)]

# Multiple order criteria
order=[
    ("sales.region", Order.ASC),
    ("sales.total_revenue", Order.DESC),
]
```

**Important**: The column name MUST be fully qualified with the cube name (e.g., `"cube_name.column_name"`).

### limit

An integer limiting the number of rows returned.

```python
limit=10  # Return top 10 results
```

---

## Dimension Count Constraints

When using queries in `ChartTemplate`, the following constraints apply:

| Dimensions | Time Dimensions | Total | Measures Allowed |
|------------|-----------------|-------|------------------|
| 0 | 0 | 0 | Multiple |
| 1 | 0 | 1 | Multiple |
| 0 | 1 | 1 | Multiple |
| 2 | 0 | 2 | Exactly 1 |
| 1 | 1 | 2 | Exactly 1 |

**Important notes:**
- Time dimensions count toward the total dimension count
- With 2 total dimensions, the second dimension is pivoted into series on the chart
- If both a time dimension and non-time dimension are present, the time dimension is treated as coming first (x-axis)

---

## Complete Examples

### Time-series query (monthly data)

```python
arpu_by_month_query = SemanticLayerQuery(
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

### Categorical query with ordering and limit

```python
top_regions_query = SemanticLayerQuery(
    measures=[cube.get_measure(name="total_revenue", strict=True)],
    dimensions=[cube.get_dimension(name="region", strict=True)],
    time_dimensions=[],
    order=[("revenue.total_revenue", Order.DESC)],
    limit=10,
)
```

### Aggregate-only query (no dimensions)

```python
total_credits_query = SemanticLayerQuery(
    measures=[cube.get_measure(name="total_credits", strict=True)],
    dimensions=[],
    time_dimensions=[],
)
```

---

## Best Practices

1. **Use `cube.get_measure()` and `cube.get_dimension()`** with `strict=True` to validate that columns exist
2. **Always fully qualify order columns** with the cube name (e.g., `"cube.column"`)
3. **Keep dimension count to 2 or fewer** for chart compatibility
4. **Use `limit` with `order`** when you only need top N results
5. **Use empty lists `[]`** for unused fields rather than omitting them for clarity

---

## Related Documentation

- For filters: see [filter-reference.md](filter-reference.md)
- For computed expressions: see [query-expressions.md](query-expressions.md)
- For derived dimensions: see the `derived-dimensions` skill
