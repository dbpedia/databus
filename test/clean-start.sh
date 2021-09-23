sudo rm -r data/
docker rm -f test_lookup
docker rm -f test_virtuoso
docker rm -f test_store
docker-compose up
