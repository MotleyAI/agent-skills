---
name: update-chart
description: >
  Create or modify charts using update_chart_block. Covers chart type
  selection, SLayer query schema, chart_details parameters, and verification
  with render_chart.
---

# Update Chart

Create or modify chart blocks via `update_chart_block`. You provide a structured `query` (data to fetch) and `chart_details` (how to render it). No LLM intermediary.

> The query schema uses **SLayer**. The pre-migration Cube shape (`measures: [{name, cube_name}]`, `time_dimension: {dimension, granularity}` singular, structured filters) is no longer accepted. See `update-query-block` for the full SLayer query reference.

## How It Works

1. Call `update_chart_block` with `query` + `chart_details`
2. The query is validated, the chart config is saved on the block
3. Call `render_chart` to materialize the PNG (also triggers resolution)

**Returns**: confirmation + a data preview. Does NOT return an image — use `render_chart` for that.

## Chart-Type Guidance

| Type | Best for | Example |
|---|---|---|
| **bar** | Categorical comparisons, rankings, time series with few buckets | Revenue by region |
| **line** | Trends over time, continuous data, multi-series comparison | Monthly active users over 12 months |
| **pie** | Part-to-whole; max ~5–7 segments | Revenue by category |
| **funnel** | Conversion / drop-off | Lead → close stages |

Tips:
- Bar vs line: bars for categorical or sparse time series; lines for many time points.
- Pie loses meaning beyond ~7 slices — switch to a bar chart.
- Dual-axis is for measures on different scales (currency vs count). Put the secondary measure on `y_axis: "right"`.
- Stacked bars: multiple measures with `type: "bar"` on the same x-axis dimension.

## Query — SLayer Schema

The `query` argument is a `SlayerFormatQueryForLLM` wrapper:

```
query={
  "subqueries": [
    {
      "source_model": "orders",
      "measures": ["revenue:sum"],                    # DSL formula strings
      "dimensions": ["region"],                        # plain or dotted (joined)
      "time_dimensions": [
        {"column": "created_at", "granularity": "month"}
      ],
      "filters": ["status = 'completed'"],             # DSL strings; supports {var}
      "order": [{"column": "revenue:sum", "direction": "desc"}],
      "limit": 12
    }
  ]
}
```

Full DSL reference: see [model-guide.md](../../shared/model-guide.md) and `update-query-block`. Highlights:

- **Measures**: `"*:count"`, `"revenue:sum"`, `"revenue:avg"`, `"revenue:sum / *:count"`, `"cumsum(revenue:sum)"`, `"change(revenue:sum)"`, `"customers.score:avg"`, or a bare saved-measure name (`"aov"`).
- **Time dimensions**: `{"column": "<time_col>", "granularity": "day"|"week"|"month"|"quarter"|"year"}`. The doc's `start_date`/`end_date` variables supply the date range automatically — don't inline a range here.
- **Filters**: SQL-ish strings (`"status in ('a','b')"`, `"amount > {min_amount}"`). `{variable}` placeholders are substituted from the document's variables.

## Chart Details

```
chart_details={
  "title": "Monthly Revenue",
  "series_default": {
    "type": "bar",                     # bar | line | pie | funnel
    "y_axis": "left",                  # "left" | "right"
    "number_format": {"type": "currency", "symbol": "$", "precision": 0},
    "show_values": false
  },
  "series": {
    # per-measure overrides keyed by the canonical column name
    # "orders.revenue:sum": {"type": "line", "y_axis": "right"}
  },
  "xAxis": {"label": "Month", "lines": false},
  "yAxis": {"label": "Revenue", "lines": true},
  "y2Axis": {"label": null, "lines": false},
  "legend": {"enabled": false}
}
```

`number_format.type`: `"currency" | "percent" | "integer" | "float"`. For counts use `"integer"` (avoids `13.0`-style float rendering).

## Examples

### Time series — monthly revenue

```
update_chart_block(
  location={doc_id: 42, block_name: "revenue_chart"},
  query={"subqueries": [{
    "source_model": "orders",
    "measures": ["revenue:sum"],
    "time_dimensions": [{"column": "created_at", "granularity": "month"}],
    "order": [{"column": "created_at", "direction": "asc"}]
  }]},
  chart_details={
    "title": "Monthly Revenue",
    "series_default": {
      "type": "line", "y_axis": "left",
      "number_format": {"type": "currency", "symbol": "$", "precision": 0}
    },
    "xAxis": {"label": false, "lines": false},
    "yAxis": {"label": "Revenue", "lines": true},
    "legend": {"enabled": false}
  }
)
```

### Categorical — top regions

```
update_chart_block(
  location={doc_id: 42, block_name: "region_chart"},
  query={"subqueries": [{
    "source_model": "orders",
    "measures": ["revenue:sum"],
    "dimensions": ["region"],
    "order": [{"column": "revenue:sum", "direction": "desc"}],
    "limit": 10
  }]},
  chart_details={
    "title": "Top 10 Regions by Revenue",
    "series_default": {
      "type": "bar", "y_axis": "left",
      "number_format": {"type": "currency", "symbol": "$", "precision": 0},
      "show_values": true
    },
    "xAxis": {"label": "Region", "lines": false},
    "yAxis": {"label": "Revenue", "lines": true},
    "legend": {"enabled": false}
  }
)
```

### Dual axis — revenue vs order count

```
update_chart_block(
  location={doc_id: 42, block_name: "dual_chart"},
  query={"subqueries": [{
    "source_model": "orders",
    "measures": ["revenue:sum", "*:count"],
    "time_dimensions": [{"column": "created_at", "granularity": "month"}],
    "order": [{"column": "created_at", "direction": "asc"}]
  }]},
  chart_details={
    "title": "Revenue vs Order Count",
    "series_default": {"type": "bar", "y_axis": "left"},
    "series": {
      "orders.revenue:sum": {"type": "bar", "y_axis": "left",
        "number_format": {"type": "currency", "symbol": "$", "precision": 0}},
      "orders._count":      {"type": "line", "y_axis": "right",
        "number_format": {"type": "integer"}}
    },
    "xAxis": {"label": false},
    "yAxis": {"label": "Revenue", "lines": true},
    "y2Axis": {"label": "Orders", "lines": true},
    "legend": {"enabled": true}
  }
)
```

> The series key is the SLayer canonical column name. For aggregate-only queries it's `"<model>.<formula>"` (e.g. `"orders.revenue:sum"`); for the built-in count it's `"<model>._count"`. Run `render_chart` once, copy the keys from `chart_config.query_cache.df[0]` for the exact form.

### Pie — distribution

```
update_chart_block(
  location={doc_id: 42, block_name: "pie_chart"},
  query={"subqueries": [{
    "source_model": "products",
    "measures": ["revenue:sum"],
    "dimensions": ["category"],
    "order": [{"column": "revenue:sum", "direction": "desc"}],
    "limit": 5
  }]},
  chart_details={
    "title": "Revenue by Category",
    "series_default": {
      "type": "pie",
      "number_format": {"type": "currency", "symbol": "$", "precision": 0},
      "show_values": true
    },
    "legend": {"enabled": true}
  }
)
```

## Resolution & Verification

Charts are NOT resolved at `update_chart_block` time — config is saved, but data isn't fetched. To see the rendered chart:

```
render_chart(
  location={doc_id: 42, block_name: "revenue_chart"},
  width=800,
  height=600
)
```

`render_chart` returns the PNG image inline and also surfaces the data the chart was built from in `chart_config.query_cache.df`. **Always render once after `update_chart_block`** to verify:
- Chart type is what you expected
- Axes / labels / scales look right
- The data is non-empty and in chronological order if time-bucketed

If something looks wrong, iterate on `update_chart_block` and re-render.

## Troubleshooting

| Issue | Try |
|---|---|
| Wrong chart type | Set `series_default.type` explicitly (`bar`/`line`/`pie`/`funnel`) |
| Counts rendering as `13.0` | Set the series' `number_format.type` to `"integer"` |
| No data | Confirm time range covers the data (`start_date`/`end_date` doc vars); use `inspect_model` to verify rows exist |
| Too many categories | Add a `limit` to the query, plus `order` so the truncation keeps the top items |
| Granularity wrong | Set `time_dimensions[0].granularity` explicitly |
| Unknown column / measure | Use `inspect_model` to confirm exact names; remember dotted notation for joined columns |
| Inline measure rename needed | Declare it as a saved measure first via `create_measure`, then reference it by name |

## Related

- For exploring source models: see `explore-model`
- For full query schema: see `update-query-block`
- For DSL reference: see [model-guide.md](../../shared/model-guide.md)
