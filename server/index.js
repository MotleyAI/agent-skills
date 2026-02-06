#!/usr/bin/env node
/**
 * Motley MCP Passthrough Server
 *
 * This server acts as a local stdio MCP server that forwards all requests
 * to a remote Motley HTTP endpoint using JSON-RPC 2.0 protocol.
 *
 * Environment variables:
 * - MOTLEY_API_URL: The remote Motley MCP endpoint URL
 * - MOTLEY_API_KEY: The API key for Bearer token authentication
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_URL = process.env.MOTLEY_API_URL;
const API_KEY = process.env.MOTLEY_API_KEY;

// Validate required environment variables
if (!API_URL) {
  console.error("Error: MOTLEY_API_URL environment variable is required");
  process.exit(1);
}

if (!API_KEY) {
  console.error("Error: MOTLEY_API_KEY environment variable is required");
  process.exit(1);
}

// Log to stderr for debugging (stdout is reserved for MCP protocol)
function log(...args) {
  console.error("[motley-mcp]", ...args);
}

/**
 * Forward a JSON-RPC 2.0 request to the remote Motley server
 */
async function forwardRequest(method, params = {}) {
  const requestId = crypto.randomUUID();
  const body = JSON.stringify({
    jsonrpc: "2.0",
    method,
    params,
    id: requestId,
  });

  log(`Forwarding request: ${method}`, JSON.stringify(params).slice(0, 200));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

    log(`Response received for ${method}:`, JSON.stringify(data.result).slice(0, 200));
    return data.result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after 30 seconds for method: ${method}`);
    }
    throw error;
  }
}

/**
 * Create and configure the MCP server
 */
function createServer() {
  const server = new Server(
    {
      name: "motley",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle tools/list - forward to remote and return tool definitions
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    try {
      const result = await forwardRequest("tools/list", {});
      return result;
    } catch (error) {
      log("Error listing tools:", error.message);
      // Return empty tools list on error rather than failing completely
      return { tools: [] };
    }
  });

  // Handle tools/call - forward tool invocation to remote
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const result = await forwardRequest("tools/call", {
        name: request.params.name,
        arguments: request.params.arguments || {},
      });
      return result;
    } catch (error) {
      log("Error calling tool:", error.message);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Main entry point
 */
async function main() {
  log("Starting Motley MCP passthrough server");
  log("Remote endpoint:", API_URL);
  log("API key configured:", API_KEY ? "Yes (redacted)" : "No");

  const server = createServer();
  const transport = new StdioServerTransport();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    log("Shutting down...");
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    log("Shutting down...");
    await server.close();
    process.exit(0);
  });

  // Connect and run
  await server.connect(transport);
  log("Server connected and ready");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
