# Master Tools

Tools for working with masters - inspecting, resolving, and managing slides.

[Back to Tools Overview](../tools.md)

---

## get_master_summary

Get the outline of a master including slide names, positions, descriptions, and block names.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master's ID (from `list_masters` or `create_master`). |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Master identifier |
| `deck_id` | integer | Associated deck identifier |
| `title` | string | Master title |
| `slides` | array | List of slide summaries |

Each slide in the array contains:
- `id` - Slide database ID
- `position` - Position in the deck (1-indexed)
- `name` - Slide name (use this to reference the slide)
- `description` - Slide description
- `blocks` - Array of block names in the slide

---

## inspect_slide

Get the full content of a specific slide including layout, blocks, and available variables.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master containing the slide. |
| `slide_name` | string | **Yes** | The exact name of the slide to inspect (from `get_master_summary`). |

### Returns

Returns the full slide domain model as a JSON object, including:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Slide name |
| `layout` | object | Full layout structure with all blocks |
| `variables` | array | Available variables for this slide |

The `variables` array includes context variables and block-generated variables that can be used in templates.

### Notes

- Heavy fields (like chart images) are stripped from the response to reduce size
- Block directives are stripped from the response

---

## inspect_block

Get the complete configuration of a specific content block.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master containing the block. |
| `slide_name` | string | **Yes** | The slide containing the block. |
| `block_name` | string | **Yes** | The specific block to inspect (from `get_master_summary` or `inspect_slide`). |

### Returns

Returns the full block domain model as a JSON object. The structure varies by block type but typically includes:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Block name |
| `type` | string | Block type (text, table, chart, etc.) |
| `description` | string | Block description |
| `template` | object | Template configuration (if applicable) |
| `content` | varies | Resolved content (if available) |
| `queries` | array | Associated queries (for text/table blocks) |
| `is_out_of_date` | boolean | Whether the block needs re-resolution |

---

## get_master_variables

Get all variables and their values for a master, optionally filtered to a specific slide.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master to query. |
| `slide_name` | string | No | Filter to a specific slide. If omitted, returns variables from all slides. |
| `show_content` | boolean | No | Include full payload content for each variable. Default: false. |
| `show_context_vars` | boolean | No | Include context variables (magic keys, resolution context). Default: true. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `master_id` | integer | The master queried |
| `deck_id` | integer | Associated deck identifier |
| `variables` | array | List of variable definitions |

Each variable includes:
- `name` - Variable name (usable in templates as `{name}`)
- `slide_name` - Source slide (or null for context variables)
- `type` - Variable type (context, text, table, chart, numerical_query)
- `payload_type` - Payload type (if applicable)
- `content` - Full payload (only if `show_content=true`)

---

## resolve_master

Trigger resolution of all outdated blocks across all slides in a master.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master to resolve. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether resolution completed |
| `master_id` | integer | The master that was resolved |
| `affected_blocks_count` | integer | Number of blocks that were resolved |
| `affected_blocks` | array | List of resolved blocks with `slide_id` and `block_name` |
| `error` | string | Error message (only if `success=false`) |

### Notes

- Only blocks marked as `is_out_of_date=true` are resolved
- Resolution runs queries, generates text/table content, and renders charts

---

## resolve_block

Mark a specific block as out-of-date and trigger its resolution.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master containing the block. |
| `slide_name` | string | **Yes** | The slide containing the block. |
| `block_name` | string | **Yes** | The specific block to mark out-of-date and resolve. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether resolution completed |
| `master_id` | integer | The master |
| `slide_name` | string | The slide |
| `block_name` | string | The block |
| `resolved` | boolean | Whether the block was actually resolved |
| `error` | string | Error message (only if `success=false`) |

### Notes

- The block is first marked as `is_out_of_date=true`, then resolution is triggered
- Use this to force re-resolution of a specific block after changing its template

---

## copy_slide

Copy a slide with all its contents to a new position.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master containing the slide. |
| `slide_name` | string | **Yes** | The source slide to copy. |
| `new_slide_name` | string | No | Name for the copy. Auto-generated (e.g., "Slide_1", "Slide_2") if not provided. |
| `position` | integer | No | 1-indexed position for the new slide. Places immediately after the original if not provided. |
| `element_descriptions` | array[object] | No | Descriptions to set on elements. Each entry has `name` (element name) and `description` (text). |
| `description` | string | No | Description for the slide itself (saved to the layout's description field). |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `slide_id` | integer | Database ID of the new slide |
| `slide_name` | string | Name of the new slide |
| `position` | integer | Position of the new slide |
| `copied_from` | string | Name of the source slide |

### Notes

- The copied slide is always visible (`hidden=false`), even if the source was hidden
- Inline queries are cleared so the copy references the original's queries
- Use `element_descriptions` to customize copied element descriptions for different data contexts

---

## move_slide

Move a slide to a new position within the master.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master containing the slide. |
| `slide_name` | string | **Yes** | The slide to move. |
| `position` | integer | **Yes** | New 1-indexed position. Other slides renumber automatically. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `slide_id` | integer | Database ID of the slide |
| `slide_name` | string | Name of the slide |
| `old_position` | integer | Previous position |
| `new_position` | integer | New position |

---

## delete_slide

Delete a slide from the master (soft-delete).

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_id` | integer | **Yes** | The master containing the slide. |
| `slide_name` | string | **Yes** | The slide to delete. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `slide_id` | integer | Database ID of the deleted slide |
| `slide_name` | string | Name of the deleted slide |
| `position` | integer | Position the slide was at |
| `message` | string | Confirmation message |

### Notes

- This is a soft-delete; the slide can potentially be restored
- Subsequent slides are renumbered to fill the gap
