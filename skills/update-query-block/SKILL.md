---
name: update-query-block
description: >
  Create or modify numerical query blocks within text or table blocks using
  update_query_block. Queries run against the SLayer semantic layer and
  expose their result as {query_name} in the parent template.
---

# Update Query Block

Create or update numerical queries inside text or table blocks. Queries execute against a **SLayer** source model and make their result available as `{query_name}` inside the parent block's `user_prompt`.

> Motley migrated its semantic layer from Cube to **SLayer**. Existing Cube-backed documents are still readable, but **all newly authored queries must use the SLayer schema documented below**. The old shape (`measures: [{name, cube_name}]`, `time_dimension: {...}`, structured `filters: [{member, operator, values}]`) is no longer accepted.

## How It Works

1. You call `update_query_block` with a structured `query` describing the data
2. The query is validated against the source model's schema and executed against SLayer
3. The result becomes available as `{query_name}` in the parent text/table block's `user_prompt`
4. When the parent block is resolved, the query value is substituted in

**Returns**: A single value for `single_number` mode, or a markdown-formatted table for `table` mode.

> **Tip — dry-run with `run_query`.** Before persisting a query block, use `run_query(source_id, query, variables?, limit?)` to validate the query shape against live data — it takes the same `subqueries[…]` payload but creates nothing. Especially useful for checking the data's date range (so you set sensible `start_date` / `end_date`), confirming a measure formula resolves, and previewing the top rows before committing to a chart.

## Query Shape — `SlayerFormatQueryForLLM`

```
update_query_block(
  parent_location={doc_id, block_name},
  query_name="<unique name>",
  mode="single_number" | "table",
  query={
    "subqueries": [
      {
        "source_model": "orders",          # name of the SLayer model
        "name": null,                       # optional, only for multi-stage queries
        "measures": ["revenue:sum"],       # DSL formula strings — see below
        "dimensions": ["status"],          # group-by columns
        "time_dimensions": [{"column": "created_at", "granularity": "month"}],
        "filters": ["amount > 100"],       # DSL filter strings
        "order": [{"column": "revenue:sum", "direction": "desc"}],
        "limit": 10,
        "offset": 0
      }
    ]
  }
)
```

Most queries are a single subquery. Multi-stage usage (DAG) is rare — see "Multi-stage queries" below.

### Measure formulas (DSL strings)

Use `<column>:<aggregation>` colon syntax. The column can be plain or dotted (joined model).

| Example | SQL |
|---|---|
| `"*:count"` | `COUNT(*)` |
| `"revenue:sum"` | `SUM(revenue)` |
| `"revenue:avg"` | `AVG(revenue)` |
| `"revenue:min"` / `:max` / `:stddev_samp` / `:var_pop` | etc. |
| `"customer_id:count_distinct"` | `COUNT(DISTINCT customer_id)` |
| `"revenue:sum / *:count"` | average via arithmetic |
| `"revenue:sum(window='30d')"` | trailing-30-day SUM (requires a `time_dimensions` entry) |
| `"cumsum(revenue:sum)"` | running total |
| `"change(revenue:sum)"`, `"change_pct(revenue:sum)"` | period-over-period delta |
| `"rank(revenue:sum)"` | descending rank (top-N) |
| `"customers.score:avg"` | aggregation across a join |

A measure can also be a **bare model-measure name** (declared on the model via `create_measure`) — e.g. `["active_subscription_count"]`.

The MCP layer only accepts measure formulas as **plain strings** — there is no inline rename. To rename, declare a saved measure on the model via `create_measure` first, then reference its name here.

### Dimensions

Plain string column names. Use dotted notation for joined columns (`customers.name`, `customers.regions.name`). The MCP scaffold also accepts derived/transformed dim syntax like `"created_at:month"` for inline date truncation.

### Time dimensions

```
"time_dimensions": [{"column": "created_at", "granularity": "month"}]
```

Granularities: `second`, `minute`, `hour`, `day`, `week`, `month`, `quarter`, `year`.

**Date range** is taken from the document's `start_date`/`end_date` variables (set via `set_doc_variables`). **Do not** inline a date range inside `time_dimensions` — let the wrapper supply it.

### Filters (DSL strings)

Plain SQL-ish strings, AND-ed together if you provide multiple entries.

| Pattern | Example |
|---|---|
| Equality | `"status = 'active'"` |
| Comparison | `"amount > 100"`, `"amount <= 1000"` |
| IN | `"status in ('active', 'pending')"` |
| LIKE | `"name like '%acme%'"` |
| Null | `"discount IS NOT NULL"` |
| Boolean | `"status = 'active' and amount > 100"`, `"... or ..."` |
| Computed-column | `"rev_change < 0"` (refers to a renamed measure or saved formula) |
| Top-N via rank | `"rank(revenue:sum) <= 10"` |

**Variables**: filter strings can include `{variable_name}` placeholders that are substituted from the document's variables. Quote strings inside the template:

```
"filters": ["customer_name = '{customer_name}'", "amount > {min_amount}"]
```

The doc's `start_date`/`end_date` are automatically applied to the query's time dimensions — you don't need to express them as filters.

### Order, limit, offset

```
"order": [{"column": "revenue:sum", "direction": "desc"}, {"column": "status", "direction": "asc"}],
"limit": 10,
"offset": 0
```

`column` accepts plain dimension names or DSL measure formulas (`"revenue:sum"`, `"*:count"`).

## Query Modes

### `single_number` (default)

Returns a single aggregate value. Use for KPIs and inline numbers in text.

```
update_query_block(
  parent_location={doc_id: 42, block_name: "kpi_text"},
  query_name="total_revenue",
  mode="single_number",
  query={"subqueries": [{
    "source_model": "orders",
    "measures": ["revenue:sum"]
  }]}
)
```

The result substitutes directly into text: `"Revenue this quarter: {total_revenue}."`

### `table`

Returns the full result set as a markdown table. Use when a parent table block needs multi-row data or you want the LLM to summarize a result set.

```
update_query_block(
  parent_location={doc_id: 42, block_name: "monthly_table"},
  query_name="monthly_data",
  mode="table",
  query={"subqueries": [{
    "source_model": "orders",
    "measures": ["revenue:sum", "*:count"],
    "time_dimensions": [{"column": "created_at", "granularity": "month"}],
    "order": [{"column": "created_at", "direction": "asc"}],
    "limit": 12
  }]}
)
```

### `table` with pivot / transpose

```
update_query_block(
  parent_location={doc_id: 42, block_name: "matrix_table"},
  query_name="region_quarterly",
  mode="table",
  pivot_dimension="created_at",      # column name to pivot into headers
  transpose=false,
  query={"subqueries": [{
    "source_model": "sales",
    "measures": ["revenue:sum"],
    "dimensions": ["region"],
    "time_dimensions": [{"column": "created_at", "granularity": "quarter"}]
  }]}
)
```

## Workflow

**Important**: create a query block BEFORE the parent text/table block tries to reference it via `{query_name}`. The parent resolves immediately, so an unresolved reference rejects the parent's content.

1. Create the parent block with a placeholder body first (or with a body that doesn't yet reference the query).
2. Add child queries with `update_query_block(parent_location=…, query_name="x", …)`.
3. Update the parent's `user_prompt` to reference `{x}`.

## Examples

### Single number KPI

```
update_query_block(
  parent_location={doc_id: 42, block_name: "intro"},
  query_name="active_users",
  query={"subqueries": [{
    "source_model": "users",
    "measures": ["active_user_count"],          # bare model-measure name
    "filters": ["signup_source = '{channel}'"]   # {channel} from doc variables
  }]}
)
```

### Comparison value (previous period)

```
update_query_block(
  parent_location={doc_id: 42, block_name: "intro"},
  query_name="prev_active_users",
  query={"subqueries": [{
    "source_model": "users",
    "measures": ["active_user_count"],
    "filters": ["period = 'previous'"]
  }]}
)
```

Then in the parent: `"Active users: {active_users} ({percent((active_users - prev_active_users) / prev_active_users)} vs prior period)"`.

### Top 5 customers

```
update_query_block(
  parent_location={doc_id: 42, block_name: "top_customers"},
  query_name="top5",
  mode="table",
  query={"subqueries": [{
    "source_model": "orders",
    "measures": ["revenue:sum"],
    "dimensions": ["customers.name"],          # joined column via dotted path
    "order": [{"column": "revenue:sum", "direction": "desc"}],
    "limit": 5
  }]}
)
```

### Period change with a saved formula

```
# Declare a saved measure once on the model:
create_measure(
  source_id=..., model_name="orders",
  create={"name": "rev_change_pct", "formula": "change_pct(revenue:sum)"}
)

# Then use it in queries:
update_query_block(
  parent_location={...},
  query_name="growth",
  query={"subqueries": [{
    "source_model": "orders",
    "measures": ["rev_change_pct"],
    "time_dimensions": [{"column": "created_at", "granularity": "month"}],
    "limit": 1,
    "order": [{"column": "created_at", "direction": "desc"}]
  }]}
)
```

### Multi-stage queries

Use multiple subqueries when stage 2 needs to aggregate stage 1's result (e.g. top-N then average within them). The last subquery is the entry point; earlier ones are referenced by `name`:

```
query={"subqueries": [
  {
    "source_model": "orders",
    "name": "top_customers",
    "measures": ["revenue:sum"],
    "dimensions": ["customers.name"],
    "order": [{"column": "revenue:sum", "direction": "desc"}],
    "limit": 10
  },
  {
    "source_model": "top_customers",   # references the previous stage
    "measures": ["revenue:sum / *:count"]
  }
]}
```

Most queries are single-stage; reach for multi-stage only when the math genuinely requires aggregating an aggregation.

## Default filters

Sources can declare default filters that auto-apply to every query, often parametrized by variables (e.g. `customer_name`). `create_document` lists these in `variables_to_set`; set them with `set_doc_variables` before running queries. The query block's own `filters` then compose with the source defaults.

## Related skills

- For exploring source models: see `explore-model`
- For declaring saved measures: see `explore-model` (`create_measure`, `validate_formula`)
- For variable & template syntax in parent blocks: see [variable-reference-syntax.md](../../shared/variable-reference-syntax.md)
- For document-level context variables: see [resolution-context.md](../../shared/resolution-context.md)
