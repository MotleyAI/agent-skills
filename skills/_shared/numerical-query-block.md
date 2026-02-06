# NumericalQueryBlock Reference

`NumericalQueryBlock` provides data to templates by executing queries and exposing results as variables.

## Required Imports

```python
from storyline.domain.content.query_block import (
    NumericalQueryBlock,
    NumericalQueryTemplate,
    NumericalQueryMode,
)
from storyline.semantic.query import SemanticLayerQuery
from storyline.semantic.datasource import ColumnWithCubeName
```

---

## Basic Structure

```python
NumericalQueryBlock(
    name="query_block_name",  # Matches {query_block_name} in user_prompt
    template=NumericalQueryTemplate(
        name="template_name",
        cube_name="cube_name",
        query=SemanticLayerQuery(...),  # See query-fundamentals.md
        mode=NumericalQueryMode.SINGLE_NUMBER,
        format=".0f",
    ),
    cube_name="cube_name",  # Legacy; prefer setting on template
)
```

---

## NumericalQueryTemplate Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | str | Template identifier |
| `cube_name` | str | The cube to query |
| `query` | SemanticLayerQuery | The query definition (see [query-fundamentals.md](query-fundamentals.md)) |
| `mode` | NumericalQueryMode | `SINGLE_NUMBER` or `TABLE` |
| `format` | str | Printf-style format like ".0f", ".2f" |
| `column` | str | For SINGLE_NUMBER: which column to extract (format: `cube.column`) |
| `pivot_dimension` | str | For TABLE: dimension to pivot into columns |
| `filter_templates` | list | Filter templates (TimeFilterTemplate, BasicFilterTemplate) |

---

## NumericalQueryMode

| Mode | Description | Use Case |
|------|-------------|----------|
| `SINGLE_NUMBER` | Extract single value from query result | Inline metrics: "Revenue: {revenue}" |
| `TABLE` | Return formatted table | LLM analysis: "Analyze this data: {table}" |

---

## SINGLE_NUMBER Mode

Use when you need a single value to substitute into text.

```python
text_block = TextBlock(
    name="metrics_block",
    template=TextBlockTemplate(
        name="metrics_template",
        user_prompt="Total revenue: ${total_revenue}\nTotal users: {user_count}",
        call_llm=False,
    ),
    queries=[
        NumericalQueryBlock(
            name="total_revenue",  # Matches {total_revenue}
            template=NumericalQueryTemplate(
                name="revenue_query",
                cube_name="revenue",
                query=SemanticLayerQuery(
                    measures=[cube.get_measure(name="total_revenue", strict=True)],
                    dimensions=[],
                ),
                mode=NumericalQueryMode.SINGLE_NUMBER,
                format=".0f",
            ),
        ),
        NumericalQueryBlock(
            name="user_count",  # Matches {user_count}
            template=NumericalQueryTemplate(
                name="users_query",
                cube_name="users",
                query=SemanticLayerQuery(
                    measures=[cube.get_measure(name="count", strict=True)],
                    dimensions=[],
                ),
                mode=NumericalQueryMode.SINGLE_NUMBER,
            ),
        ),
    ],
)
```

### Specifying Column for SINGLE_NUMBER

When a query returns multiple columns, use `column` to specify which value to extract:

```python
NumericalQueryTemplate(
    name="specific_column_query",
    cube_name="funnel",
    query=SemanticLayerQuery(
        measures=[cube.get_measure(name="count", strict=True)],
        dimensions=[cube.get_dimension(name="profile_name", strict=True)],
        order=[("funnel.count", Order.DESC)],
        limit=1,
    ),
    mode=NumericalQueryMode.SINGLE_NUMBER,
    column="funnel.profile_name",  # Extract the profile name, not the count
)
```

---

## TABLE Mode

Use when the LLM needs to analyze tabular data.

```python
text_block = TextBlock(
    name="analysis_block",
    template=TextBlockTemplate(
        name="analysis_template",
        user_prompt="""Summarize the sales performance based on this data:
{sales_data}

Provide a 2-sentence summary.""",
        call_llm=True,
    ),
    queries=[
        NumericalQueryBlock(
            name="sales_data",  # Matches {sales_data}
            template=NumericalQueryTemplate(
                name="sales_query",
                cube_name="sales",
                query=SemanticLayerQuery(
                    measures=[cube.get_measure(name="revenue", strict=True)],
                    time_dimensions=[
                        QueryTimeDimension(
                            dimension=cube.get_dimension(name="time", strict=True),
                            granularity=TimeGranularity.MONTH,
                        )
                    ],
                ),
                mode=NumericalQueryMode.TABLE,  # Returns formatted table
            ),
        ),
    ],
)
```

### Pivot Dimension for Tables

Pivot a dimension into columns:

```python
NumericalQueryTemplate(
    name="pivoted_table",
    cube_name="events",
    query=SemanticLayerQuery(
        measures=[cube.get_measure(name="count", strict=True)],
        dimensions=[cube.get_dimension(name="event_type", strict=True)],
        time_dimensions=[
            QueryTimeDimension(
                dimension=cube.get_dimension(name="timestamp", strict=True),
                granularity=TimeGranularity.MONTH,
            )
        ],
    ),
    mode=NumericalQueryMode.TABLE,
    pivot_dimension="events.timestamp",  # Pivot time into columns
)
```

---

## With Filter Templates

Use `filter_templates` to add parameterized filters:

```python
from storyline.domain.content.filter_template import BasicFilterTemplate
from storyline.domain.resolve.normalized_reference import NormalizedReference
from storyline.semantic.filter import FilterOperator

NumericalQueryTemplate(
    name="filtered_query",
    cube_name="prospect",
    query=SemanticLayerQuery(
        measures=[cube.get_measure(name="count", strict=True)],
        dimensions=[],
    ),
    filter_templates=[
        BasicFilterTemplate(
            member=cube.get_dimension(name="organization_name", strict=True),
            operator=FilterOperator.EQUALS,
            values_name=NormalizedReference.from_raw(
                source_slide=None,
                original_name="customer_name",
            ),
        ),
    ],
    mode=NumericalQueryMode.SINGLE_NUMBER,
)
```

See [filter-reference.md](filter-reference.md) for full filter documentation.

---

## Best Practices

1. **Match names exactly**: Query block `name` must match the variable reference in `user_prompt`
2. **Use SINGLE_NUMBER for inline values**: When substituting into text
3. **Use TABLE for LLM analysis**: When the LLM needs to analyze data
4. **Set format strings**: Use `format=".0f"` for integers, `format=".2f"` for decimals
5. **Use column for multi-column queries**: When extracting a specific column from a query with dimensions

---

## Related Documentation

- For query formation: see [query-fundamentals.md](query-fundamentals.md)
- For expression syntax: see [content-block-fundamentals.md](content-block-fundamentals.md)
- For filters: see [filter-reference.md](filter-reference.md)
