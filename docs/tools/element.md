# Element Tools

Tools for updating content blocks within slides - text, tables, charts, and queries.

[Back to Tools Overview](../tools.md)

---

## update_text_block

Update the template of a text block and resolve it to generate content.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master containing the slide. |
| `slide_name` | string | **Yes** | The slide containing the text block. |
| `block_name` | string | **Yes** | The text block to update. |
| `user_prompt` | string | **Yes** | The template content with `{variable}` placeholders. Valid CommonMark markdown. |
| `call_llm` | boolean | No | When true, pass template to LLM for generation. Default: false (direct variable substitution). |
| `allowed_outputs` | array[string] | No | Constrain LLM to these exact outputs. Only valid when `call_llm=true`. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `slide_name` | string | The slide that was updated |
| `block_name` | string | The block that was updated |
| `block` | object | The updated block domain model |

### Notes

- When `call_llm=false`, variables in `{curly_braces}` are directly substituted
- When `call_llm=true`, the template is sent to an LLM for generation with variable context
- Use `allowed_outputs` to constrain LLM responses to specific values (e.g., sentiment classification)

### Example Template

```markdown
## {client_name} Performance Summary

Revenue for the period was {revenue_query}, representing a {growth_pct}% change.
```

---

## update_table_block

Update the template of a table block and resolve it to generate content.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master containing the slide. |
| `slide_name` | string | **Yes** | The slide containing the table block. |
| `block_name` | string | **Yes** | The table block to update. |
| `user_prompt` | string | **Yes** | The template content for the table. Uses markdown table syntax or variable references. |
| `call_llm` | boolean | No | When true, use LLM to generate table content. Default: false. |
| `target_shape` | tuple | No | Table dimension constraints. See below for format. |

### target_shape Format

The `target_shape` parameter constrains table dimensions as `(rows, columns)`. Each dimension can be:

| Value | Meaning |
|-------|---------|
| `null` | No constraint on this dimension |
| `int` | Exact count required |
| `[min, max]` | Range (inclusive) |

**Examples:**
- `[null, 2]` - Any number of rows, exactly 2 columns
- `[[1, 11], 2]` - Between 1 and 11 rows, exactly 2 columns
- `[5, null]` - Exactly 5 rows, any number of columns

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `slide_name` | string | The slide that was updated |
| `block_name` | string | The block that was updated |
| `block` | object | The updated block domain model |

---

## update_chart_block

Regenerate a chart block using an LLM-based prompt.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master containing the slide. |
| `slide_name` | string | **Yes** | The slide containing the chart. |
| `block_name` | string | **Yes** | The chart block to regenerate. |
| `prompt` | string | **Yes** | Natural language description of the desired chart. |
| `cube_name` | string | No | Limit query generation to this specific cube. If omitted, all cubes are available. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `master_id` | integer | The master |
| `slide_name` | string | The slide |
| `block_name` | string | The chart block |
| `message` | string | Confirmation message |

### Notes

- Uses Claude Opus 4.5 for high-quality chart generation
- The chart's existing description is preserved on the new block
- The generated chart is marked as out-of-date and needs resolution

### Example Prompts

```
Show monthly revenue trend for the last 12 months as a line chart
```

```
Create a bar chart comparing sales by region, sorted by value descending
```

```
Pie chart of customer distribution by subscription tier
```

---

## update_query_block

Create or update a numerical query within a parent text or table block's queries list.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master containing the slide. |
| `slide_name` | string | **Yes** | The slide containing the parent block. |
| `parent_block` | string | **Yes** | The text or table block containing the queries list. |
| `query_name` | string | **Yes** | Identifier for the query within the parent's queries list. Creates new if not found. |
| `prompt` | string | **Yes** | Natural language description of the query. |
| `cube_name` | string | No | Limit to a specific cube. If omitted, all cubes are available. |
| `mode` | string | No | Query mode. Default: `"single_number"`. |
| `pivot_dimension` | string | No | Dimension to pivot into columns (table mode only). Format: `"dim_name"` or `"cube_name.dim_name"`. |
| `transpose` | boolean | No | Swap rows and columns (table mode only). Default: false. |

### Query Modes

| Mode | Description |
|------|-------------|
| `single_number` | Returns a single aggregate value (e.g., total revenue). Use for KPIs. |
| `table` | Returns a full result set with multiple rows/columns. Supports pivoting and transpose. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `master_id` | integer | The master |
| `slide_name` | string | The slide |
| `parent_block` | string | The parent block name |
| `query_name` | string | The query identifier |
| `action` | string | Either `"created"` or `"updated"` |
| `block` | object | The generated query block |

### Notes

- Uses Claude Opus 4.5 for query generation from natural language
- The query is added to `parent_block.queries` and can be referenced as `{query_name}` in the parent's template
- If updating an existing query, context from the previous query is provided to the LLM

### Example Prompts

**Single number mode:**
```
Total revenue for the selected date range
```

**Table mode:**
```
Monthly revenue breakdown by product category
```

**Table mode with pivot:**
```
Sales by region with months as columns (set pivot_dimension="month")
```

---

## render_chart

Render a chart block to a PNG image and return it as base64-encoded data.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master containing the slide. |
| `slide_name` | string | **Yes** | The slide containing the chart. |
| `block_name` | string | **Yes** | The chart block to render. |
| `width` | integer | No | Image width in pixels. Default: 800. |
| `height` | integer | No | Image height in pixels. Default: 600. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether rendering succeeded |
| `master_id` | integer | The master ID |
| `slide_name` | string | The slide name |
| `block_name` | string | The block name |
| `image_base64` | string | Base64-encoded PNG image data |
| `width` | integer | Actual image width used |
| `height` | integer | Actual image height used |
| `resolved` | boolean | Whether resolution was triggered (true if chart had no content) |
| `error` | string | Error message (only if success=false) |

### Notes

- If the chart has not been resolved (no content), resolution is triggered automatically first
- The image is rendered using ECharts and returned as base64-encoded PNG data
- Default dimensions are 800x600 pixels
- Uses 100 DPI internally for converting pixels to inches

### Example Usage

```
render_chart(master_id=42, slide_name="Overview", block_name="revenue_chart")
```

```
render_chart(master_id=42, slide_name="Detail", block_name="trend_chart", width=1200, height=800)
```
