#!/bin/bash
source ./assert.sh

# Testing resource page availability
source ./availability/test_availability_resource_pages.sh
# Testing system page availability
source ./availability/test_availability_system_pages.sh
# Testing search availability
source ./availability/test_availability_search.sh

source ./availability/test_availability_api.sh
# TODO: Test mongodb database read access
# TODO: Test collection
# TODO: Test return values of the facets retrieval
# TODO: Check apacheconf special routings