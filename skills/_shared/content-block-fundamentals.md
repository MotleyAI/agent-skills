# Content Block Fundamentals

This document explains expression syntax used in `TextBlockTemplate.user_prompt` and `TableBlockTemplate.user_prompt`.

## Expression Syntax Overview

Expressions in templates allow you to:
1. Reference query results using `{variable_name}`
2. Perform arithmetic on query results
3. Format numbers using functions like `{percent(...)}`, `{integer(...)}`, `{number(...)}`
4. Reference content from other slides using `{Slide::Block}`

---

## Simple Variable References

Reference query block results directly:

```python
user_prompt = "Total revenue: {total_revenue}"
```

The variable name must match:
- A `NumericalQueryBlock.name` in the `queries` list, OR
- A context variable (e.g., `{client_name}`, `{end_date}`)

---

## Cross-Slide References

Reference content from other slides using `{Slide::Block}` syntax:

```python
user_prompt = """Financial Summary:

**Sales Performance:**
{Sales::Text}

Yearly Sales Chart:
{Sales::Chart}

**EBITDA Performance:**
{EBITDA::Text}
"""
```

This pulls resolved content from:
- The `Text` block on the `Sales` slide
- The `Chart` block on the `Sales` slide
- The `Text` block on the `EBITDA` slide

### Referencing Chart Block Data

When you reference a chart block by name, the chart's underlying data is embedded as a **markdown table**. This is useful for having an LLM analyze or summarize chart data in a text block.

**Same-slide reference** - just use the block name directly:

```python
user_prompt = """Based on the spending data below, list the top 3 subscriptions:

{top_spend_chart}

Format as bullet points with amounts."""
```

**Cross-slide reference** - use `{Slide::Block}` syntax:

```python
user_prompt = """Summarize the trends shown in the revenue chart:

{Revenue::Chart}

Provide 2-3 key insights."""
```

---

## Arithmetic Expressions

Perform calculations on numeric variables:

```python
# Addition
user_prompt = "Total actions: {clicks + views + downloads}"

# Division
user_prompt = "Average per user: {total_revenue / user_count}"

# Complex expressions
user_prompt = "Efficiency: {(completed / total) * 100}%"
```

---

## Formatting Functions

### {percent(expression)}

Formats a decimal as a percentage:

```python
user_prompt = "Conversion rate: {percent(conversions / visitors)}"
# Output: "Conversion rate: 45%"
```

### {integer(expression)}

Formats result as an integer (rounds to nearest whole number):

```python
user_prompt = "Total requests: {integer(monthly_requests * 12)}"
# Output: "Total requests: 4800"

# Works with boolean comparisons (true=1, false=0)
user_prompt = "Goals met: {integer((actual/target >= 1) + (response_rate >= 0.5))} / 2"
# Output: "Goals met: 1 / 2"
```

### {number(expression, decimals=N)}

Formats with specified decimal places:

```python
user_prompt = "Multiplier: X{number(our_rate / industry_rate, decimals=1)}"
# Output: "Multiplier: X2.3"
```

### {round(expression)}

Rounds to nearest integer (similar to integer but returns float):

```python
user_prompt = "Score: {round(total_points / participants)}"
```

### {currency(expression)}

Formats as currency (with $ symbol):

```python
user_prompt = "Revenue: {currency(total_revenue)}"
# Output: "Revenue: $1,234,567"
```

### {sum(reference)}

Sums all numeric columns from a referenced block that returns numerical data:

```python
# Reference a chart on another slide
user_prompt = """Total from the revenue chart:
{sum(Revenue::chart)}

Provide a summary based on these totals."""

# Reference a NumericalQueryBlock with TABLE mode
user_prompt = """Total from the usage data:
{sum(usage_table_query)}
"""
```

**Valid inputs** (types where `return_type.is_expression_compatible()` is True):
- `CHART` - ChartTemplate (resolves to NumericalResolutionTable)
- `NUMERICAL_TABLE` - NumericalQueryBlock with `mode=TABLE`
- `NUMERICAL` - NumericalQueryBlock with `mode=SINGLE_NUMBER`

**NOT supported:**
- `TABLE` - TableBlockTemplate (resolves to markdown string, not numerical data)
- `STRING` - TextBlockTemplate

---

## Complex Expression Examples

### Conditional Counting

Count how many conditions are met:

```python
user_prompt = """Goals achieved: {integer(
    (products_actual/products_target >= 1) +
    (uploads_actual/uploads_target >= 1) +
    (response_rate >= 1) +
    (response_time <= 24)
)} / 4"""
# Output: "Goals achieved: 2 / 4"
```

### Multiple Calculations in Template

```python
user_prompt = """Performance Metrics:

| Metric | Industry Avg | Your Results | Multiplier |
|--------|--------------|--------------|------------|
| Connection Rate | {industry_connection_rate} | {percent(connected/sent)} | X{number((connected/sent)/industry_connection_rate, decimals=1)} |
| Reply Rate | {industry_reply_rate} | {percent(replied/connected)} | X{number((replied/connected)/industry_reply_rate, decimals=1)} |
"""
```

---

## Best Practices

1. **Match names exactly**: Query block `name` must match the variable reference in `user_prompt`
2. **Use formatting functions**: Use `{percent(...)}`, `{integer(...)}` over raw arithmetic
3. **Test expressions**: Validate that all referenced variables exist before deployment
4. **Document complex expressions**: Add comments in the template code explaining calculations

---

## Related Documentation

- For NumericalQueryBlock structure: see [numerical-query-block.md](numerical-query-block.md)
- For context variables: see [resolution-context.md](resolution-context.md)
