#!/bin/bash

URL="http://localhost:3000/janfo/dumps/wikidata/2025-02-13/wikidata.java"

while true; do
    curl -s "$URL"
    sleep $(awk -v min=0.1 -v max=1 'BEGIN{srand(); print min+rand()*(max-min)}')
done
