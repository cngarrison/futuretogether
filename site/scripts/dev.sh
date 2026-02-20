#!/usr/bin/env bash
# Dev server launcher.
# Sources .env.local for secrets (never loaded in production).
# Sets dev-only constants inline so they don't need to be in .env.local.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Load secrets from .env.local
if [ -f .env.local ]; then
  set -a
  # shellcheck source=../.env.local
  source .env.local
  set +a
else
  echo "Warning: .env.local not found — Resend and other secrets will be unset" >&2
fi

# Dev-only constants (safe to hard-code; Cloudflare Turnstile always-pass test keys)
export FT_TURNSTILE_SITE_KEY="${FT_TURNSTILE_SITE_KEY:-1x00000000000000000000AA}"
export FT_TURNSTILE_SECRET_KEY="${FT_TURNSTILE_SECRET_KEY:-1x0000000000000000000000000000000AA}"

# # Staff password hash from its own file (keeps it out of .env.local)
# if [ -f .staff-pass-hash ]; then
#   export FT_STAFF_PASSWORD_HASH="$(cat .staff-pass-hash)"
# fi

exec deno task _vite
