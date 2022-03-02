#!/bin/bash

get_return_code() {
  echo $(curl -Li -j -b tmp_cookie $1 -o /dev/null -w '%{http_code}\n' -s)
}

# Check website availability
code=$(get_return_code https://databus.dbpedia.org/app/collection-editor/)
assert_eq "$code" "200" "Collection editor not reachable"

# Check imprint availability
code=$(get_return_code https://databus.dbpedia.org/api/search/)
assert_eq "$code" "200" "Search page not reachable"
