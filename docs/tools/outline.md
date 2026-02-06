# Outline Tools

Tools for managing deck outline sessions - the planning stage before creating slides.

[Back to Tools Overview](../tools.md)

---

## create_outline

Create a new deck outline session for planning a presentation.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | No | Title for the outline. Defaults to "New Deck Outline" if not provided. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `session_id` | integer | The unique identifier for the new session |
| `title` | string | The title of the created outline |
| `created_at` | string | ISO 8601 timestamp of creation |

---

## get_outline

Get the complete state of a deck outline session including all slide cards.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | integer | **Yes** | The unique identifier of the deck outline session to retrieve. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Session identifier |
| `title` | string | Session title |
| `cards` | array | List of slide cards in position order |
| `card_count` | integer | Total number of active cards |

Each card in the `cards` array contains:
- `id` - Card identifier
- `title` - Card title
- `content` - Card content/description
- `position` - 0-indexed position in the outline
- `cube_names` - Associated datasource names

---

## clear_outline

Remove all slide cards from a deck outline session while keeping the session itself.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | integer | **Yes** | The session to clear. Cards are soft-deleted; the session itself remains. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `session_id` | integer | The session that was cleared |
| `deleted_card_count` | integer | Number of cards that were deleted |

---

## delete_outline

Completely delete a deck outline session and all its cards.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | integer | **Yes** | The session to delete entirely. Soft-deletes both session and all cards. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `deleted_session` | object | Info about the deleted session (`id`, `title`) |
| `deleted_card_count` | integer | Number of cards that were deleted |

---

## add_outline_card

Add a new slide card to a deck outline session.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | integer | **Yes** | The outline session to add the card to. |
| `title` | string | No | Card title. Auto-generated (e.g., "Card_1", "Card_2") if not provided. Must be unique within the session. |
| `content` | string | No | Descriptive content/context for what this slide should contain. |
| `position` | integer | No | 0-indexed position to insert at. Appends to end if not provided. |
| `cube_names` | array[string] | No | Data sources relevant to this slide. Names are validated against available cubes. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `card` | object | The created card with `id`, `title`, `content`, `position`, `cube_names` |

### Notes

- If `title` is provided, it must be unique within the session
- If `cube_names` is provided, all names are validated against the user's available cubes

---

## edit_outline_card

Edit a slide card's title, content, and/or datasource associations.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | integer | **Yes** | The outline session containing the card. |
| `card_id` | integer | **Yes** | The specific card to edit. |
| `title` | string | No | New title. Must be unique within the session if changed. |
| `content` | string | No | New content/description for the card. |
| `cube_names` | array[string] | No | Updated datasource associations. Replaces existing associations. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `card` | object | The updated card with `id`, `title`, `content`, `position`, `cube_names` |

### Notes

- Only provided fields are updated; omitted fields remain unchanged
- Title uniqueness is checked if a new title is provided

---

## move_outline_card

Move a slide card to a new position within the deck outline.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | integer | **Yes** | The outline session. |
| `card_id` | integer | **Yes** | The card to move. |
| `position` | integer | **Yes** | New 0-indexed position. Other cards shift automatically to accommodate. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `card` | object | Card info with `id`, `title`, `old_position`, `new_position` |

---

## delete_outline_card

Delete a slide card from a deck outline session.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | integer | **Yes** | The outline session. |
| `card_id` | integer | **Yes** | The card to delete (soft-delete). |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `deleted_card` | object | Info about the deleted card (`id`, `title`, `position`) |
