# Databus

## Status
This repo develops Databus version 2.0, which is a major upgrade of version 1.3-beta (currently running at http://dbpedia.databus.org)
If you install it and find problems, please report in issue tracker to help us test this new version. 

**API docu:** https://github.com/dbpedia/databus/blob/master/API.md

**Development setup:** https://github.com/dbpedia/databus/blob/master/devenv/README.md

## Requirements

In order to run the On-Premise Databus Application you will need `docker` and `docker-compose` installed on your machine.
* `docker`: 20.10.2 or higher
* `docker-compose`: 1.25.0 or higher


## Starting the Databus Server

Clone the repository or download the `docker-compose.yml` and `.env` file to your machine. Both files need to exist in the same directory. Navigate to the directory containing the files (or the root directory of the cloned repository) and run:

```
docker-compose up
```

The Databus should be available at `http://localhost:3000`.

## Basic Configuration

Configure your Databus installation by changing the values in the `.env` file in the root directory of the repository. The following values can be configured:

* **DATABUS_RESOURCE_BASE_URL**: The base resource URL. All Databus resources will start with this URL prefix. Make sure that it matches the DNS entry pointing to your Databus server so that HTTP requests on the resource identifiers will point to your Databus deployment.
* **DATABUS_OIDC_ISSUER_BASE_URL**: Base URL of your OIDC provider
* **DATABUS_OIDC_CLIENT_ID**: Client Id of your OIDC client
* **DATABUS_OIDC_SECTRET**: Client Secret of your OIDC client
* **VIRTUOSO_USER**: A virtuoso database user with write access (SPARQL_UPDATE)
* **VIRTUOSO_PASSWORD**: The password of the VIRTUOSO_USER account


## Advanced Configuration

The configuration can be adjusted by modifying the docker-compose.yml file directly. The compose file starts 3 docker containers.

### Databus Container

The Databus container holds the Databus server application (port 3000) and search API (port 8080). The internal ports can be mapped to an outside port using the docker-compose port settings. Mapping the port of the search API is optional.

The Databus container accepts the following environment variables:
* **DATABUS_RESOURCE_BASE_URL**: The base resource URL. All Databus resources will start with this URL prefix. Make sure that it matches the DNS entry pointing to your Databus server so that HTTP requests on the resource identifiers will point to your Databus deployment.
* **DATABUS_DATABASE_URL**: The URL of your GStore database. Can be left as is. Change this only if you want to host your database elsewhere and you know what you are doing.
* **DATABUS_OIDC_ISSUER_BASE_URL**: Base URL of your OIDC provider
* **DATABUS_OIDC_CLIENT_ID**: Client Id of your OIDC client
* **DATABUS_OIDC_SECTRET**: Client Secret of your OIDC client

The volumes of the Databus container are best left unchanged. The internal path of the volumes should not be altered. The ourside paths may be changed to any desired path. The keypair folder will store the private and public key of your Databus deployment. The users folder will hold a mini-database associating your OIDC users with Databus users.

### GStore Container

The GStore is a git-repository / triple store hybrid database. It stores chunks of RDF data both as files in a git repository and graphs in a triple store. This allows rollback of commits AND sending of SPARQL queries. The default GStore configuration operates with an internal git repository (can be changed to an external repository, please refer to the GStore documentation) and a Virtuoso triple store. 

The GStore Container accepts the following environment variables:
* **VIRT_USER**: The admin user of your virtuoso deployment
* **VIRT_PASS**: The admin password of your virtuoso deployment
* **VIRT_URI**: The uri of the virtuoso deployment. Keep this as is unless you want to host your virtuoso triple store elsewhere.

### Virtuoso Container

The Virtuoso container is the triple store database.

The Virtuoso Container accepts the following environment variables:
* **DBA_PASSWORD**: Admin password
* **SPARQL_UPDATE**: Needs to be set to true to allow updates
* **DEFAULT_GRAPH**: Set this to your DATABUS_RESOURCE_BASE_URL setting


## OIDC Configuration

### OIDC Client Configuration

Follow the documentation of your OIDC provider to configure a client. Connect the client to the deployed Databus instance by setting the following environment variables on Datbaus startup:

* **DATABUS_OIDC_ISSUER_BASE_URL**: The base URL of your OIDC provider
* **DATABUS_OIDC_CLIENT_ID**: The client id of the configured client at the OIDC provider
* **DATABUS_OIDC_SECRET**: the client secret of the configured client at the OIDC provider

When configuring the client at the OIDC provider, you will be most likely asked to specify a callback URI for redirects after a login. The callback values need to be set to the following values:

**Callback**
`https://databus.example.org/system/callback`

**Logout**
`https://databus.example.org/system/logout`

**Login**
`https://databus.example.org/system/login`

### OIDC Providers 

Tested OIDC providers: Keycloak, Auth0, Microsoft Azure Active Directory

