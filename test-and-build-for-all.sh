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
}

if [ -n "$1" ]; then
  case "$1" in
    18) run_test 18 compat/a18 ;;
    19) run_test 18 compat/a19 ;;
    20) run_test 20 compat/a20 ;;
    21|latest) run_test 22 compat/latest ;;
    *) echo "Unknown version: $1. Use 18-21 or latest."; exit 1 ;;
  esac
else
  run_test 18 compat/a18
  run_test 18 compat/a19
  run_test 20 compat/a20
  run_test 22 compat/latest
fi

echo "=== Restoring latest config ==="
source "$NVM_DIR/nvm.sh"
nvm use 22
cp compat/latest/package.json package.json
cp compat/latest/angular.json angular.json
rm package-lock.json || true
rm -rf node_modules || true
pnpm install
