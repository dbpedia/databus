#!/bin/bash
# Smoke test for a deployed Databus: UI, API and download counting.
#
# Usage: ./smoke-test.sh <databus-url> <test-file-uri> [wait-seconds]
#   e.g. ./smoke-test.sh https://databus.dev.dbpedia.link https://databus.dev.dbpedia.link/acc/group/art/1.0/test.ttl
#
# <test-file-uri> should be a designated test file: every run adds one download to it.
# [wait-seconds] must be larger than METRICS_FLUSH_INTERVAL of the server (default 60).

DATABUS_URL=${1%/}
FILE_URI=$2
WAIT=${3:-60}

if [ -z "$DATABUS_URL" ] || [ -z "$FILE_URI" ]; then
  echo "Usage: $0 <databus-url> <test-file-uri> [wait-seconds]"
  exit 2
fi

FAILED=0
check() { if [ "$2" = "$3" ]; then echo "[OK]   $1"; else echo "[FAIL] $1 (expected $3, got $2)"; FAILED=1; fi; }

get_count() {
  curl -s -m 20 -H "Accept: text/csv" --data-urlencode "query=SELECT (COALESCE(MAX(?c), 0) AS ?count) WHERE { OPTIONAL { <$FILE_URI> <https://dataid.dbpedia.org/databus#downloadCount> ?c } }" \
    "$DATABUS_URL/sparql" | tail -n 1 | tr -d '"\r'
}

check "Web UI is accessible" "$(curl -s -m 20 -o /dev/null -w '%{http_code}' -H 'Accept: text/html' "$DATABUS_URL/")" 200
check "SPARQL API is responding" "$(curl -s -m 20 -o /dev/null -w '%{http_code}' --data-urlencode 'query=ASK {}' "$DATABUS_URL/sparql")" 200

BEFORE=$(get_count)
if ! [[ "$BEFORE" =~ ^[0-9]+$ ]]; then
  check "Download count of test file is readable" "$BEFORE" "a number"
  exit 1
fi
echo "[OK]   Download count of test file is readable ($BEFORE)"

check "Test file redirects to its download URL" "$(curl -s -m 20 -o /dev/null -w '%{http_code}' "$FILE_URI")" 307

AFTER=$BEFORE
for ((i = 0; i < WAIT; i += 5)); do
  sleep 5
  AFTER=$(get_count)
  [ "$AFTER" -gt "$BEFORE" ] 2>/dev/null && break
done

if [ "$AFTER" -gt "$BEFORE" ] 2>/dev/null; then
  echo "[OK]   Download was counted ($BEFORE -> $AFTER)"
else
  echo "[FAIL] Download was not counted within ${WAIT}s (count still $AFTER)"
  FAILED=1
fi

exit $FAILED
