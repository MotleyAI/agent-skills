# Motley agent skills & MCP server

Skills for making your AI agent a reliable data analyst on top of your data via the [Motley](https://motley.ai) platform.

If you are looking for an open-source semantic layer, see [SLayer](https://github.com/MotleyAI/slayer).

## What is Motley?

[Motley](https://motley.ai) is a data storytelling platform that allows AI agents to create data-driven content, such as number-intensive reports, presentations, or notebooks.

At the core of Motley is a semantic layer – inventory of the data you want to use with your agents. It contains metric definitions, column descriptions and other business context that lets the agent understand your data. Instead of stateless text-to-SQL, the agent writes the metrics it needs to the semantic layer, allowing to reuse them and trace where the data comes from.

The second, complementary part is the document engine – the working surface where agents can create reusable artifacts pulling from the data. They can consist of text, data queries, charts, and tables, and are used on their own or as the basis for your data-driven content.

## Quickstart

To get started, you need a [Motley](https://motley.ai) account connected to a datasource. You can sign up for free and use the built-in demo datasource if you don't have one.

Once installed, invoke the `/create-report` skill to create your first data-driven document.

### Claude Code

Add the marketplace and install the plugin:

```
/plugin marketplace add MotleyAI/motley-skills
/plugin install motley@motley-plugins
```

Then run `/mcp`, select the **motley** server, and authenticate in your browser to connect your Motley account.

### Claude Cowork

1. Open the **Customize** tab and go to **Personal plugins**.
2. **Add marketplace** and enter `MotleyAI/motley-skills`.
3. Enable **auto updates** so you always get the latest skills.
4. **Install** the Motley plugin.
5. **Authenticate** the Motley connector — sign in to your Motley account in the browser when prompted.

If you are an organization admin, you can [install](https://support.claude.com/en/articles/13837433-manage-claude-cowork-plugins-for-your-organization) the plugin for everyone in your organization.

## Skills

This repo contains skills teaching your agent to work with documents and to manage the semantic layer.

Skills available:

| Skill | What it does |
|-------|--------------|
| `create-report` | End-to-end workflow for building a data-driven document from your data and requirements. This is the main entry point. |
| `explore-model` | Discover and inspect the models in your semantic layer — and create custom models or measures — before building a document. |
| `update-text-block` | Create or edit text blocks with template variables, data substitution, or LLM-generated copy. |
| `update-table-block` | Create or edit table blocks, with optional size constraints and query-, template-, or LLM-driven content. |
| `update-chart` | Create or edit charts (bar, line, pie, funnel) from a structured query and chart configuration. |
| `update-query-block` | Define the numerical queries that feed text and table blocks, referenced as `{query_name}` in their templates. |

Beyond the skills above, **frontend-slides** is a baseline skill for creating branded, self-contained HTML reports and presentations locked to your visual identity — zero dependencies, no build tooling required. On first use, invoke it to run the brand wizard and configure your brand styles; every presentation after that is automatically on-brand.

## MCP server

Motley MCP provides a comprehensive set of tools allowing to inspect the semantic layer, create and update data models, create and modify documents, manage and resolve masters (document templates).
