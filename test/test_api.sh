#!/bin/bash
source ./assert.sh

get_return_code() {
  echo $(curl -Li -X $1 -j $2 -o /dev/null -w '%{http_code}\n' -s)
}

# Check website availability
code=$(get_return_code PUT http://localhost:3000/testos/teron/)
assert_eq "$code" "403" "Website not reachable"


TOKEN=$(curl -X POST -H 'content-type: application/x-www-form-urlencoded' -d grant_type=password -d username=tester_one -d password=tester1_password -d 'client_id=K5PCEOr7OJGBGU9xN7SvBrX1RWDs4S4n' https://kilt.eu.auth0.com/oauth/token | cut -d'"' -f 4)
