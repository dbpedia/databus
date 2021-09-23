#!/bin/bash

body=$(curl -L -X POST https://databus.dbpedia.org/repo/dataid/upload -s)
assert_eq "$body" "Multi-part request expected, but received None." "Upload not available: ${body}"