#!/bin/bash

set -e

for package in package-a16 package-a17 package-a18 package-latest; do
  echo "Processing $package..."
  cp "$package.json" package.json
  rm package-lock.json || true
  rm -rf node_modules || true
  npm install
  npm run build-all
  npm run test-ci
done
