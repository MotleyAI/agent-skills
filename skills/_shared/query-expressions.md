# Query Expressions

Query expressions allow you to create computed columns from query results and context variables. Expressions are evaluated **after** the Cube.js query returns, operating on the resulting DataFrame.

## When to Use QueryExpression

Use `QueryExpression` when you need to:
1. **Simple arithmetic on query results** (ratios, percentages) - post-query DataFrame operations
2. **Row-by-row calculations** like `diff()` - consecutive difference after query returns
3. **Display computed columns** without affecting grouping - just adds columns to results

**Note**: For time-series functions (`change`, `last`, `change_latest`) or filtering/grouping by computed values, use `DerivedDimension` instead. See the `derived-dimensions` skill.

## Required Imports

```python
from storyline.semantic.query_components import QueryExpression
from storyline.semantic.query import SemanticLayerQuery, ColumnWithCubeName
from storyline.domain.format import NumberFormat
```

---

## QueryExpression Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | str | Yes | The name of the new column created by this expression |
| `description` | str | No | Human-readable description of what this expression computes |
| `expression` | str | Yes | The expression to evaluate (see Expression Syntax below) |
| `required_dimensions` | List[ColumnWithCubeName] | No | Dimensions needed for evaluation but dropped from final result |
| `required_measures` | List[ColumnWithCubeName] | No | Measures needed for evaluation but dropped from final result |
| `format` | NumberFormat | No | Number format for display in charts |

---

## Expression Syntax

### Column References

Reference query columns using fully qualified names: `cube_name.column_name`

```python
expression="revenue.total_revenue / revenue.transaction_count"
```

### Context Variables

Reference context variables (numerical constants or dates) by name:

```python
expression="days(end_date - profile.created_at)"  # end_date is a context variable
```

### Arithmetic Operators

| Operator | Description |
|----------|-------------|
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `()` | Grouping |

### Available Functions

| Function | Description | Example |
|----------|-------------|---------|
| `floor(x)` | Round down to nearest integer | `floor(value)` |
| `ceil(x)` | Round up to nearest integer | `ceil(value)` |
| `round(x)` | Round to nearest integer | `round(value)` |
| `abs(x)` | Absolute value | `abs(change)` |
| `min(a, b)` | Minimum of two values | `min(start, profile.created)` |
| `max(a, b)` | Maximum of two values | `max(start, profile.created)` |
| `days(date_expr)` | Days between dates | `days(end - start)` |
| `diff(x)` | Consecutive difference (first row NaN) | `diff(revenue.total)` |

---

## Examples

### Simple Ratio

```python
query = SemanticLayerQuery(
    measures=[
        cube.get_measure(name="total_revenue", strict=True),
        cube.get_measure(name="total_cost", strict=True),
    ],
    dimensions=[],
    expressions=[
        QueryExpression(
            name="profit_margin",
            description="Profit margin as percentage",
            expression="(revenue.total_revenue - revenue.total_cost) / revenue.total_revenue * 100",
        )
    ],
)
```

### Using required_dimensions

Fetch additional data for expression without including it in final output:

```python
QueryExpression(
    name="revenue_per_employee",
    description="Revenue divided by employee count",
    expression="revenue.revenue / company.employee_count",
    required_dimensions=[
        company_cube.get_dimension(name="employee_count", strict=True),
    ],
)
```

### Row-by-row consecutive difference

```python
QueryExpression(
    name="revenue_change",
    description="Change in revenue from previous month",
    expression="diff(revenue.total_revenue)",
)
```

The `diff()` function computes the consecutive difference between rows. The first row will contain NaN.

---

## QueryExpression vs DerivedDimension

| Use Case | Solution |
|----------|----------|
| Compute ratio as a column | `QueryExpression` |
| Row-by-row consecutive diff | `QueryExpression` with `diff()` |
| Period-over-period change | `DerivedDimension` with `change()` |
| Group by ratio bucket | `DerivedDimension` with `evaluation_dimensions` |
| Filter where `revenue/cost > 0.5` | `DerivedDimensionFilter` |

**Key distinction**: QueryExpression operates row-by-row on returned DataFrames; DerivedDimension runs sub-queries BEFORE the main query (enabling grouping/filtering by computed values).

---

## Best Practices

1. **Use fully qualified names** for all column references: `cube_name.column_name`
2. **Document expressions** with the `description` field for maintainability
3. **Use `required_dimensions`/`required_measures`** for data needed only during calculation
4. **Test expressions** with sample data before deploying to production
5. **Consider null handling** - expressions may fail if referenced columns contain nulls

---

## Related Documentation

- For time-series functions: see the `derived-dimensions` skill
- For query formation: see [query-fundamentals.md](query-fundamentals.md)
