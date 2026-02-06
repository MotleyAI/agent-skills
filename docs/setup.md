# Installation & Setup Guide

## Prerequisites

- **Node.js 18+** (for Desktop Extension packaging)
- **Motley API Key** (starts with `sk_`)
- **Claude Code** or **Claude Desktop** installed

---

## Option 1: Skills Only (via skills.sh)

Install just the skills without the MCP server integration:

```bash
# Install all skills to Claude Code
npx skills add MotleyAI/agent-skills -a claude-code

# List available skills
npx skills add MotleyAI/agent-skills --list

# Install specific skills
npx skills add MotleyAI/agent-skills \
  --skill create-query \
  --skill create-edit-chart \
  -a claude-code
```

Skills are installed to `~/.claude/skills/` and become available immediately.

---

## Option 2: Claude Desktop Extension (.mcpb)

### From Releases

1. Download the latest `.mcpb` file from [Releases](https://github.com/MotleyAI/agent-skills/releases)
2. Drag the file into Claude Desktop Settings, or double-click to install
3. When prompted, enter:
   - **API URL:** `https://stable.motley.ai:5173/api/v1/mcp/` (default)
   - **API Key:** Your Motley API key (sk_...)

### Build from Source

```bash
git clone https://github.com/MotleyAI/agent-skills.git
cd agent-skills
./scripts/package-mcpb.sh
# Outputs: motley-0.1.0.mcpb (or similar)
```

---

## Option 3: Claude Code Plugin

### Quick Start

```bash
# Set your API key
export MOTLEY_API_KEY="sk_your_key_here"

# Run Claude Code with the plugin
claude --plugin-dir /path/to/agent-skills
```

### Install from Marketplace (when available)

```bash
/plugin install MotleyAI/agent-skills
```

### Build Plugin Package

```bash
./scripts/package-plugin.sh
# Outputs: motley-plugin-0.1.0.zip
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MOTLEY_API_KEY` | Your Motley API key (sk_...) | Yes |
| `MOTLEY_API_URL` | API endpoint (default: https://stable.motley.ai:5173/api/v1/mcp/) | No |

---

## Verifying Installation

### Check skills are loaded
```
/motley:create-query --help
```

### Check MCP server status
```
/mcp
```

---

## Troubleshooting

### "Connection refused" errors
- Verify `MOTLEY_API_KEY` is set correctly
- Check network connectivity to stable.motley.ai

### Skills not appearing
- Run `npx skills add MotleyAI/agent-skills --list` to verify
- Check `~/.claude/skills/` directory

### Desktop Extension not loading
- Ensure Node.js 18+ is installed
- Check Claude Desktop logs for errors

### Viewing logs

The passthrough server logs to stderr for debugging. In Claude Desktop, you can view logs in the developer console or by running the server manually:

```bash
MOTLEY_API_URL="..." MOTLEY_API_KEY="..." node server/index.js
```

---

## Security Considerations

- **API keys** are sensitive - never commit them to source control
- Use environment variables or secure secret storage
- The passthrough server only forwards requests to the configured endpoint
- All communication with the remote server uses HTTPS

---

## Getting an API Key

Contact your Motley administrator to obtain an API key. Keys typically:
- Start with `sk_` prefix
- Have associated permissions for specific operations
- May be scoped to specific data sources or presentations

---

## Next Steps

- Read the [Skills Reference](skills.md) to understand available capabilities
- Review the [README](README.md) for an overview of features
- Explore the skill documentation in the `skills/` directory
