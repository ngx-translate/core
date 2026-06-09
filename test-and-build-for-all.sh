#!/bin/bash

set -e

run_test() {
  local node_version=$1
  local config_dir=$2

  echo "=== Testing $config_dir with Node $node_version ==="

  source "$NVM_DIR/nvm.sh"
  nvm use "$node_version"
  corepack enable && corepack prepare pnpm@latest --activate

  cp "$config_dir/package.json" package.json
  cp "$config_dir/angular.json" angular.json
  rm pnpm-lock.yaml || true
  rm package-lock.json || true
  rm -rf node_modules || true
  pnpm install
  pnpm run build-all
  pnpm run test-ci

  # Lint is best-effort: build-all + test-ci above are the fatal correctness gate,
  # but lint differences across angular-eslint majors must not abort the matrix.
  # Only the configs that actually carry a lint target (a20/a21/latest) are linted;
  # a18/a19 have no lint target, so "ng lint" there is a missing-config error, not
  # rule drift — report that as SKIPPED rather than a misleading failure.
  if grep -q '"lint"' angular.json; then
    if pnpm run lint; then
      echo "=== LINT OK: $config_dir ==="
    else
      echo "=== LINT FAILED (best-effort, non-fatal): $config_dir ===" >&2
    fi
  else
    echo "=== LINT SKIPPED (no lint target in $config_dir) ===" >&2
  fi
}

# Restore the latest (Angular 22) config on EVERY exit path, not just the happy
# path: with `set -e`, a failed install/build/test in any matrix version would
# otherwise abort with root package.json/angular.json/node_modules left swapped
# to the failing compat config (e.g. a18 + Node 18).
restore_latest() {
  echo "=== Restoring latest config ==="
  source "$NVM_DIR/nvm.sh"
  nvm use 22
  cp compat/latest/package.json package.json
  cp compat/latest/angular.json angular.json
  rm -f package-lock.json
  rm -rf node_modules || true
  pnpm install
}
trap restore_latest EXIT

if [ -n "$1" ]; then
  case "$1" in
    18) run_test 18 compat/a18 ;;
    19) run_test 18 compat/a19 ;;
    20) run_test 20 compat/a20 ;;
    21) run_test 22 compat/a21 ;;
    22|latest) run_test 22 compat/latest ;;
    *) echo "Unknown version: $1. Use 18-22 or latest."; exit 1 ;;
  esac
else
  run_test 18 compat/a18
  run_test 18 compat/a19
  run_test 20 compat/a20
  run_test 22 compat/a21
  run_test 22 compat/latest
fi
