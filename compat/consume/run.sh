#!/bin/bash
# Artifact-consumability gate.
#
# Type-checks the PACKED v22/TS6-built .d.ts (the bits a consumer actually
# `npm install`s) against each older TypeScript with skipLibCheck:false. This is
# the typings-side contingency trigger that the compat matrix CANNOT detect: the
# matrix rebuilds the library from source under each toolchain, and
# core/tsconfig.json sets skipLibCheck:true, both of which mask .d.ts breaks.
#
# Prereq: build + pack first, so the tarballs exist:
#   pnpm run build-all
#   ( cd dist/ngx-translate && npm pack )
#   ( cd dist/http-loader  && npm pack )
#
# A TYPE-CHECK FAILED here = STOP/escalate (split-the-library decision, user's call).

set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"

CORE_TGZ="$(ls "$ROOT"/dist/ngx-translate/*.tgz 2>/dev/null | head -1)"
HTTP_TGZ="$(ls "$ROOT"/dist/http-loader/*.tgz 2>/dev/null | head -1)"

if [ -z "$CORE_TGZ" ] || [ -z "$HTTP_TGZ" ]; then
  echo "ERROR: packed tarballs not found under dist/. Build + npm pack first." >&2
  exit 2
fi
echo "core tarball: $CORE_TGZ"
echo "http tarball: $HTTP_TGZ"

# name : typescript range : angular major
MATRIX=(
  "a18:5.5:18"
  "a19:5.7:19"
  "a20:5.9:20"
  "a21:5.9:21"
)

fail=0
results=()
for entry in "${MATRIX[@]}"; do
  IFS=: read -r name tsver ng <<< "$entry"
  work="$HERE/.work/$name"
  echo ""
  echo "=== Consumer check: $name (TypeScript ~$tsver, Angular $ng) ==="
  rm -rf "$work"
  mkdir -p "$work"
  cp "$HERE/consume.ts" "$HERE/tsconfig.json" "$work/"
  (
    cd "$work" || exit 1
    npm init -y >/dev/null 2>&1
    npm install --no-save \
      "typescript@~$tsver" \
      "@angular/core@$ng" "@angular/common@$ng" "rxjs@7" \
      "$CORE_TGZ" "$HTTP_TGZ" >"/tmp/consume-$name-install.log" 2>&1
  )
  if [ $? -ne 0 ]; then
    echo "=== $name: INSTALL FAILED (see /tmp/consume-$name-install.log) ===" >&2
    results+=("$name: INSTALL-FAIL")
    fail=1
    continue
  fi
  if ( cd "$work" && npx --no-install tsc --noEmit -p tsconfig.json ); then
    echo "=== $name: TYPE-CHECK OK ==="
    results+=("$name: OK")
  else
    echo "=== $name: TYPE-CHECK FAILED — v22 .d.ts not consumable under TS ~$tsver ===" >&2
    results+=("$name: TYPECHECK-FAIL")
    fail=1
  fi
done

echo ""
echo "=== Artifact-consumability summary ==="
for r in "${results[@]}"; do echo "  $r"; done
[ "$fail" -eq 0 ] && echo "ALL CONSUMERS GREEN" || echo "ONE OR MORE CONSUMERS FAILED"
exit "$fail"
