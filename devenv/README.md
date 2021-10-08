# Development Environment

## Requirements

In order to build and run the On-Premise Databus Application you will need `npm`, `docker` and `docker-compose` installed on your machine.
* `npm`: 7.24.0 or higher
* `docker`: 20.10.2 or higher
* `docker-compose`: 1.25.0 or higher

## Building the Databus Docker Image

The following instructions will build the docker image for the Databus Server. Only do this if you want to run the Databus as a dockerized application. If you want to run the Databus without docker, you can skip this section.

```
git clone https://github.com/dbpedia/databus.git
cd databus
bash build-docker-image.sh
```

The `build-docker-image.sh` script will install all npm dependencies for the server and webclient and build the docker image for the Databus application.

## Starting the Databus Locally

### Starting the Databus Environment

Go to the root directory of the repository and start the database and lookup search containers

```
make env-build
make env-start
```

You can restart these containers using `make env-restart`. 
Additionally, there is a make instruction for a restart with database wipe  (`make env-clean-start`)

### Starting the Databus Server

First, install all dependencies by running:

```
make srv-install
```

Then run either:

```
make srv-start-auth0
```
*or* 
```
make srv-start_dbpedia_keycloak
```

Each script contains a different configuration for a specific OIDC provider (Auth0 with Google Auth *or* DBpedia Login)

**PLEASE NOTE:** The sample OIDC providers are a development setup and should never be used in productions. Please use your own OIDC provider for authentication in production.
