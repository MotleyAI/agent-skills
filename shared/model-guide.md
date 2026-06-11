# Model Guide

This document covers data-model concepts for working with **SLayer** models in Motley. Use it as a reference when authoring queries, charts, and saved measures.

> Motley migrated its semantic layer from Cube to **SLayer**. Models tagged `*(backend: slayer)*` in `models_summary` use the SLayer schema below. Legacy Cube-format data sources are still **inspectable** (they appear in `models_summary` under "legacy Cube" and `inspect_model` shows their schema), but their **queries no longer run on the SLayer engine**: existing decks built on Cube must be migrated first via `POST /admin/slayer/migrate-deck` or they'll fail at resolution time with `UnsupportedQueryFormatError`. All new authoring (charts, queries, measures, joins) uses the SLayer schema documented here.

## Concepts

### Models

A **SLayer model** is a logical data view backed by a SQL query or table. Each model has:

- **Columns** (dimensions) — row-level values, each with a SQL type (`TEXT`, `DOUBLE`, `TIMESTAMP`, `BOOLEAN`, `INTEGER`, …).
- **Saved measures** — named DSL formulas that aggregate columns (`revenue:sum`, `change_pct(revenue:sum)`, etc.).
- **Joins** — declarative links to other models in the same source, expressed as column pairs.
- **Derived columns** — columns whose own SQL is a SQL expression; SLayer inlines them at query time.

Use `models_summary()` to list everything (`models_summary(verbose=false)` for compact output), and `inspect_model(model_name=..., num_rows=3)` to see schema + sample data.

### Columns

Joined columns surface in MCP listings two ways:
- In `inspect_model` they appear with a double-underscore prefix (`customers__name`).
- In query DSL you reference them with **dotted notation** (`customers.name`, `customers.regions.name` for multi-hop).

Both forms refer to the same thing.

### Measures (the DSL)

SLayer separates **measures** (row-level expressions saved on a model) from **aggregations** (chosen at query time via colon syntax). The colon syntax is the heart of the DSL:

| Expression | Meaning |
|---|---|
| `*:count` | `COUNT(*)` — always available, no column needed |
| `revenue:sum` | `SUM(revenue)` |
| `revenue:avg` | `AVG(revenue)` |
| `revenue:min` / `:max` | extremes |
| `customer_id:count_distinct` | `COUNT(DISTINCT customer_id)` |
| `revenue:stddev_samp`, `revenue:var_pop` | statistical aggs |
| `revenue:sum(window='30d')` | trailing 30-day SUM (requires a `time_dimensions` entry) |
| `revenue:sum / *:count` | arithmetic on aggregated measures |
| `(revenue:sum - cost:sum) / *:count` | parenthesized arithmetic |
| `customers.score:avg` | aggregation across a join |

#### Transform functions

Functions wrap aggregated measures with window operations:

| Function | What it does | Requires time dim |
|---|---|---|
| `cumsum(x)` | Running total over time | yes |
| `change(x)` | Δ vs previous period | yes |
| `change_pct(x)` | % change vs previous period | yes |
| `time_shift(x, n)` | Value N periods back/ahead | yes |
| `lag(x, n)` / `lead(x, n)` | Row-position shift (window functions) | yes |
| `first(x)` / `last(x)` | Broadcast first/last bucket's value | yes |
| `consecutive_periods(predicate)` | Trailing run length where `predicate` is true | yes |
| `rank(x)` | Descending rank | no |
| `dense_rank(x)` | Descending rank, no gaps | no |
| `percent_rank(x)` | Normalized rank in `[0, 1]` | no |
| `ntile(x, n=N)` | Bucket rows into N equal groups | no |

Rank-family transforms accept an optional `partition_by=` referencing query dimensions (`rank(revenue:sum, partition_by=region)`).

Common composition: top-N via `"filters": ["rank(revenue:sum) <= 10"]`.

### Dimensions

Group-by columns. In a query:

```json
"dimensions": ["status", "customers.name", "customers.regions.name"]
```

Plain string names; dotted notation for joined columns. SLayer auto-resolves the joins.

For inline date truncation without a separate `time_dimensions` entry, use the transform syntax: `"created_at:month"` as a dimension.

### Time dimensions

```json
"time_dimensions": [{"column": "created_at", "granularity": "month"}]
```

Granularities: `second`, `minute`, `hour`, `day`, `week`, `month`, `quarter`, `year`.

**The document's `start_date`/`end_date` variables automatically bound the time range** — do not inline `date_range` inside `time_dimensions`. Set them via `set_doc_variables`.

### Filters (DSL strings)

Filters are plain strings, AND-ed together when you provide multiple entries:

```json
"filters": [
  "status = 'completed'",
  "amount > 100",
  "category in ('A', 'B', 'C')",
  "name like '%enterprise%'",
  "discount IS NOT NULL",
  "rank(revenue:sum) <= 10",        // computed-column / transform filter
  "customer_name = '{customer_name}'"  // {var} substituted from doc variables
]
```

Operators: `=`, `<>`, `>`, `>=`, `<`, `<=`, `in`, `like`, `not like`, `IS NULL`, `IS NOT NULL`. Boolean logic inside a single string: `and`, `or`, `not`.

String-hygiene functions allowed inside filter strings: `lower`, `upper`, `trim`, `replace`, `substr`, `instr`, `length`, `concat` (and the `||` concat operator, auto-rewritten). All lowercase.

`{variable_name}` placeholders are substituted from the document's variables at resolution time. Quote string values inside the template: `"status = '{status}'"`.

Joined-column filters auto-resolve: `"customers.region = 'EU'"` adds the implied join automatically.

## Dimension Constraints for Charts

When a query is rendered as a chart, the underlying SLayer query is subject to these dimension limits:

| Plain dims | Time dims | Total | Measures allowed |
|---:|---:|---:|---|
| 0 | 0 | 0 | Multiple |
| 1 | 0 | 1 | Multiple |
| 0 | 1 | 1 | Multiple |
| 2 | 0 | 2 | Exactly 1 |
| 1 | 1 | 2 | Exactly 1 |

With 2 total dimensions, the second is pivoted into series. Max 2 dimensions for charts.

## Number Format Options (chart_details / measures)

| Format | Description | Example |
|---|---|---|
| `integer` | Whole number | `1,234` |
| `float` | Decimal | `1,234.56` |
| `currency` | Currency with symbol | `$1,234.56` |
| `percent` | Percentage | `45.2%` |

For count-style measures use `integer` — otherwise they render as `13.0`.

## Editing SLayer Models

The old single-shot `create_model` / `edit_model` tools are gone. Edits are now split per concern:

### Model-level metadata

```
patch_model(
  source_id=..., model_name="orders",
  description="Orders fact table",
  default_time_dimension="created_at",
  hidden=false,
  filters=["is_test = false"]      # always-applied WHERE filters
)
```

All fields optional — only what you pass is changed.

### Column metadata

```
patch_column(
  source_id=..., model_name="orders",
  column_name="amount",
  patch={"description": "Gross amount in USD", "label": "Amount"}
)
```

### Saved measures

```
# Sanity-check the DSL (no DB roundtrip):
validate_formula(
  source_id=..., model_name="orders",
  kind="measure",
  expression="revenue:sum / *:count"
)

# Create:
create_measure(
  source_id=..., model_name="orders",
  create={
    "name": "aov",
    "formula": "revenue:sum / *:count",
    "label": "Average Order Value",
    "description": "Average revenue per order"
  }
)

# Read:
list_measures(source_id=..., model_name="orders")
get_measure(source_id=..., model_name="orders", measure_name="aov")

# Edit:
patch_measure(source_id=..., model_name="orders", measure_name="aov",
              patch={"description": "Avg revenue per order", "label": "AOV"})

# Delete:
delete_measure(source_id=..., model_name="orders", measure_name="aov")
```

### Joins

```
create_join(
  source_id=..., model_name="orders",
  create={
    "target_model": "customers",
    "join_pairs": [["customer_id", "id"]],   # [[src_col, tgt_col], ...]
    "join_type": "left"                       # "left" (default) | "inner"
  }
)

list_joins(source_id=..., model_name="orders")
get_join(source_id=..., model_name="orders", target_model="customers")
patch_join(source_id=..., model_name="orders", target_model="customers",
           patch={"join_pairs": [["customer_uuid", "id"]]})
delete_join(source_id=..., model_name="orders", target_model="customers")
```

### Whole models

```
delete_model(model_name="my_test_model")
```

Fails if the model is auto-generated or referenced by another model's join.

> There is no tool for creating a fresh SLayer model from raw SQL via MCP in this build — sources arrive pre-populated. Edits happen on the saved measures, columns, joins, and model metadata.

## Tips

1. **Inspect first.** Run `models_summary(verbose=false)` then `inspect_model(model_name=..., num_rows=3)` on each model you'll use — confirm exact names and check sample data.
2. **Save common formulas as measures.** Declaring `aov = revenue:sum / *:count` once via `create_measure` keeps queries terse and consistent.
3. **Validate DSL before committing.** `validate_formula` is a cheap parse check.
4. **Time-window transforms need time dims.** `cumsum`, `change`, `lag`, `lead`, `first`, `last`, `time_shift`, `consecutive_periods` all require an explicit `time_dimensions` entry. Set `default_time_dimension` via `patch_model` to make this implicit when there are 2+ candidates.
5. **Joins are auto-resolved.** Once `create_join` is in place, queries reach across with dotted notation (`customers.name` from `orders`) — no need to also list the join.

## Related

- For exploring models: see the `explore-model` skill
- For authoring queries within blocks: see `update-query-block`
- For charts: see `update-chart`
