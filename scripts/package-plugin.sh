#!/bin/bash
# Package as Claude Code plugin (creates zip)
set -e
cd "$(dirname "$0")/.."
PLUGIN_NAME="motley-plugin"
VERSION=$(jq -r '.version' .claude-plugin/plugin.json)
OUT="${PLUGIN_NAME}-${VERSION}.zip"
zip -r "$OUT" \
  .claude-plugin \
  .mcp.json \
  skills \
  LICENSE \
  README.md
echo "Created plugin package: $OUT"
