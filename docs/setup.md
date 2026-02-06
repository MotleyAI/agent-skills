# Setup Guide

This guide covers installation and configuration of the Motley MCP bundle.

## Prerequisites

- **Node.js 18+**: Required for the passthrough server
- **Motley Backend Access**: A running Motley instance with MCP enabled
- **API Key**: An API key for authentication (starts with `sk_`)

## Installation

1. Clone or download this bundle:
   ```bash
   git clone <repository-url> motley
   cd motley
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Claude Desktop (see below)

## Configuration

### Required Settings

| Setting | Description | Example |
|---------|-------------|---------|
| `api_url` | Motley MCP endpoint URL | `https://your-instance.com/api/v1/mcp/` |
| `api_key` | API authentication key | `sk_live_abc123...` |

### Claude Desktop Configuration

Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "motley": {
      "command": "node",
      "args": ["/path/to/motley/server/index.js"],
      "env": {
        "MOTLEY_API_URL": "https://your-instance.com/api/v1/mcp/",
        "MOTLEY_API_KEY": "sk_your_api_key_here"
      }
    }
  }
}
```

### Environment Variables

The passthrough server reads these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `MOTLEY_API_URL` | Yes | Full URL to the Motley MCP endpoint |
| `MOTLEY_API_KEY` | Yes | API key for Bearer token auth |

## Verifying Installation

1. **Start Claude Desktop** and open a new conversation

2. **Check available tools** by asking Claude:
   ```
   What Motley tools are available?
   ```

3. **Test connectivity** with a simple operation:
   ```
   Use the Motley datasources_summary tool to list available data sources.
   ```

## Troubleshooting

### Server won't start

- Verify Node.js 18+ is installed: `node --version`
- Check that dependencies are installed: `npm install`
- Ensure environment variables are set correctly

### Authentication errors

- Verify your API key is correct and starts with `sk_`
- Check the API URL ends with `/api/v1/mcp/`
- Ensure your API key has the necessary permissions

### Connection timeouts

- Check network connectivity to your Motley instance
- Verify the Motley backend is running and accessible
- Default timeout is 30 seconds per request

### Viewing logs

The passthrough server logs to stderr for debugging. In Claude Desktop, you can view logs in the developer console or by running the server manually:

```bash
MOTLEY_API_URL="..." MOTLEY_API_KEY="..." node server/index.js
```

## Security Considerations

- **API keys** are sensitive - never commit them to source control
- Use environment variables or secure secret storage
- The passthrough server only forwards requests to the configured endpoint
- All communication with the remote server uses HTTPS

## Getting an API Key

Contact your Motley administrator to obtain an API key. Keys typically:
- Start with `sk_` prefix
- Have associated permissions for specific operations
- May be scoped to specific data sources or presentations

## Next Steps

- Read the [Skills Reference](skills.md) to understand available capabilities
- Review the [README](README.md) for an overview of features
- Explore the skill documentation in the `skills/` directory
