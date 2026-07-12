#!/usr/bin/env bash

set -euo pipefail

PROJECT_PATH="."
LOGIN_ONLY=false
SKIP_BLOB=false
SKIP_ENV=false
GENERATE_ADMIN_PASSWORD=false
ADMIN_PASSWORD_VALUE="${ADMIN_PASSWORD:-}"
BLOB_STORE_NAME=""
BLOB_REGION="iad1"

usage() {
  cat <<'USAGE'
Usage: setup-vercel-project.sh [--path <project-dir>] [--login-only] [--skip-blob] [--skip-env]
                               [--generate-admin-password] [--admin-password <value>]
                               [--blob-store-name <name>] [--blob-region <region>]

Prepare a Vercel project for WorkBuddy deployment.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --path)
      PROJECT_PATH="${2:-}"
      shift 2
      ;;
    --login-only)
      LOGIN_ONLY=true
      shift
      ;;
    --skip-blob)
      SKIP_BLOB=true
      shift
      ;;
    --skip-env)
      SKIP_ENV=true
      shift
      ;;
    --generate-admin-password)
      GENERATE_ADMIN_PASSWORD=true
      shift
      ;;
    --admin-password)
      ADMIN_PASSWORD_VALUE="${2:-}"
      shift 2
      ;;
    --blob-store-name)
      BLOB_STORE_NAME="${2:-}"
      shift 2
      ;;
    --blob-region)
      BLOB_REGION="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Error: Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ ! -d "$PROJECT_PATH" ]]; then
  echo "Error: Project path does not exist: $PROJECT_PATH" >&2
  exit 1
fi

cd "$PROJECT_PATH"

open_url() {
  local url="$1"
  if command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  elif command -v start >/dev/null 2>&1; then
    start "$url" >/dev/null 2>&1 || true
  fi
}

json_value() {
  local key="$1"
  local file="$2"

  node -e '
const fs = require("fs");
const key = process.argv[1];
const file = process.argv[2];
try {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (data && typeof data[key] === "string") process.stdout.write(data[key]);
} catch {}
' "$key" "$file"
}

ensure_vercel() {
  if ! command -v vercel >/dev/null 2>&1; then
    echo "Vercel CLI not found. Installing..." >&2
    npm install -g vercel
  fi
}

load_env_var() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    return 0
  fi

  if [[ -f ".env" ]]; then
    local line
    line="$(grep -E "^${name}=" .env 2>/dev/null | tail -n 1 || true)"
    if [[ -n "$line" ]]; then
      export "$name=${line#*=}"
      return 0
    fi
  fi

  return 1
}

ensure_auth() {
  load_env_var VERCEL_TOKEN || true

  if [[ -n "${VERCEL_TOKEN:-}" ]]; then
    return 0
  fi

  if vercel whoami >/dev/null 2>&1; then
    return 0
  fi

  echo "Opening Vercel login and token pages..." >&2
  open_url "https://vercel.com/login"
  open_url "https://vercel.com/account/tokens"
  echo "Starting Vercel CLI login. Complete the browser step, then return here." >&2
  vercel login
}

ensure_linked_project() {
  if [[ -f ".vercel/project.json" || -f ".vercel/repo.json" ]]; then
    return 0
  fi

  echo "Project is not linked to Vercel. Starting vercel link..." >&2
  vercel link -y
}

project_name() {
  if [[ -f ".vercel/project.json" ]]; then
    local name
    name="$(json_value projectName .vercel/project.json)"
    if [[ -n "$name" ]]; then
      printf '%s' "$name"
      return 0
    fi
  fi

  node -e '
try {
  const pkg = require("./package.json");
  process.stdout.write(pkg.name || "workbuddy-project");
} catch {
  process.stdout.write("workbuddy-project");
}
'
}

set_env_value() {
  local name="$1"
  local value="$2"
  local env_name="$3"
  local tmp

  tmp="$(mktemp)"
  printf '%s' "$value" > "$tmp"
  if ! vercel env add "$name" "$env_name" < "$tmp"; then
    vercel env update "$name" "$env_name" < "$tmp"
  fi
  rm -f "$tmp"
}

ensure_admin_password() {
  if [[ "$SKIP_ENV" == true ]]; then
    return 0
  fi

  if [[ "$GENERATE_ADMIN_PASSWORD" == true && -z "$ADMIN_PASSWORD_VALUE" ]]; then
    ADMIN_PASSWORD_VALUE="$(openssl rand -base64 24 | tr -d '\n')"
    echo "Generated ADMIN_PASSWORD. Save this value for /admin login:" >&2
    echo "$ADMIN_PASSWORD_VALUE"
  fi

  if [[ -z "$ADMIN_PASSWORD_VALUE" ]]; then
    echo "ADMIN_PASSWORD was not provided. Skipping ADMIN_PASSWORD env setup." >&2
    return 0
  fi

  for env_name in production preview development; do
    echo "Setting ADMIN_PASSWORD for $env_name..." >&2
    set_env_value ADMIN_PASSWORD "$ADMIN_PASSWORD_VALUE" "$env_name"
  done
}

ensure_blob_store() {
  if [[ "$SKIP_BLOB" == true ]]; then
    return 0
  fi

  if ! vercel blob list-stores >/tmp/vercel-blob-stores.$$ 2>/tmp/vercel-blob-stores.err.$$; then
    cat /tmp/vercel-blob-stores.err.$$ >&2 || true
    rm -f /tmp/vercel-blob-stores.$$ /tmp/vercel-blob-stores.err.$$
    echo "Could not list Blob stores. Open the project Storage page if CLI Blob setup is unavailable." >&2
    open_url "https://vercel.com/dashboard"
    return 0
  fi

  if [[ -z "$BLOB_STORE_NAME" ]]; then
    BLOB_STORE_NAME="$(project_name)-blob"
  fi

  if grep -q "$BLOB_STORE_NAME" /tmp/vercel-blob-stores.$$; then
    echo "Blob store already exists or is connected: $BLOB_STORE_NAME" >&2
  else
    echo "Creating Vercel Blob store: $BLOB_STORE_NAME" >&2
    vercel blob create-store "$BLOB_STORE_NAME" --access public --region "$BLOB_REGION"
  fi

  rm -f /tmp/vercel-blob-stores.$$ /tmp/vercel-blob-stores.err.$$

  echo "Pulling Vercel env vars into .env.local..." >&2
  vercel env pull .env.local || true
}

ensure_vercel
ensure_auth

if [[ "$LOGIN_ONLY" == true ]]; then
  echo "Vercel authentication is ready." >&2
  exit 0
fi

ensure_linked_project
ensure_blob_store
ensure_admin_password

echo "Vercel project setup is complete." >&2
