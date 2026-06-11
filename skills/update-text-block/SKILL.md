---
name: update-text-block
description: >
  Create or modify text blocks using update_text_block. Covers template syntax
  with variable references, LLM generation, and constrained outputs.
---

# Update Text Block

Create or modify text blocks using the `update_text_block` MCP tool. Text blocks support variable substitution, LLM-generated content, and constrained outputs.

## How It Works

1. Call `update_text_block` with a `user_prompt` template
2. The block resolves **immediately** — variables are substituted and (optionally) LLM generates content
3. The resolved content is returned inline in the tool response

**Returns**: The resolved content of the text block.

## Template Syntax

The `user_prompt` supports:
- **Variable references**: `{query_name}` — substituted with query block results
- **Cross-slide references**: `{Slide::Block}` — pulls content from other slides
- **Arithmetic**: `{a + b}`, `{a / b}`
- **Formatting functions**: `{percent(x)}`, `{currency(x)}`, `{integer(x)}`, `{number(x, decimals=N)}`

For full syntax details, see [variable-reference-syntax.md](../../shared/variable-reference-syntax.md).

## Variable Reference Rules

- **Same-slide query**: Use bare name → `{total_revenue}`
- **Cross-slide content**: Use `{Slide::Block}` → `{Sales::revenue_chart}`
- **Context variables**: Use bare name → `{end_month}` (universal), or any source-specific variable shown by `get_doc_variables`
- **Always verify**: Use `get_doc_variables(doc_id=..., show_context_vars=true)` to check available variables

## Content Rules

- Must be valid **CommonMark markdown**
- **No tables** in text blocks — use bullet points instead (tables belong in table blocks)
- **No line breaks inside bullet points** — each bullet must be a single line
- **No `%` after `{variable}`** — use `{percent(x)}` instead
- Every `{variable}` must have a corresponding query block or context variable

## Modes

### Direct Substitution (`call_llm=false`, the default)

Variables are replaced with their resolved values. No LLM is involved.

```
update_text_block(
    location={doc_id: 42, slide_name: "Overview", block_name: "kpi_text"},
    user_prompt="Revenue: {currency(total_revenue)}\nCustomers: {integer(active_customers)}\nGrowth: {percent(revenue_growth)}"
)
```

Use this when you have a fixed template and just need data values filled in.

### LLM Generation (`call_llm=true`)

The LLM receives the resolved template (with variables already substituted) and generates content based on it.

```
update_text_block(
    location={doc_id: 42, slide_name: "Summary", block_name: "analysis_text"},
    user_prompt="Based on the following data, write a 2-sentence executive summary:\n\nRevenue: {currency(total_revenue)}\nGrowth: {percent(revenue_growth)}\nTop region: {top_region}\n\nChart data:\n{Revenue::revenue_chart}",
    call_llm=true
)
```

Use this when you want the LLM to synthesize insights from data.

### Constrained Generation (`call_llm=true` + `allowed_outputs`)

The LLM must choose one of the specified outputs. Useful for conditional/dynamic content.

```
update_text_block(
    location={doc_id: 42, slide_name: "Status", block_name: "trend_indicator"},
    user_prompt="Based on the growth rate of {percent(revenue_growth)}, classify the trend.",
    call_llm=true,
    allowed_outputs=["Strong Growth", "Moderate Growth", "Stable", "Declining"]
)
```

Use this for status labels, categories, or any content that must be one of a fixed set of values.

## Workflow

**Every reference in the template must exist before you call `update_text_block`.** The block resolves immediately, so any `{variable}` that can't be found will cause a resolution failure.

- `{query_name}` → call `update_query_block` first
- `{Slide::Block}` → the referenced slide/block must already have content
- `{context_var}` (e.g. `{end_month}`, or any source-specific key from `get_doc_variables`) → no setup needed if `get_doc_variables` lists it

Create query blocks first, then set the text template:

1. Create the data queries (SLayer schema — see `update-query-block` for full details):
   ```
   update_query_block(
       parent_location={doc_id: 42, block_name: "summary_text"},
       query_name="total_revenue",
       query={"subqueries": [{
         "source_model": "orders",
         "measures": ["revenue:sum"]
       }]}
   )

   update_query_block(
       parent_location={doc_id: 42, block_name: "summary_text"},
       query_name="customer_count",
       query={"subqueries": [{
         "source_model": "customers",
         "measures": ["active_customer_count"]
       }]}
   )
   ```

2. Then set the template:
   ```
   update_text_block(
       location={doc_id: 42, slide_name: "Overview", block_name: "summary_text"},
       user_prompt="In {end_month}, the business generated {currency(total_revenue)} in revenue across {integer(customer_count)} active customers."
   )
   ```

## Examples

### Static KPI Display

```
update_text_block(
    location={doc_id: 42, slide_name: "KPIs", block_name: "revenue_kpi"},
    user_prompt="{currency(total_revenue)}"
)
```

### Multi-Line Template

```
update_text_block(
    location={doc_id: 42, slide_name: "Performance", block_name: "metrics_text"},
    user_prompt="**Performance — {end_month}**\n\n- Revenue: {currency(total_revenue)} ({percent(revenue_growth)} vs prior period)\n- Active users: {integer(active_users)}\n- Avg session duration: {number(avg_duration, decimals=1)} minutes"
)
```

### LLM-Generated Summary from Chart Data

```
update_text_block(
    location={doc_id: 42, slide_name: "Insights", block_name: "chart_analysis"},
    user_prompt="Analyze the revenue trend data below and provide 3 key insights as bullet points. Be concise — each bullet should be one sentence.\n\n{Revenue::revenue_chart}",
    call_llm=true
)
```

### Conditional Label

```
update_text_block(
    location={doc_id: 42, slide_name: "Status", block_name: "health_label"},
    user_prompt="The customer's health score is {health_score} out of 100. Classify their status.",
    call_llm=true,
    allowed_outputs=["Healthy", "At Risk", "Critical"]
)
```

## Overflow Handling

If the resolved text exceeds the element's size on the slide, the tool returns an overflow error. To fix:
- **Shorten the template**: Use fewer variables, shorter text
- **Use LLM with brevity instructions**: Add "Be very concise" or "Maximum 2 sentences" to your prompt
- **Reduce data**: Use fewer query blocks or summarize data before display

## Error Handling — `behavior_if_query_fails`

Controls what happens when a child query block fails to resolve:
- `"drop_slide"` — The slide is silently skipped during export (useful for optional data)
- `"fail_resolution"` — Resolution raises an error (useful for required data)
- `null` (default) — Keeps the existing behavior unchanged

## Related Skills

- For creating query blocks: see the `update-query-block` skill
- For expression syntax: see [variable-reference-syntax.md](../../shared/variable-reference-syntax.md)
- For context variables: see [resolution-context.md](../../shared/resolution-context.md)
