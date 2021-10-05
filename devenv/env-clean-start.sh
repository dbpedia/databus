# Removing the database data
sudo rm -r data/
# Removing the user table
sudo rm -r ../server/users
# Killing and removing the docker containers
docker rm -f devenv_lookup
docker rm -f devenv_virtuoso
docker rm -f devenv_gstore
# Restart
docker-compose up
