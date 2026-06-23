---
name: explore-model
description: >
  Explore SLayer source models, inspect schemas, manage saved measures and
  joins, and validate formulas before authoring queries.
---

# Explore Model

Explore available data before authoring queries. This is the first step in any report-creation workflow.

> Motley's semantic layer is **SLayer**. Older "Cube" data sources are kept **inspectable** for migration (they show up in `models_summary` and `inspect_model`), but Cube-format queries no longer run — existing decks must be migrated (`POST /admin/slayer/migrate-deck`) before they can resolve. The `models_summary` header tells you the mix: e.g. `"# Models (14 SLayer + 0 legacy Cube)"`. The tools below operate on SLayer models.

## Listing Models

Use `models_summary` to see all available models:

```
models_summary()                # full schema per model
models_summary(verbose=false)   # compact: model names + comma-separated columns/measures only
```

For each model you see:
- **Dimensions / columns** — raw row-level columns (with types)
- **Measures** — saved aggregate definitions (with formula DSL and description)
- **Derived columns** — computed columns defined on the model

Use `verbose=false` first to scan the landscape, then `verbose=true` on the specific model(s) you care about.

## Inspecting a Single Model

```
inspect_model(
  model_name="orders",
  num_rows=3,        # set 0 to skip the sample data section
  show_sql=false     # include the SQL/table definition when true
)
```

Returns the full schema plus a sample-rows table — useful for understanding value formats, null patterns, and which columns carry real data.

## Scratch Queries with `run_query`

`inspect_model` shows a fixed sample. For anything that requires an actual aggregation — date range, distinct counts, top-N before authoring a chart — use `run_query`. It runs the same SLayer query shape as `update_query_block` / `update_chart_block` but does **not** create or modify any block. Use it freely.

```
run_query(
    source_id=<id>,
    query={"subqueries": [{
        "source_model": "orders",
        "measures": ["*:count", "amount:sum", "created_at:min", "created_at:max"]
    }]},
    limit=5
)
```

Returns rows + a column descriptor for each measure / dimension / time_dimension. Caps results at `limit` (default 100, max 10000) and reports `truncated: true` when the underlying query had more rows.

Common patterns:

- **Data extent** (a must-do before picking `start_date` / `end_date`):
  `measures=["created_at:min", "created_at:max", "*:count"]`, no dimensions.
- **Distinct count**:
  `measures=["customer_id:count_distinct"]`.
- **Top-N preview** before charting:
  `measures=["amount:sum"]`, `dimensions=["region"]`, `order=[{"column":"amount:sum","direction":"desc"}]`, `limit=10`.
- **Variable resolution**:
  Pass `variables={"customer_name": "Acme"}` to substitute `{customer_name}` placeholders in filters.

## Concepts

### Columns

Each SLayer model has typed columns (`TEXT`, `DOUBLE`, `TIMESTAMP`, `BOOLEAN`, `INTEGER`, …). A column may be:
- A plain physical column from the underlying table
- A **derived column** (`Column.sql` expression on the model)
- A **joined column** surfaced via `__` prefix in MCP listings (e.g. `customers__name`)

### Measures

Measures are **saved, named DSL formulas** that aggregate columns. They appear in `list_measures` and can be referenced by bare name from any query.

| Example formula | Meaning |
|---|---|
| `*:count` | row count |
| `revenue:sum` | SUM(revenue) |
| `revenue:sum / *:count` | average via arithmetic |
| `customers.score:avg` | aggregation across a join |
| `cumsum(revenue:sum)` | running total (time-ordered) |
| `change_pct(revenue:sum)` | period-over-period % change |
| `rank(revenue:sum)` | descending rank |

See [model-guide.md](../../shared/model-guide.md) for the full DSL reference.

### Joins

A join links one model to another by one or more column pairs. Once defined, downstream queries can reference joined columns via dotted syntax (`customers.name`) or `__` prefix in some listings. SLayer auto-resolves the join graph at query time.

## Editing Models — Tool Surface

The legacy `create_model` / `edit_model` / single-shot mutation tools are gone. SLayer model edits are split into fine-grained tools — each one targets a single thing.

| Tool | What it does |
|---|---|
| `patch_model` | Edit model-level metadata: description, hidden flag, default_time_dimension, model-wide filters |
| `patch_column` | Edit a single column's metadata (label, description, hidden, filter, etc.) |
| `list_measures` / `get_measure` | Read saved measures on a model |
| `create_measure` | Add a new saved measure (DSL formula) |
| `patch_measure` | Edit an existing measure's formula / label / description |
| `delete_measure` | Remove a saved measure |
| `list_joins` / `get_join` | Read joins declared on a model |
| `create_join` | Declare a join to another model in the same source |
| `patch_join` | Replace a join's `join_pairs` or `join_type` |
| `delete_join` | Remove a join |
| `validate_formula` | Pure-Python DSL parse check — call **before** any create/patch to surface syntax errors fast |
| `delete_model` | Delete an entire model (fails if it's auto-generated or referenced by other models' joins) |

All `*_measure`, `*_join`, `patch_model`, `patch_column` tools require `source_id` + `model_name` (the target). `validate_formula` requires `kind: "measure" | "filter"` and `expression: "<DSL string>"`.

### Workflow: add a saved measure

```
# 1. Sanity-check the formula offline (no DB roundtrip):
validate_formula(
  source_id=..., model_name="orders",
  kind="measure",
  expression="revenue:sum / *:count"
)
# → {"valid": true}  or  {"valid": false, "error": "..."}

# 2. Create the measure:
create_measure(
  source_id=..., model_name="orders",
  create={
    "name": "aov",
    "formula": "revenue:sum / *:count",
    "label": "Average Order Value",
    "description": "Avg revenue per order"
  }
)
```

Note: `validate_formula` checks **DSL syntax** and references to existing **named measures**, but does not currently validate that bare column refs (`revenue`) exist on the model. A formula that parses cleanly may still error at execution if a column is misspelled — also check `inspect_model` output.

### Workflow: edit a measure

```
patch_measure(
  source_id=..., model_name="orders",
  measure_name="aov",
  patch={"description": "Updated description", "label": "AOV"}
)
```

Send only the fields you want to change.

### Workflow: declare a join

```
# After validating that both models exist in the same source:
create_join(
  source_id=..., model_name="orders",
  create={
    "target_model": "customers",
    "join_pairs": [["customer_id", "id"]],   # [[source_col, target_col], ...]
    "join_type": "left"                       # "left" (default) or "inner"
  }
)
```

Multi-column joins: `"join_pairs": [["tenant_id", "tenant_id"], ["customer_id", "id"]]`.

### Workflow: model-level metadata

```
patch_model(
  source_id=..., model_name="orders",
  description="Orders fact table",
  default_time_dimension="created_at",
  filters=["is_test = false"]    # always-applied WHERE filters (DSL strings)
)
```

All editable fields are optional; omitted ones are unchanged.

## Tips for Report Building

1. **`models_summary(verbose=false)` first** — get the lay of the land.
2. **`inspect_model` on each model you'll use** — confirm exact column/measure names. Misspelled refs fail at query time.
3. **Prefer saved measures to inline formulas** — declare common formulas via `create_measure` once, then reference them by bare name across queries. Easier to keep consistent and reusable.
4. **Validate before creating** — `validate_formula` is cheap and catches syntax bugs before they hit the DB.
5. **Time dimensions are central** — many SLayer transforms (`cumsum`, `change`, `lag`, …) require an explicit `time_dimensions` entry in the query. Note which column is the time anchor and consider setting `default_time_dimension` via `patch_model`.
6. **Joins are auto-resolved** — once `create_join` is in place, queries can reference `customers.name` from `orders` without listing the join.

## Related

- For DSL reference (measures, filters, transforms): [model-guide.md](../../shared/model-guide.md)
- For authoring queries against models: see `update-query-block`
- For charts: see `update-chart`
