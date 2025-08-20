#!/usr/bin/env bash
set -euo pipefail

cd packages/frontend
echo "Starting frontend (Vite)"
bunx vite --host
