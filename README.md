# Motley Agent Skills

Skills that make your AI agent a reliable data analyst on the [Motley](https://motley.ai) platform.

| Skill | What it does |
|-------|--------------|
| `create-report` | Create a data-driven document with text, tables, and charts from your data. |
| `semantic-layer-bootstrap` | Set up, curate, and verify the semantic layer for your data source. |
| `frontend-slides` | Create branded, self-contained HTML presentations. Zero dependencies. |

## Before you start

1. Create a [Motley](https://motley.ai) account. A free demo data source is included.
2. Connect your agent to the Motley MCP server (see below). Only `frontend-slides` works without it.

## Install

### Claude Code

Run:

```
/plugin marketplace add MotleyAI/motley-skills
/plugin install motley@motley-plugins
```

The plugin includes the Motley MCP server. Run `/mcp`, select **motley**, and sign in.

### Claude Cowork

1. Open **Customize → Personal plugins**.
2. Add the marketplace `MotleyAI/motley-skills`. Enable auto updates.
3. Install the **Motley** plugin.
4. Authenticate the Motley connector in the browser.

### Codex, Cursor, and other agents

Install the skills with [skills.sh](https://skills.sh):

```
npx skills add MotleyAI/motley-skills
```

The installer detects your agent and puts the skills in the correct location.

Then connect the Motley MCP server. The endpoint is `https://app.motley.ai/api/v1/mcp` (HTTP with OAuth).

**Codex** — add to `~/.codex/config.toml`:

```toml
[mcp_servers.motley]
url = "https://app.motley.ai/api/v1/mcp"
```

**Cursor** — add to `~/.cursor/mcp.json`:

```json
{ "mcpServers": { "motley": { "url": "https://app.motley.ai/api/v1/mcp" } } }
```

## Use

- Say "create a report on ..." or invoke `create-report` to build your first document.
- On a fresh data source, invoke `semantic-layer-bootstrap` first to set up and verify the layer.
- Say "make slides" or invoke `frontend-slides` to build a branded presentation.

## What is Motley?

Motley is a data storytelling platform. Its core is a semantic layer: an inventory of your data with metric definitions and business context. Your agent writes metrics to the layer instead of doing stateless text-to-SQL, so results are reusable and traceable. On top of the layer, the document engine lets agents build living documents from text, queries, charts, and tables.

If you look for an open-source semantic layer, see [SLayer](https://github.com/MotleyAI/slayer).
