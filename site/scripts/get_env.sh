#!/usr/bin/env bash
# Usage: ./scripts/get_env.sh KEY_NAME
# Reads a single value from .env.local by key name.
# Example: RESEND_API_KEY=$(./scripts/get_env.sh FT_RESEND_API_KEY)

if [ -z "$1" ]; then
  echo "Usage: $0 KEY_NAME" >&2
  exit 1
fi

grep "^${1}=" .env.local | cut -d'=' -f2-
