#!/bin/bash
# Package as Desktop Extension (.mcpb)
set -e
cd "$(dirname "$0")/.."
npm install
npx @anthropic-ai/mcpb pack
echo "Created Desktop Extension package"
