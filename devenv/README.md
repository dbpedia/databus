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

### Starting the Databus Environment

Firstly, build the lookup-servlet docker image

```
cd search
docker build -t lookup-servlet .
```

Go to the devenv directory of the repository and start the database and lookup search containers

```
cd ..
cd devenv
docker-compose up
```

You can restart these containers using `docker-compose restart`. 
Additionally, there is a script for a restart with database wipe  (`bash env-clean-start.sh`)

### Starting the Databus Server

First, both server and client application need to be installed using `npm`.

```
cd public
npm install
cd ../server
npm install
```

Then run either 

```
bash start_auth0.sh
```
*or* 
```
bash start_dbpedia_keycloak.sh
```

Each script contains a different configuration for a specific OIDC provider (Auth0 with Google Auth *or* DBpedia Login)

