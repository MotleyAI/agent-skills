---
name: create-edit-table-block
description: Create or edit TableBlockTemplate for table content with queries and formatting. Use when creating tables, pivot tables, or data grids in slides.
---

# Creating and Editing TableBlockTemplate

TableBlockTemplate is similar to TextBlockTemplate but specifically designed for generating markdown tables, with an additional `target_shape` field.

## Required Imports

```python
from storyline.domain.content.table_block import TableBlock, TableBlockTemplate
from storyline.domain.content.query_block import (
    NumericalQueryBlock,
    NumericalQueryTemplate,
    NumericalQueryMode,
)
from storyline.semantic.enums import Order
from storyline.semantic.query import SemanticLayerQuery
```

---

## Key Difference: target_shape

The main difference from `TextBlockTemplate` is the `target_shape` field, which specifies the expected table dimensions.

### target_shape Format

| Format | Description | Example |
|--------|-------------|---------|
| `None` | No constraint | `target_shape=None` |
| `(rows, cols)` | Exact dimensions | `target_shape=(3, 3)` |
| `(rows, None)` | Exact rows, any columns | `target_shape=(5, None)` |
| `(None, cols)` | Any rows, exact columns | `target_shape=(None, 3)` |
| `((min, max), cols)` | Row range, exact columns | `target_shape=((1, 11), 2)` |
| `(rows, (min, max))` | Exact rows, column range | `target_shape=(5, (2, 4))` |

**Note**: Both min and max in ranges are inclusive.

---

## Examples

### LLM-Generated Table with Row Range

```python
table_block = TableBlock(
    name="customers_table",
    template=TableBlockTemplate(
        name="top_customers_table",
        user_prompt="""Transform the customer data into a markdown table:
{customer_data}

| Customer Name | Impact Score |
|---------------|--------------|
...

Return 1-11 rows depending on available data.
""",
        call_llm=True,
        target_shape=((1, 11), 2),  # 1-11 rows, exactly 2 columns
    ),
    queries=[
        NumericalQueryBlock(
            name="customer_data",
            template=NumericalQueryTemplate(
                name="customer_data",
                cube_name="customers",
                query=SemanticLayerQuery(
                    measures=[cube.get_measure(name="impact_score", strict=True)],
                    dimensions=[cube.get_dimension(name="customer_name", strict=True)],
                    order=[("customers.impact_score", Order.DESC)],
                    limit=11,
                ),
                mode=NumericalQueryMode.TABLE,
            ),
        ),
    ],
)
```

### Direct Markdown Table (No LLM)

Use when table structure is fixed, just substitute values:

```python
table_block = TableBlock(
    name="comparison_table",
    template=TableBlockTemplate(
        name="relative_data_table",
        user_prompt="""<!-- table: Table -->
|                         | **Industry Avg** | **Your Results** | **Multiplier** |
|-------------------------|------------------|------------------|----------------|
| Connection Rate         | {industry_rate}  | {percent(connected/sent)} | X{number((connected/sent)/industry_rate, decimals=1)} |
| Reply Rate              | {reply_rate}     | {percent(replied/connected)} | X{number((replied/connected)/reply_rate, decimals=1)} |
| Book Rate               | {book_rate}      | {percent(meetings/sent)} | X{number((meetings/sent)/book_rate, decimals=1)} |
""",
        call_llm=False,  # Direct substitution, no LLM
    ),
    queries=[...],  # NumericalQueryBlocks for connected, sent, replied, meetings, etc.
)
```

### Query Output as Table (No Constraints)

```python
table_block = TableBlock(
    name="events_table",
    template=TableBlockTemplate(
        name="events_table",
        user_prompt="{table_query}",
        call_llm=False,
        target_shape=None,  # No size constraints
    ),
    queries=[
        NumericalQueryBlock(
            name="table_query",
            template=NumericalQueryTemplate(
                name="table_query",
                cube_name="events",
                query=SemanticLayerQuery(
                    measures=[cube.get_measure(name="count", strict=True)],
                    dimensions=[cube.get_dimension(name="event_type", strict=True)],
                ),
                mode=NumericalQueryMode.TABLE,
                pivot_dimension="events.timestamp",  # Pivot time into columns
            ),
        ),
    ],
)
```

---

## Shared Fields (from TextBlockTemplate)

| Field | Type | Description |
|-------|------|-------------|
| `name` | str | Template identifier |
| `user_prompt` | str | Template with variables and expressions |
| `call_llm` | bool | Whether to use LLM generation |

**Note**: `allowed_outputs` is NOT available on TableBlockTemplate.

---

## Usage Patterns

### Pattern 1: LLM-Generated Tables

Use when LLM needs to format/transform query data:

```python
TableBlockTemplate(
    name="summary_table",
    user_prompt="""Transform this data into a markdown table:
{raw_data}

Format: | Name | Value |
""",
    call_llm=True,
    target_shape=(5, 2),
)
```

### Pattern 2: Direct Markdown Templates

Use when table structure is fixed:

```python
TableBlockTemplate(
    name="metrics_table",
    user_prompt="""| Metric | Value |
|--------|-------|
| Revenue | ${revenue} |
| Users | {users} |
| Growth | {percent(growth)} |
""",
    call_llm=False,
)
```

### Pattern 3: Raw Query Output

Use query output directly as table:

```python
TableBlockTemplate(
    name="data_table",
    user_prompt="{query_result}",
    call_llm=False,
    target_shape=None,
)
```

---

## Best Practices

1. **Use `target_shape`** when LLM output must fit a specific slide layout
2. **Row ranges** like `((1, 11), 2)` are useful when data size varies
3. **TABLE mode queries** pair well with LLM table generation
4. **SINGLE_NUMBER mode queries** work best with pre-formatted markdown templates
5. **Pivot dimension** creates columns from a dimension's values

---

## Related Documentation

- For shared text/table functionality: see [_shared/content-block-fundamentals.md](../_shared/content-block-fundamentals.md)
- For NumericalQueryBlock: see [_shared/numerical-query-block.md](../_shared/numerical-query-block.md)
- For queries: see [_shared/query-fundamentals.md](../_shared/query-fundamentals.md)
