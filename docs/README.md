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

The remote Motley server provides tools for:

| Category | Tools | Description |
|----------|-------|-------------|
| **Presentation** | `get_master_summary`, `get_master_variables` | Inspect presentation structure |
| **Slides** | `inspect_slide`, `get_thumbnails` | View and navigate slides |
| **Content** | `update_text_block`, `update_table_block` | Edit text and table content |
| **Charts** | `update_chart_block` | Create/modify data visualizations |
| **Queries** | `update_query_block` | Configure data queries |
| **Data** | `datasources_summary`, `datasource_details` | Explore available data sources |

## Skills Reference

This bundle includes skill documentation to help Claude understand the Motley domain model:

- [create-edit-chart](../skills/create-edit-chart/SKILL.md) - Chart templates and visualization
- [create-edit-text-block](../skills/create-edit-text-block/SKILL.md) - Text content with expressions
- [create-edit-table-block](../skills/create-edit-table-block/SKILL.md) - Table formatting
- [create-query](../skills/create-query/SKILL.md) - Semantic layer queries

See [skills.md](skills.md) for the complete skills reference.

## Architecture

```
┌─────────────────┐     stdio      ┌──────────────────┐     HTTP/JSON-RPC     ┌─────────────────┐
│  Claude Desktop │ ◄────────────► │  Passthrough     │ ◄──────────────────► │  Motley Backend │
│  (MCP Client)   │                │  MCP Server      │    + Bearer Auth      │  (Remote)       │
└─────────────────┘                └──────────────────┘                       └─────────────────┘
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
