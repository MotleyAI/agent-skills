# MCP Tools Reference

Comprehensive reference for all 32 tools available via the Motley MCP server.

## Overview

The MCP server provides tools for building data-driven presentations programmatically. Tools are organized into five categories based on the resources they operate on.

## Tool Categories

| Category | Tools | Description |
|----------|-------|-------------|
| [Outline](tools/outline.md) | 8 | Deck planning and outline sessions |
| [Layout](tools/layout.md) | 5 | Layout libraries and master creation |
| [Datasource](tools/datasource.md) | 6 | Data source management and schema modification |
| [Master](tools/master.md) | 9 | Master inspection, resolution, and slide management |
| [Element](tools/element.md) | 4 | Content block updates (text, table, chart, query) |

## Quick Reference

### Outline Tools

| Tool | Description |
|------|-------------|
| `create_outline` | Create a new deck outline session |
| `get_outline` | Get complete outline with all cards |
| `clear_outline` | Remove all cards, keep session |
| `delete_outline` | Delete session and all cards |
| `add_outline_card` | Add a card to an outline |
| `edit_outline_card` | Edit card title/content/cubes |
| `move_outline_card` | Reposition a card |
| `delete_outline_card` | Remove a card |

### Layout Tools

| Tool | Description |
|------|-------------|
| `list_layout_libraries` | List available layout libraries |
| `list_masters` | List all master decks |
| `inspect_layout_library` | Get library structure details |
| `get_thumbnails` | Get slide thumbnail URLs |
| `create_master` | Create master from library |

### Datasource Tools

| Tool | Description |
|------|-------------|
| `datasources_summary` | List all cubes with schemas |
| `inspect_datasource` | Get cube details with sample data |
| `create_datasource` | Create cube from SQL query |
| `add_measures` | Add custom measures to cube |
| `add_dimensions` | Add custom dimensions to cube |
| `delete_measures_dimensions` | Remove measures/dimensions |

### Master Tools

| Tool | Description |
|------|-------------|
| `get_master_summary` | Get master outline with slides |
| `inspect_slide` | Get full slide content |
| `inspect_block` | Get block configuration |
| `get_master_variables` | List available variables |
| `resolve_master` | Resolve all outdated blocks |
| `resolve_block` | Force-resolve specific block |
| `copy_slide` | Duplicate a slide |
| `move_slide` | Reposition a slide |
| `delete_slide` | Remove a slide |

### Element Tools

| Tool | Description |
|------|-------------|
| `update_text_block` | Set text template and resolve |
| `update_table_block` | Set table template and resolve |
| `update_chart_block` | Generate chart from prompt |
| `update_query_block` | Create/update query in block |

## Typical Workflow

### 1. Discover Available Resources

```
list_layout_libraries()      → Find template libraries
list_masters()               → Find existing masters
datasources_summary()        → List available data sources
```

### 2. Create and Configure a Master

```
create_master(layout_library_id=1)
  → Returns master_id

get_master_summary(master_id=42)
  → See slides and blocks
```

### 3. Inspect and Understand Structure

```
inspect_slide(master_id=42, slide_name="Revenue")
  → Full slide content and variables

inspect_datasource(datasource_name="sales_data")
  → Schema and sample data
```

### 4. Configure Content

```
update_query_block(
    master_id=42,
    slide_name="Revenue",
    parent_block="metrics",
    query_name="total_revenue",
    prompt="Total revenue for selected period"
)

update_text_block(
    master_id=42,
    slide_name="Revenue",
    block_name="summary",
    user_prompt="Revenue: {total_revenue}"
)
```

### 5. Resolve and Review

```
resolve_master(master_id=42)
  → Execute queries and generate content

inspect_block(master_id=42, slide_name="Revenue", block_name="summary")
  → Verify generated content
```

### 6. Customize Slides

```
copy_slide(
    master_id=42,
    slide_name="Revenue",
    new_slide_name="Q1_Revenue",
    description="Q1 2024 revenue analysis"
)

move_slide(master_id=42, slide_name="Q1_Revenue", position=2)
```

## Error Handling

All tools return structured responses. On failure:

- `success: false` is returned (where applicable)
- `error` field contains the error message
- Common errors:
  - "Master not found or access denied"
  - "Slide 'X' not found in master Y"
  - "Block 'X' not found in slide 'Y'"
  - "Resolution failed: ..."

## See Also

- [Setup Guide](setup.md) — Installation and configuration
- [Skills Reference](skills.md) — Domain knowledge for queries, charts, text, and tables
- [Bundle Overview](README.md) — MCP bundle features and architecture
