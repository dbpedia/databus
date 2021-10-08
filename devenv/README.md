# Development Environment

## Requirements

In order to build and run the On-Premise Databus Application you will need `npm`, `docker` and `docker-compose` installed on your machine.
* `npm`: 7.24.0 or higher
* `docker`: 20.10.2 or higher
* `docker-compose`: 1.25.0 or higher

## Building the Docker Image

```
git clone https://github.com/dbpedia/databus.git
cd databus
bash build-docker-image.sh
```

The `build-docker-image.sh` script will install all npm dependencies for the server and webclient and build the docker image for the Databus application.

## Starting the Databus Locally

### Starting the Databuse Environment

Go to the root directory of the repository and start the database and lookup search containers

```
make env-build
make env-start
```

You can restart these containers using `make env-restart`. 
Additionally, there is a make instruction for a restart with database wipe  (`make env-clean-start`)

### Starting the Databus Server

First, both server and client application need to be installed using `npm`.

```
make srv-install
```

Then run either 

```
make srv-start-auth0
```
*or* 
```
make srv-start_dbpedia_keycloak
```

Each script contains a different configuration for a specific OIDC provider (Auth0 with Google Auth *or* DBpedia Login)

