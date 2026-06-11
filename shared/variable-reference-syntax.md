# Variable Reference Syntax

Expression syntax for `user_prompt` in `update_text_block` and `update_table_block` MCP tools.

## Simple Variable References

Reference query block results or context variables directly:

```
Total revenue: {total_revenue}
```

The variable name must match:
- A query block `query_name` created via `update_query_block`, OR
- A context variable (e.g., `{end_date}`, or any source-specific variable shown by `get_doc_variables`) — see [resolution-context.md](resolution-context.md)

---

## Cross-Slide References

Reference content from other slides using `{Slide::Block}` syntax:

```
Financial Summary:

**Sales Performance:**
{Sales::Text}

Yearly Sales Chart:
{Sales::Chart}

**EBITDA Performance:**
{EBITDA::Text}
```

This pulls resolved content from:
- The `Text` block on the `Sales` slide
- The `Chart` block on the `Sales` slide
- The `Text` block on the `EBITDA` slide

### Referencing Chart Block Data

When you reference a chart block by name, the chart's underlying data is embedded as a **markdown table**. This is useful for having an LLM analyze or summarize chart data in a text block.

**Same-slide reference** — just use the block name directly:

```
Based on the spending data below, list the top 3 subscriptions:

{top_spend_chart}

Format as bullet points with amounts.
```

**Cross-slide reference** — use `{Slide::Block}` syntax:

```
Summarize the trends shown in the revenue chart:

{Revenue::Chart}

Provide 2-3 key insights.
```

---

## Arithmetic Expressions

Perform calculations on numeric variables:

```
Total actions: {clicks + views + downloads}
Average per user: {total_revenue / user_count}
Efficiency: {(completed / total) * 100}%
```

---

## Formatting Functions

### {percent(expression)}

Formats a decimal as a percentage:

```
Conversion rate: {percent(conversions / visitors)}
→ "Conversion rate: 45%"
```

### {integer(expression)}

Formats result as an integer (rounds to nearest whole number):

```
Total requests: {integer(monthly_requests * 12)}
→ "Total requests: 4800"

Goals met: {integer((actual/target >= 1) + (response_rate >= 0.5))} / 2
→ "Goals met: 1 / 2"
```

### {number(expression, decimals=N)}

Formats with specified decimal places:

```
Multiplier: X{number(our_rate / industry_rate, decimals=1)}
→ "Multiplier: X2.3"
```

### {round(expression)}

Rounds to nearest integer (similar to integer but returns float):

```
Score: {round(total_points / participants)}
```

### {currency(expression)}

Formats as currency (with $ symbol):

```
Revenue: {currency(total_revenue)}
→ "Revenue: $1,234,567"
```

### {sum(reference)}

Sums all numeric columns from a referenced block that returns numerical data:

```
Total from the revenue chart:
{sum(Revenue::chart)}

Total from the usage data:
{sum(usage_table_query)}
```

**Valid inputs** (blocks whose data is expression-compatible):
- **Chart blocks** — resolves to the chart's underlying data table
- **Query blocks in `table` mode** — resolves to the query result table
- **Query blocks in `single_number` mode** — resolves to the single value

**NOT supported:**
- Table block templates (resolve to markdown string, not numerical data)
- Text block templates (resolve to string)

---

## Complex Expression Examples

### Conditional Counting

Count how many conditions are met:

```
Goals achieved: {integer(
    (products_actual/products_target >= 1) +
    (uploads_actual/uploads_target >= 1) +
    (response_rate >= 1) +
    (response_time <= 24)
)} / 4
→ "Goals achieved: 2 / 4"
```

### Multiple Calculations in Template

```
Performance Metrics:

| Metric | Industry Avg | Your Results | Multiplier |
|--------|--------------|--------------|------------|
| Connection Rate | {industry_connection_rate} | {percent(connected/sent)} | X{number((connected/sent)/industry_connection_rate, decimals=1)} |
| Reply Rate | {industry_reply_rate} | {percent(replied/connected)} | X{number((replied/connected)/industry_reply_rate, decimals=1)} |
```

---

## Rules

1. **References must exist before use**: Every `{variable}` or `{Slide::Block}` must point to something that already exists when the template is set. Create query blocks via `update_query_block` BEFORE calling `update_text_block`/`update_table_block` that references them. Cross-slide references (`{Slide::Block}`) require the target block to already have content.
2. **Match names exactly**: Query block `query_name` must match the variable reference in `user_prompt`
3. **Use formatting functions** (`{percent(...)}`, `{integer(...)}`) over raw arithmetic when displaying values
4. **Do NOT place `%` after a variable**: Use `{percent(x)}` instead of `{x}%`
5. **Every `{variable}` must resolve**: Either to a query block name or a context variable
6. **Verify available variables**: Use `get_doc_variables(doc_id=..., show_context_vars=true)` to check

---

## Related Documentation

- For context variables: see [resolution-context.md](resolution-context.md)
- For creating query blocks: see the `update-query-block` skill
