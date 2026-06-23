# Resolution Context — Document & Master Variables

When a document or master is resolved, context variables become available to templates. Some are universally available; others are source-specific.

## Universal Variables (always available)

These exist on every document/master regardless of the data source — they're driven by the date parameters set at creation time (and refreshable via `set_doc_variables` on documents or master `sample_parameters`).

| Variable | Type | Description |
|----------|------|-------------|
| `start_date` | date | Start date for time-based filters |
| `end_date` | date | End date for time-based filters |

### Auto-Generated From Dates

| Variable | Source | Format | Example |
|----------|--------|--------|---------|
| `end_month` | Formatted from `end_date` | `%B %Y` | "December 2025" |
| `start_month` | Formatted from `start_date` | `%B %Y` | "September 2025" |
| `quarter` | Derived from `end_date` (minus 30 days) | `QN YYYY` | "Q4 2025" |
| `now_date` | Current date | date | 2025-01-08 |
| `now_month` | Formatted from `now_date` | `%B %Y` | "January 2025" |

## Source-Specific Variables

Anything beyond the date keys above (e.g. `client_name`, `customer_name`, `region`) only exists when the **data source declares it via a default filter**. For sources without such declarations (e.g. demo sources like Jaffle Shop), these variables are NOT available — referencing them in a template will fail at resolution time.

Always discover what's actually available for the current document with:

```
get_doc_variables(doc_id=..., show_context_vars=true)
```

The response lists every variable the document can resolve — universal date keys plus whatever source-specific keys the source has declared.

## Using in Templates

Reference any available context variable in `user_prompt` for `update_text_block` or `update_table_block`:

```
Report Period: {start_month} to {end_month}
Quarter: {quarter}
```

If `get_doc_variables` shows a `client_name` (or any other source-specific variable), it can be referenced the same way:

```
Customer: {client_name}
```

These variables are available alongside query block results — no query block is needed.

## How Context Flows to Queries

`update_query_block` and `update_chart_block` take a fully structured **SLayer** query — you build the `subqueries[...]` shape yourself (see the `update-query-block` skill). Context variables flow into that query in two ways:

- **Date range.** The document's `start_date` / `end_date` are automatically applied to the query's `time_dimensions` — you don't need to inline a date range. The doc's `whole_periods_only` default (true) snaps to bucket boundaries and excludes the current incomplete bucket.
- **Source-specific filters.** When the source declares default filters parametrized by variables (e.g. `customer_name`, `client_name`), they auto-apply to every query on that source. Set their values with `set_doc_variables`; the query block's own `filters` then compose with the source defaults.

You can also reference any doc variable explicitly inside your own filter strings via `{variable_name}` placeholders, e.g. `"filters": ["customer_name = '{customer_name}'"]`.

## Related Documentation

- For expression syntax using variables: see [variable-reference-syntax.md](variable-reference-syntax.md)
