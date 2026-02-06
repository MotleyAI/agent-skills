# MCP Tools Reference

This document provides comprehensive documentation for all MCP tools available in the Motley backend.

## Overview

The Motley MCP server exposes 32 tools organized into five categories that support the complete workflow for creating data-driven presentations:

| Category | Tools | Purpose |
|----------|-------|---------|
| [Outline Tools](#outline-tools) | 8 | Deck planning and outline sessions |
| [Layout Tools](#layout-tools) | 5 | Layout libraries and template management |
| [Datasource Tools](#datasource-tools) | 6 | Data modeling and schema management |
| [Master Tools](#master-tools) | 9 | Operations on master decks and slides |
| [Element Tools](#element-tools) | 4 | Content blocks (text, table, chart, query) |

---

## Outline Tools

Tools for planning presentation structure before creating slides.

### create_outline

Create a new deck outline session for planning a presentation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | No | Title for the outline (defaults to "New Deck Outline") |

**Returns**: `session_id`, `title`, `created_at`

### get_outline

Get the complete state of a deck outline session including all slide cards.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | int | Yes | The ID of the deck outline session |

**Returns**: `id`, `title`, `cards` (list of OutlineCard), `card_count`

### clear_outline

Remove all slide cards from a deck outline session while keeping the session.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | int | Yes | The ID of the deck outline session |

**Returns**: `success`, `session_id`, `deleted_card_count`

### delete_outline

Completely delete a deck outline session and all its cards.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | int | Yes | The ID of the deck outline session to delete |

**Returns**: `success`, `deleted_session`, `deleted_card_count`

### add_outline_card

Add a new slide card to a deck outline session.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | int | Yes | The ID of the deck outline session |
| `title` | string | No | Card title (auto-generated if not provided) |
| `content` | string | No | Card content/context |
| `position` | int | No | Position to insert (0-indexed, appends if not provided) |
| `cube_names` | list[string] | No | Cube/datasource names relevant to this slide |

**Returns**: `success`, `card` (OutlineCard with id, title, content, position, cube_names)

### edit_outline_card

Edit a slide card's title and/or content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | int | Yes | The ID of the deck outline session |
| `card_id` | int | Yes | The ID of the card to edit |
| `title` | string | No | New title (must be unique within session) |
| `content` | string | No | New content |
| `cube_names` | list[string] | No | Updated cube/datasource names |

**Returns**: `success`, `card` (updated OutlineCard)

### move_outline_card

Move a slide card to a new position within the deck outline.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | int | Yes | The ID of the deck outline session |
| `card_id` | int | Yes | The ID of the card to move |
| `position` | int | Yes | The new position (0-indexed) |

**Returns**: `success`, `card` (with old_position and new_position)

### delete_outline_card

Delete a slide card from a deck outline session.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | int | Yes | The ID of the deck outline session |
| `card_id` | int | Yes | The ID of the card to delete |

**Returns**: `success`, `deleted_card` (with id, title, position)

---

## Layout Tools

Tools for managing layout libraries and master deck creation.

### list_layout_libraries

List all available layout libraries for the current user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | - | - | - |

**Returns**: `layout_libraries` (list with id, title, slide_count, created_at), `count`

### list_masters

List all master decks for the current user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | - | - | - |

**Returns**: `masters` (list with id, deck_id, title, slide_count, created_at), `count`

### inspect_layout_library

Get detailed structure of a layout library including layout names, element names, types, and content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `layout_library_id` | int | Yes | The ID of the layout library |

**Returns**: `id`, `title`, `layouts` (list with id, position, name, description, elements)

### get_thumbnails

Get thumbnail URLs for specific slides in a master or layout library.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_props_id` | int | Yes | The ID of the master or layout library |
| `layout_names` | list[string] | Yes | List of layout names to get thumbnails for |

**Returns**: `master_props_id`, `thumbnails` (list with layout_name, slide_id, thumbnail_url), `not_found`

### create_master

Create a new master from a template library. All slides are set to hidden initially.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `layout_library_id` | int | Yes | The ID of the template library |
| `name` | string | No | Name for the new master (derived from library if not provided) |

**Returns**: `success`, `master_id`, `deck_id`, `name`, `slide_count`, `created_at`

---

## Datasource Tools

Tools for data modeling and schema management.

### datasources_summary

List all available data sources with their schemas (dimensions, measures, derived dimensions). Does not include sample data.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | - | - | - |

**Returns**: `datasources` (list with name, description, dimensions, measures, derived_dimensions), `count`

### inspect_datasource

Get detailed information about a specific data source including sample data.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `datasource_name` | string | Yes | Name of the datasource to inspect |
| `num_rows` | int | No | Number of sample rows to include (default: 3) |
| `show_sql` | bool | No | Whether to include SQL query/table definition |

**Returns**: `name`, `description`, `dimensions`, `measures`, `derived_dimensions`, `extended_summary`, `sample_data_error`, `sql`, `sql_table`

### create_datasource

Create a new datasource (cube) from a SQL SELECT query. Introspects the query against an existing datasource's database connection to discover column types.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `datasource_name` | string | Yes | Existing datasource for database connection |
| `cube_name` | string | Yes | Name for the new cube |
| `sql` | string | Yes | The SQL SELECT query |
| `column_descriptions` | list[object] | No | Per-column descriptions (name, description pairs) |

**Returns**: `success`, `cube_name`, `datasource_name`, `dimensions`, `measures`

### add_measures

Add one or more custom measures with SQL expressions to an existing datasource.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `datasource_name` | string | Yes | Name of the datasource (cube) |
| `measures` | list[MeasureSpec] | Yes | List of measure specifications |

**MeasureSpec fields**:
- `name` (required): Name for the measure
- `sql` (required): SQL expression (e.g., "CASE WHEN status = 'active' THEN 1 ELSE 0 END")
- `type` (required): Aggregation type (count, count_distinct, count_distinct_approx, sum, avg, min, max, number)
- `description` (optional): Human-readable description
- `format` (optional): Format type (percent, currency, integer, float)
- `currency_symbol` (optional): Currency symbol when format='currency'

**Returns**: `success`, `datasource_name`, `added_measures`, `count`, `message`

### add_dimensions

Add one or more custom dimensions with SQL expressions to an existing datasource.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `datasource_name` | string | Yes | Name of the datasource (cube) |
| `dimensions` | list[DimensionSpec] | Yes | List of dimension specifications |

**DimensionSpec fields**:
- `name` (required): Name for the dimension
- `sql` (required): SQL expression
- `type` (required): Dimension type (string, time, date, boolean, number)
- `description` (optional): Human-readable description

**Returns**: `success`, `datasource_name`, `added_dimensions`, `count`, `message`

### delete_measures_dimensions

Delete one or more measures, dimensions, or derived dimensions by name from a datasource.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `datasource_name` | string | Yes | Name of the datasource (cube) |
| `names` | list[string] | Yes | Names of items to delete |

**Returns**: `success`, `datasource_name`, `deleted` (list with name, kind), `count`, `message`

---

## Master Tools

Tools for working with master decks and slides.

### get_master_summary

Get the outline of a master including slide names and block names.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | int | Yes | The ID of the master |

**Returns**: `id`, `deck_id`, `title`, `slides` (list with id, position, name, description, blocks)

### inspect_slide

Get the full content of a specific slide by name.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | int | Yes | The ID of the master |
| `slide_name` | string | Yes | The name of the slide |

**Returns**: Full slide domain model (dict)

### inspect_block

Get a specific content block from a slide.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | int | Yes | The ID of the master |
| `slide_name` | string | Yes | The name of the slide |
| `block_name` | string | Yes | The name of the block |

**Returns**: Full block domain model (dict)

### get_master_variables

Get all variables and their values for a master.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | int | Yes | The ID of the master |
| `slide_name` | string | No | Filter to a specific slide |
| `show_content` | bool | No | Include full payload content (default: false) |
| `show_context_vars` | bool | No | Include context variables (default: true) |

**Returns**: `master_id`, `deck_id`, `variables` (list with name, slide_name, type, payload_type, content)

### resolve_master

Trigger resolution of all outdated blocks in a master.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | int | Yes | The ID of the master |

**Returns**: `success`, `master_id`, `affected_blocks_count`, `affected_blocks`, `error`

### resolve_block

Mark a specific block as out of date and trigger resolution.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | int | Yes | The ID of the master |
| `slide_name` | string | Yes | The name of the slide |
| `block_name` | string | Yes | The name of the block |

**Returns**: `success`, `master_id`, `slide_name`, `block_name`, `resolved`, `error`

### copy_slide

Copy a slide with all its contents. Inline queries are cleared so the copied slide references the original's queries. The copied slide is always visible.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | int | Yes | The ID of the master |
| `slide_name` | string | Yes | Name of the slide to copy |
| `new_slide_name` | string | No | Name for the copied slide (auto-generated if not provided) |
| `position` | int | No | Position for the new slide (1-indexed, after original if not provided) |
| `element_descriptions` | list[object] | No | Descriptions to set on elements (name, description pairs) |
| `description` | string | No | Description for the slide itself |

**Returns**: `success`, `slide_id`, `slide_name`, `position`, `copied_from`

### move_slide

Move a slide to a new position within the master. All other slides are renumbered automatically.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | int | Yes | The ID of the master |
| `slide_name` | string | Yes | Name of the slide to move |
| `position` | int | Yes | New position for the slide (1-indexed) |

**Returns**: `success`, `slide_id`, `slide_name`, `old_position`, `new_position`

### delete_slide

Delete a slide from the master. This is a soft delete - the slide can be restored later.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | int | Yes | The ID of the master |
| `slide_name` | string | Yes | Name of the slide to delete |

**Returns**: `success`, `slide_id`, `slide_name`, `position`, `message`

---

## Element Tools

Tools for creating and updating content blocks.

### update_text_block

Update the template of a text block and resolve it.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | int | Yes | The ID of the master |
| `slide_name` | string | Yes | The name of the slide |
| `block_name` | string | Yes | The name of the block |
| `user_prompt` | string | Yes | The new user prompt for the text block template |
| `call_llm` | bool | No | Whether to call LLM to generate content (default: false) |
| `allowed_outputs` | list[string] | No | Allowed outputs for constrained LLM generation |

**Returns**: `success`, `slide_name`, `block_name`, `block` (full text block)

### update_table_block

Update the template of a table block and resolve it.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | int | Yes | The ID of the master |
| `slide_name` | string | Yes | The name of the slide |
| `block_name` | string | Yes | The name of the block |
| `user_prompt` | string | Yes | The new user prompt for the table block template |
| `call_llm` | bool | No | Whether to call LLM to generate content (default: false) |
| `target_shape` | tuple | No | Target shape constraints (rows, columns) |

**target_shape format**: `(rows, columns)` where each can be:
- `None` - no constraint
- `int` - exact count
- `(min, max)` - range (inclusive)

**Returns**: `success`, `slide_name`, `block_name`, `block` (full table block)

### update_chart_block

Regenerate a chart block using an LLM based on a natural language prompt.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | int | Yes | The ID of the master |
| `slide_name` | string | Yes | The name of the slide |
| `block_name` | string | Yes | The name of the chart block |
| `prompt` | string | Yes | Natural language description of the desired chart |
| `cube_name` | string | No | Cube/datasource name to use (limits query generation to this cube) |

**Returns**: `success`, `master_id`, `slide_name`, `block_name`, `message`

### update_query_block

Create or update a numerical query within a parent text or table block's queries list.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | int | Yes | The ID of the master |
| `slide_name` | string | Yes | The name of the slide |
| `parent_block` | string | Yes | Name of the text/table block containing the queries |
| `query_name` | string | Yes | Name of the query within the parent block's queries list |
| `prompt` | string | Yes | Natural language description of the desired query |
| `cube_name` | string | No | Cube/datasource name (limits query generation) |
| `mode` | string | No | Query mode: "single_number" (default) or "table" |
| `pivot_dimension` | string | No | Dimension to pivot into columns (only for mode="table") |
| `transpose` | bool | No | Whether to transpose the table (only for mode="table") |

**Returns**: `success`, `master_id`, `slide_name`, `parent_block`, `query_name`, `action` ("created" or "updated"), `block`

---

## Workflow Example

A typical workflow using these tools:

1. **Plan** - Use outline tools to plan the presentation structure
   - `create_outline` - Start a new outline session
   - `add_outline_card` - Add slide cards with content descriptions
   - `edit_outline_card`, `move_outline_card` - Refine the outline

2. **Setup** - Prepare layout and data
   - `list_layout_libraries` - Find available templates
   - `inspect_layout_library` - Examine layout structure
   - `datasources_summary` - Review available data sources
   - `inspect_datasource` - Check data structure and sample data

3. **Create** - Build the master deck
   - `create_master` - Create a new master from a template
   - `get_master_summary` - Review the deck structure

4. **Populate** - Add content to slides
   - `copy_slide` - Create slides from templates
   - `update_text_block` - Add text content
   - `update_table_block` - Add data tables
   - `update_chart_block` - Add visualizations
   - `update_query_block` - Configure data queries

5. **Review** - Check and refine
   - `inspect_slide`, `inspect_block` - Review content
   - `get_master_variables` - Check available variables
   - `resolve_master` - Trigger resolution of all blocks
   - `move_slide`, `delete_slide` - Organize slides

---

## Related Documentation

- [Skills Reference](skills.md) - Detailed skill documentation
- [Setup Guide](setup.md) - Installation and configuration
