# Resolution Context - Auto-Generated Variables

During slide deck resolution, `TemplateFilterValues.to_context()` automatically generates context variables from the base filter values provided by the user.

## Auto-Generated Variables

| Variable | Source | Format | Example |
|----------|--------|--------|---------|
| `end_month` | Formatted from `end_date` | `%B %Y` | "December 2025" |
| `start_month` | Formatted from `start_date` | `%B %Y` | "September 2025" |
| `quarter` | Derived from `end_date` (minus 30 days) | `QN YYYY` | "Q4 2025" |
| `now_date` | Current date | date | 2025-01-08 |
| `now_month` | Formatted from `now_date` | `%B %Y` | "January 2025" |
| `customer_name` | Copy of `client_name` | string | "Acme Corp" |

## Base Variables (User-Provided)

| Variable | Type | Description |
|----------|------|-------------|
| `end_date` | date | End date for time-based filters |
| `start_date` | date | Start date for time-based filters |
| `client_name` | str/int | Customer/client name for filtering |

## Resolution Flow

1. User provides context dict with base variables (`end_date`, `start_date`, `client_name`)
2. `ResolutionContext.from_dict()` or `TemplateFilterValues.from_context_dict()` parses into typed model
3. `TemplateFilterValues.to_context()` generates auto-derived variables:
   - `end_month` - formatted end date
   - `start_month` - formatted start date
   - `quarter` - derived quarter string
   - `now_date` / `now_month` - current date values
   - `customer_name` - alias for client_name
4. `slide_deck.prepare_resolution_context()` merges:
   - Auto-generated variables from `TemplateFilterValues.to_context()`
   - Query results (resolved NumericalQueryBlocks)
   - Per-slide reference contexts
5. Templates access all variables via `{variable_name}` syntax

## Usage Example

```python
# User provides base context
context = {
    "end_date": datetime.date(2025, 12, 8),
    "client_name": "A Client",
    "start_date": datetime.date(2025, 9, 8),
}
context = ResolutionContext.from_dict(context)

# During resolution, templates can reference:
# - {end_date} -> "2025-12-08"
# - {end_month} -> "December 2025"  (auto-generated)
# - {quarter} -> "Q4 2025"  (auto-generated)
# - {client_name} -> "A Client"
# - {customer_name} -> "A Client"  (auto-generated alias)
```

## Using in Filters

Context variables are referenced using `NormalizedReference`:

```python
from storyline.domain.resolve.normalized_reference import NormalizedReference

# Reference for filter templates
end_date_ref = NormalizedReference.from_raw(
    source_slide=None,  # None for global variables
    original_name="end_date",
)

# Use in TimeFilterTemplate
TimeFilterTemplate(
    member=time_dimension,
    time_interval=TimeIntervalWithGranularity(
        granularity=TimeGranularity.MONTH,
        count=12,
    ),
    end_date_variable=end_date_ref,
)
```

## Using in Expressions

In `TextBlockTemplate.user_prompt` and `TableBlockTemplate.user_prompt`:

```python
user_prompt = """
Report Period: {start_month} to {end_month}
Quarter: {quarter}
Customer: {customer_name}
"""
```

## Source Code References

- `storyline/domain/template_filter_values.py` - TemplateFilterValues class with `to_context()` method
- `storyline/domain/resolve/resolution_context.py` - ResolutionContext class
- `storyline/slides/slide_deck.py` - `prepare_resolution_context()` method
