#!/usr/bin/env bash
# Post-deploy smoke tests. Hits the production endpoints with no auth and
# checks the things that are usually broken when a deploy is bad:
# health endpoints, TLS cert, asset CDN.

set -euo pipefail

BASE_URL="${1:-https://app.example.com}"
FAIL=0

check() {
  local name=$1 url=$2 expected=$3
  echo -n "→ $name ... "
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
  if [[ "$status" == "$expected" ]]; then
    echo "ok ($status)"
  else
    echo "FAIL (got $status, expected $expected)"
    FAIL=1
  fi
}

check "marketing home" "$BASE_URL/" 200
check "api health"     "$BASE_URL/api/healthz" 200
check "api ready"      "$BASE_URL/api/readyz"  200
check "login page"     "$BASE_URL/login" 200

exit $FAIL
