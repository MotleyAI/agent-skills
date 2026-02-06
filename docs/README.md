# Motley MCP Bundle

An MCP (Model Context Protocol) bundle that connects Claude to the Motley data storytelling platform, enabling AI-powered data visualization and report generation.

## Overview

This bundle provides a passthrough MCP server that forwards requests to a remote Motley backend. It allows Claude (via Claude Desktop or other MCP clients) to:

- Query data from your semantic layer
- Create and modify chart templates
- Generate text and table content blocks
- Build complete data-driven presentations

## Features

- **Semantic Layer Queries**: Access your data through a unified semantic layer with measures, dimensions, and filters
- **Chart Generation**: Create bar charts, line charts, pie charts, and funnels with customizable styling
- **Text Templates**: Generate data-driven text with variable substitution and optional LLM enhancement
- **Table Blocks**: Create formatted tables with pivoting and flexible layouts
- **Time Intelligence**: Built-in support for time filters, period comparisons, and date range calculations

## Quick Start

1. **Install the bundle** in Claude Desktop or your MCP client

2. **Configure** with your Motley API credentials:
   - `api_url`: Your Motley MCP endpoint (e.g., `https://your-instance.com/api/v1/mcp/`)
   - `api_key`: Your API key (starts with `sk_`)

3. **Start using** the Motley tools through Claude

See [setup.md](setup.md) for detailed installation instructions.

## Available Tools

The Motley MCP server provides 32 tools organized into five categories:

| Category | Tools | Description |
|----------|-------|-------------|
| **Outline** | 8 | Deck planning and outline sessions |
| **Layout** | 5 | Layout libraries and template management |
| **Datasource** | 6 | Data modeling and schema management |
| **Master** | 9 | Operations on master decks and slides |
| **Element** | 4 | Content blocks (text, table, chart, query) |

### Outline Tools

| Tool | Description |
|------|-------------|
| `create_outline` | Create a new deck outline session |
| `get_outline` | Get outline state with all cards |
| `clear_outline` | Remove all cards from outline |
| `delete_outline` | Delete outline session |
| `add_outline_card` | Add a slide card to outline |
| `edit_outline_card` | Edit card title/content |
| `move_outline_card` | Reposition a card |
| `delete_outline_card` | Remove a card |

### Layout Tools

| Tool | Description |
|------|-------------|
| `list_layout_libraries` | List available layout libraries |
| `list_masters` | List all master decks |
| `inspect_layout_library` | Get layout structure details |
| `get_thumbnails` | Get slide thumbnail URLs |
| `create_master` | Create master from template |

### Datasource Tools

| Tool | Description |
|------|-------------|
| `datasources_summary` | List all datasources with schemas |
| `inspect_datasource` | Get datasource details with sample data |
| `create_datasource` | Create datasource from SQL query |
| `add_measures` | Add custom measures to datasource |
| `add_dimensions` | Add custom dimensions to datasource |
| `delete_measures_dimensions` | Remove measures/dimensions |

### Master Tools

| Tool | Description |
|------|-------------|
| `get_master_summary` | Get master outline with slides/blocks |
| `inspect_slide` | Get full slide content |
| `inspect_block` | Get specific block content |
| `get_master_variables` | Get all variables for a master |
| `resolve_master` | Trigger resolution of all blocks |
| `resolve_block` | Resolve a specific block |
| `copy_slide` | Copy slide with contents |
| `move_slide` | Move slide to new position |
| `delete_slide` | Delete a slide |

### Element Tools

| Tool | Description |
|------|-------------|
| `update_text_block` | Update text block template |
| `update_table_block` | Update table block template |
| `update_chart_block` | Update chart with LLM prompt |
| `update_query_block` | Create/update numerical query |

See [tools.md](tools.md) for complete tool documentation with parameters and return values.

## Skills Reference

This bundle includes skill documentation to help Claude understand the Motley domain model:

| Skill | Purpose |
|-------|---------|
| [create-query](../skills/create-query/SKILL.md) | Build semantic layer queries |
| [create-edit-chart](../skills/create-edit-chart/SKILL.md) | Chart templates and visualization |
| [create-edit-text-block](../skills/create-edit-text-block/SKILL.md) | Text content with expressions |
| [create-edit-table-block](../skills/create-edit-table-block/SKILL.md) | Table formatting and pivoting |
| [derived-dimensions](skills.md#derived-dimensions) | Advanced time-series calculations |

See [skills.md](skills.md) for the complete skills reference.

## Architecture

```
+------------------+     stdio      +-------------------+     HTTP/JSON-RPC     +------------------+
|  Claude Desktop  | <------------> |  Passthrough      | <------------------> |  Motley Backend  |
|  (MCP Client)    |                |  MCP Server       |    + Bearer Auth      |  (Remote)        |
+------------------+                +-------------------+                       +------------------+
```

The passthrough server:
- Accepts MCP protocol messages via stdio
- Forwards them as JSON-RPC 2.0 HTTP POST requests
- Adds Bearer token authentication
- Returns responses back through stdio

## Requirements

- Node.js 18.0.0 or later
- Access to a Motley backend instance
- Valid API key with appropriate permissions

## License

MIT
