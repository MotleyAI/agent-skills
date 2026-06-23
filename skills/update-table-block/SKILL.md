---
name: update-table-block
description: >
  Create or modify table blocks using update_table_block. Covers template
  syntax, target_shape constraints, table generation patterns, and how to
  source rows from a SLayer query.
---

# Update Table Block

Create or modify table blocks via `update_table_block`. Table blocks support variable substitution, LLM-generated tables, and size constraints via `target_shape`.

## How It Works

1. Call `update_table_block` with a `user_prompt` template
2. The block resolves **immediately** — variables are substituted and (optionally) an LLM generates the table
3. The resolved markdown is returned inline in the tool response

**Returns**: the resolved table content as markdown.

## target_shape

Controls expected dimensions as `[rows, cols]`. Each dimension can be:

| Value | Meaning | Example |
|---|---|---|
| `null` | No constraint | `[null, 3]` — any rows, exactly 3 cols |
| `int` | Exact count | `[5, 3]` |
| `[min, max]` | Range | `[[3, 8], 4]` — 3–8 rows, exactly 4 cols |

Row count does NOT include the header row.

## Three Patterns

### Pattern A — Raw Query Output

Pass a `mode="table"` SLayer query directly. No LLM needed.

```
# Step 1 — create the parent table block with a placeholder body:
update_table_block(
  location={doc_id: 42, block_name: "monthly_table"},
  user_prompt="(placeholder)",
  target_shape=[[1, 12], 3]
)

# Step 2 — add the query as a child:
update_query_block(
  parent_location={doc_id: 42, block_name: "monthly_table"},
  query_name="monthly_data",
  mode="table",
  query={"subqueries": [{
    "source_model": "orders",
    "measures": ["revenue:sum", "*:count"],
    "time_dimensions": [{"column": "created_at", "granularity": "month"}],
    "order": [{"column": "created_at", "direction": "asc"}]
  }]}
)

# Step 3 — point the table at the query:
update_table_block(
  location={doc_id: 42, block_name: "monthly_table"},
  user_prompt="{monthly_data}",
  target_shape=[[1, 12], 3]
)
```

> Why the placeholder first? A table block whose `user_prompt` references an unresolved `{query_name}` is created with a `fail_resolution` placeholder. That's fixable, but it's cleaner to create the parent first, then add queries, then rewrite the body.

### Pattern B — Markdown template with variable substitution

```
update_table_block(
  location={doc_id: 42, block_name: "kpi_table"},
  user_prompt="| Metric | Value |\n|---|---|\n| Revenue | {currency(total_revenue)} |\n| Customers | {integer(active_customers)} |\n| Growth | {percent(revenue_growth)} |",
  target_shape=[3, 2]
)
```

Each `{var}` either references a child query block or a doc-level variable (see `get_doc_variables`).

### Pattern C — LLM-generated table from data

```
update_table_block(
  location={doc_id: 42, block_name: "summary_table"},
  user_prompt="Build a summary table from this data:\n\n:var[{detailed_data}]{name=\"detailed_data\"}\n\nTop 5 rows by revenue. Columns: Name, Revenue, Growth %, Status. Be concise.",
  call_llm=true,
  target_shape=[5, 4]
)
```

LLM blocks require the `:var[{value}]{name="x"}` reference syntax for data they should consume. See [variable-reference-syntax.md](../../shared/variable-reference-syntax.md).

## Template Syntax

Same as text blocks — `{variable}`, `{Slide::Block}`, arithmetic, formatters (`{currency(x)}`, `{percent(x)}`, `{integer(x)}`, `{number(x, decimals=N)}`).

Every reference in the template must exist before resolution. Child queries (`update_query_block`) must be in place; doc variables (`set_doc_variables`) must be set.

## Examples

### Simple data table

```
update_table_block(
  location={doc_id: 42, block_name: "quarterly_table"},
  user_prompt="{quarterly_revenue}",
  target_shape=[4, 3]
)
```

### KPI scorecard

```
update_table_block(
  location={doc_id: 42, block_name: "scorecard"},
  user_prompt="| KPI | Target | Actual | Status |\n|---|---|---|---|\n| Revenue | {currency(target_revenue)} | {currency(actual_revenue)} | {revenue_status} |\n| Users | {integer(target_users)} | {integer(actual_users)} | {users_status} |\n| NPS | {target_nps} | {actual_nps} | {nps_status} |",
  target_shape=[3, 4]
)
```

### Pivoted cross-tab

```
update_query_block(
  parent_location={doc_id: 42, block_name: "matrix_table"},
  query_name="product_region_matrix",
  mode="table",
  pivot_dimension="region",
  query={"subqueries": [{
    "source_model": "sales",
    "measures": ["revenue:sum"],
    "dimensions": ["product", "region"]
  }]}
)

update_table_block(
  location={doc_id: 42, block_name: "matrix_table"},
  user_prompt="{product_region_matrix}",
  target_shape=[null, null]
)
```

## Overflow Handling

If the resolved table exceeds the element's slide-rendered size, the tool returns an overflow error. Mitigations:
- Tighten `target_shape`, or add `limit` / `order` to the query
- Use fewer columns (fewer measures/dimensions)
- Switch to `call_llm=true` with a "be concise" prompt

## Error Handling — `behavior_if_query_fails`

Same as text blocks:
- `"drop_slide"` — slide silently skipped during export
- `"fail_resolution"` — resolution raises an error
- `null` (default) — keep existing behavior

## Related

- For child queries against SLayer: see `update-query-block`
- For LLM data references: see [variable-reference-syntax.md](../../shared/variable-reference-syntax.md)
- For context variables: see [resolution-context.md](../../shared/resolution-context.md)
