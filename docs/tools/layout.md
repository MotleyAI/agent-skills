# Layout Tools

Tools for working with layout libraries and creating masters from templates.

[Back to Tools Overview](../tools.md)

---

## list_layout_libraries

List all layout libraries accessible to the current user.

### Arguments

*No arguments required.*

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `layout_libraries` | array | List of available layout libraries |
| `count` | integer | Total number of libraries |

Each library in the array contains:
- `id` - Library identifier (use this with other tools)
- `title` - Library title
- `slide_count` - Number of layouts/slides in the library
- `created_at` - ISO 8601 timestamp

---

## list_masters

List all master decks owned by the current user.

### Arguments

*No arguments required.*

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `masters` | array | List of master decks |
| `count` | integer | Total number of masters |

Each master in the array contains:
- `id` - Master identifier (use this with master tools)
- `deck_id` - Associated deck identifier
- `title` - Master title
- `slide_count` - Number of slides in the master
- `created_at` - ISO 8601 timestamp

---

## inspect_layout_library

Get detailed structure of a layout library including all layouts, their elements, names, types, and content.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `layout_library_id` | integer | **Yes** | The ID of the layout library (obtain from `list_layout_libraries`). |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Library identifier |
| `title` | string | Library title |
| `layouts` | array | List of layouts with full details |

Each layout in the array contains:
- `id` - Slide/layout database ID
- `position` - Position in the library
- `name` - Layout name (use this when copying or referencing)
- `description` - Layout description
- `elements` - Array of elements in the layout

Each element contains:
- `name` - Element name (use this when targeting specific blocks)
- `description` - Element description
- `type` - Element type (e.g., "text", "chart", "table")
- `content` - Current content (if applicable)

---

## get_thumbnails

Get thumbnail URLs for specific slides in a master or layout library.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `master_props_id` | integer | **Yes** | ID of a master or layout library. |
| `layout_names` | array[string] | **Yes** | Specific layout/slide names to get thumbnails for. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `master_props_id` | integer | The requested master/library ID |
| `thumbnails` | array | List of thumbnail info objects |
| `not_found` | array | Layout names that were not found |

Each thumbnail object contains:
- `layout_name` - The requested layout name
- `slide_id` - Database ID of the slide
- `thumbnail_url` - Signed URL for the thumbnail image (or `null` if unavailable)

### Notes

- For GCS storage: Returns signed URLs that can be fetched directly
- For local storage: Returns URLs to the standard thumbnail endpoint
- URLs are cached and refreshed automatically

---

## create_master

Create a new master from a template library.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `layout_library_id` | integer | **Yes** | The template library to clone into a new master. |
| `name` | string | No | Name for the new master. Defaults to "{library title} Master" if not provided. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `master_id` | integer | The new master's identifier |
| `deck_id` | integer | The underlying deck's identifier |
| `name` | string | The master's name |
| `slide_count` | integer | Number of slides cloned |
| `created_at` | string | ISO 8601 timestamp |

### Notes

- All slides in the new master are set to hidden by default
- The master inherits the library's slide structure and content
- Default sample parameters are initialized for the master
