#!/bin/bash
# Package as Claude Code plugin (creates zip)
set -e
cd "$(dirname "$0")/.."
PLUGIN_NAME="motley-plugin"
VERSION=$(jq -r '.version' package.json)
OUT="${PLUGIN_NAME}-${VERSION}.zip"
zip -r "$OUT" \
  .claude-plugin \
  .mcp.json \
  skills \
  LICENSE \
  README.md \
  -x "skills/_shared/*"
echo "Created plugin package: $OUT"
