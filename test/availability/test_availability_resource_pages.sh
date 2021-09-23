#!/bin/bash

get_return_code() {
  echo $(curl -Li -j -b tmp_cookie $1 -o /dev/null -w '%{http_code}\n' -s)
}

# Check website availability
code=$(get_return_code https://databus.dbpedia.org/)
assert_eq "$code" "200" "Website not reachable"

# Check imprint availability
code=$(get_return_code https://databus.dbpedia.org/imprint/)
assert_eq "$code" "200" "Imprint not reachable"

# Check user page availability with user 'dbpedia'
code=$(get_return_code https://databus.dbpedia.org/dbpedia/)
assert_eq "$code" "200" "User page not reachable"

# Check user system pages
code=$(get_return_code https://databus.dbpedia.org/dbpedia/collections/)
assert_eq "$code" "200" "User collections tab not reachable"

code=$(get_return_code https://databus.dbpedia.org/dbpedia/services/)
assert_eq "$code" "200" "User services tab not reachable"

code=$(get_return_code https://databus.dbpedia.org/dbpedia/apps/)
assert_eq "$code" "200" "User applications tab not reachable"

# Check group page availability with user 'dbpedia/databus'
code=$(get_return_code https://databus.dbpedia.org/dbpedia/databus/)
assert_eq "$code" "200" "Group page not reachable"

# Check artifact page availability with user 'dbpedia/databus/databus-data'
code=$(get_return_code https://databus.dbpedia.org/dbpedia/databus/databus-data/)
assert_eq "$code" "200" "Group page not reachable"
