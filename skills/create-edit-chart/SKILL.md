---
name: create-edit-chart
description: Create or edit ChartTemplate for data visualizations (bar, line, pie, funnel). Use when creating charts, graphs, or visual data representations.
---

# Creating and Editing ChartTemplate

## Required Imports

```python
from storyline.domain.content.chart_block import ChartTemplate
from storyline.domain.chart.pivot_chart import (
    AxisConfig,
    ChartDetailsTemplate,
    ChartType,
    LeftRightAxis,
    LegendConfig,
    SeriesConfig,
)
from storyline.domain.format import NumberFormat, NumberFormatType
from storyline.semantic.query import SemanticLayerQuery
from storyline.semantic.query_components import QueryTimeDimension
from storyline.semantic.enums import TimeGranularity, Order
```

---

## ChartTemplate Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | str | Chart identifier |
| `cube_name` | str | The cube the chart is based on |
| `query` | SemanticLayerQuery | Data query (see [query-fundamentals.md](../_shared/query-fundamentals.md)) |
| `chart_details` | ChartDetailsTemplate | Appearance configuration |
| `compare_date_range_offsets` | list[int] | Period comparison offsets (optional) |

---

## Query Dimension Constraints

| Total Dimensions | Measures Allowed | Behavior |
|------------------|------------------|----------|
| 0 | Multiple | Aggregate totals |
| 1 | Multiple | Single dimension on X-axis, measures as series |
| 2 | Exactly 1 | First dimension on X-axis, second pivoted to series |

**Important**: Time dimensions count toward the dimension total. Maximum 2 dimensions allowed.

---

## ChartDetailsTemplate

### SeriesConfig

```python
SeriesConfig(
    type=ChartType.BAR,       # BAR, LINE, PIE, FUNNEL
    y_axis=LeftRightAxis.LEFT, # LEFT or RIGHT
    label="Series Label",      # Display name in legend
    show_values=True,          # Show values on chart
    number_format=NumberFormat(...),  # Optional formatting
)
```

### LegendConfig

```python
LegendConfig(
    enabled=True,
    location="bottom outside",  # "top", "bottom", "left", "right", or with "outside"
    bump=0.25,
)
```

### AxisConfig

```python
AxisConfig(
    label="Axis Label",  # Or False to hide
    lines=False,         # Show grid lines
)
```

---

## Examples

### Simple Bar Chart

```python
chart = ChartTemplate(
    name="monthly_revenue",
    cube_name="revenue",
    query=SemanticLayerQuery(
        measures=[cube.get_measure(name="total_revenue", strict=True)],
        dimensions=[],
        time_dimensions=[
            QueryTimeDimension(
                dimension=cube.get_dimension(name="time", strict=True),
                granularity=TimeGranularity.MONTH,
            )
        ],
        filters=[...],  # See filter-reference.md
    ),
    chart_details=ChartDetailsTemplate(
        series_default=SeriesConfig(type=ChartType.BAR),
        legend=LegendConfig(enabled=False),
        x_axis=AxisConfig(label=False),
        y_axis=AxisConfig(label="Revenue ($)"),
        color_scheme="blues",
    ),
)
```

### Dual-Axis Mixed Chart (Bar + Line)

```python
chart = ChartTemplate(
    name="ebitda_with_margin",
    cube_name="financials",
    query=SemanticLayerQuery(
        measures=[
            cube.get_measure(name="ebitda", strict=True),
            cube.get_measure(name="ebitda_margin", strict=True),
        ],
        time_dimensions=[
            QueryTimeDimension(
                dimension=cube.get_dimension(name="time", strict=True),
                granularity=TimeGranularity.YEAR,
            )
        ],
    ),
    chart_details=ChartDetailsTemplate(
        series_default=SeriesConfig(type=ChartType.BAR),
        series={
            "financials.ebitda_margin": SeriesConfig(
                type=ChartType.LINE,
                y_axis=LeftRightAxis.RIGHT,
                number_format=NumberFormat(type=NumberFormatType.PERCENT),
            ),
        },
        legend=LegendConfig(enabled=True, location="bottom outside", bump=0.25),
        y_axis=AxisConfig(label="EBITDA ($)"),
        y_right_axis=AxisConfig(label="Margin (%)"),
    ),
)
```

### Period-Over-Period Comparison

```python
chart = ChartTemplate(
    name="revenue_yoy_comparison",
    cube_name="revenue",
    query=query,
    chart_details=ChartDetailsTemplate(
        series={
            "revenue.total_arr": SeriesConfig(
                label="Current Period",
                type=ChartType.BAR,
                show_values=True,
            ),
            "revenue.total_arr_shift_-1": SeriesConfig(
                label="Previous Period",
                type=ChartType.LINE,
            ),
        },
        legend=LegendConfig(enabled=True, location="bottom outside"),
    ),
    compare_date_range_offsets=[-1],  # Compare with previous period
)
```

### Funnel Chart

```python
chart = ChartTemplate(
    name="sales_funnel",
    cube_name="funnel",
    query=SemanticLayerQuery(
        measures=[cube.get_measure(name="count", strict=True)],
        dimensions=[cube.get_dimension(name="stage", strict=True)],
        order=[("funnel.count", Order.DESC)],
    ),
    chart_details=ChartDetailsTemplate(
        series_default=SeriesConfig(type=ChartType.FUNNEL),
    ),
)
```

---

## Best Practices

1. **Match series keys to query columns**: Use `cube_name.measure_name` format
2. **Use series_default**: Set default to avoid configuring every series
3. **Configure dual-axis carefully**: Use `LeftRightAxis.RIGHT` for different scales
4. **Set appropriate date_format**: Match granularity ("MMMM" for monthly, "yyyy" for yearly)
5. **Use compare_date_range_offsets** for trend analysis

---

## Related Documentation

- For queries: see [_shared/query-fundamentals.md](../_shared/query-fundamentals.md)
- For computed expressions: see [_shared/query-expressions.md](../_shared/query-expressions.md)
- For filters: see [_shared/filter-reference.md](../_shared/filter-reference.md)
- For derived dimensions/filters: see the `derived-dimensions` skill
