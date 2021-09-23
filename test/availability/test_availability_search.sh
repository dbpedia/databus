#!/bin/bash

get_return_code() {
  echo $(curl -Li $1 -o /dev/null -w '%{http_code}\n' -s)
}

# Check website availability
code=$(get_return_code https://databus.dbpedia.org/system/api/search)
assert_eq "$code" "200" "Search not reachable"

# Check search index for content (simple)
result=$(curl https://databus.dbpedia.org/system/api/search?query=data -s)
assert_not_eq "$result" "{\"docs\":[]}" "Nothing found for query 'data'"

# Check search index for content (filtered)
result=$(curl -s https://databus.dbpedia.org/system/api/search?typeName=Artifact%26query=data)
assert_not_eq "$result" "{\"docs\":[]}" "Nothing found for query 'data'"

# Check search index for content (filtered, no query)
result=$(curl -s https://databus.dbpedia.org/system/api/search?typeName=Artifact%26minRelevance=1%26query=)
assert_eq "$result" "{\"docs\":[]}" "Empty query search should be empty for typeName=Artifact"
