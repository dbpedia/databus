---
description: >-
  A digital factory platform for managing files online with stable IDs,
  high-quality metadata, powerful API and tools for building on data: find,
  access, make interoperable, re-use
---

# Databus

##

## Architecture

diagram with clickable links

## Acknowledgements

## License

The source code of this repo is published under the [Apache License Version 2.0](https://github.com/AKSW/jena-sparql-api/blob/master/LICENSE)

Databus is configured so that the default license of all metadata is CC-0, which is relevant for all data of the Model, i.e. who published which data, when and under which license.

The individual datasets are referenced via links (dcat:downloadURL) and can have any license.

## Status

This repo develops Databus version 2.0, which is a major upgrade of version 1.3-beta (currently running at http://dbpedia.databus.org) If you install it and find problems, please report in issue tracker to help us test this new version.

**API docu:** https://github.com/dbpedia/databus/blob/master/API.md

**Development setup:** https://github.com/dbpedia/databus/blob/master/devenv/README.md

## Requirements

In order to run the Databus on-premise you will need `docker` and `docker-compose` installed on your machine.&#x20;

* `docker`: 20.10.2 or higher
* `docker-compose`: 1.25.0 or higher

Additionally you need an OIDC provider.

## Starting the Databus Server

Clone the repository or download the `docker-compose.yml` and `.env` file to your machine. Both files need to exist in the same directory. Navigate to the directory containing the files (or the root directory of the cloned repository). It is possible to run the Databus on localhost in one shot with the default configuration to have a quick look. However, for proper setups it is required to start from a fresh/wiped state and perform [mandatory configuration settings](./#mandatory-configuration) first.&#x20;

&#x20;run:

```
docker-compose up
```

Or, to start the containers in the background i.e. detached, run:

```
docker-compose up -d
```

The Databus should be available at `http://localhost:3000`.&#x20;

## Mandatory Configuration

Configure your Databus installation by changing the values in the `.env` file in the root directory of the repository. The following values can be configured:

* **DATABUS\_RESOURCE\_BASE\_URL**: The base resource URL. All Databus resources will start with this URL prefix. Make sure that it matches the DNS entry pointing to your Databus server so that HTTP requests on the resource identifiers will point to your Databus deployment.
* **DATABUS\_OIDC\_ISSUER\_BASE\_URL**: Base URL of your OIDC provider
* **DATABUS\_OIDC\_CLIENT\_ID**: Client Id of your OIDC client
* **DATABUS\_OIDC\_SECRET**: Client Secret of your OIDC client
* **VIRTUOSO\_PASSWORD**: The password of the VIRTUOSO\_USER account

If you would like to use the internal reverse proxy with automatic HTTPS (certificate) provisioning follow further [proxy configuration instructions](usage/https-and-proxy-setup.md). Otherwise it is required to configure an external reverse proxy with a TLS-encrypted connection (HTTPS) of your choice for the Databus container (port 3000 by default - see [example config](usage/https-and-proxy-setup.md#external-proxy-example)).

## Advanced Configuration

The configuration can be adjusted by modifying the docker-compose.yml file directly. The compose file starts 3 docker containers.

### Databus Container

The Databus container holds the Databus server application (port 3000) and search API (port 8080). The internal ports can be mapped to an outside port using the docker-compose port settings. Mapping the port of the search API is optional.

The Databus container accepts the following environment variables:

* **DATABUS\_RESOURCE\_BASE\_URL**: The base resource URL. All Databus resources will start with this URL prefix. Make sure that it matches the DNS entry pointing to your Databus server so that HTTP requests on the resource identifiers will point to your Databus deployment.
* **DATABUS\_DATABASE\_URL**: The URL of your GStore database. Can be left as is. Change this only if you want to host your database elsewhere and you know what you are doing.
* **DATABUS\_OIDC\_ISSUER\_BASE\_URL**: Base URL of your OIDC provider
* **DATABUS\_OIDC\_CLIENT\_ID**: Client Id of your OIDC client
* **DATABUS\_OIDC\_SECRET**: Client Secret of your OIDC client

The volumes of the Databus container are best left unchanged. The internal path of the volumes should not be altered. The ourside paths may be changed to any desired path. The keypair folder will store the private and public key of your Databus deployment. The users folder will hold a mini-database associating your OIDC users with Databus users.

### GStore Container

The GStore is a git-repository / triple store hybrid database. It stores chunks of RDF data both as files in a git repository and graphs in a triple store. This allows rollback of commits AND sending of SPARQL queries. The default GStore configuration operates with an internal git repository (can be changed to an external repository, please refer to the GStore documentation) and a Virtuoso triple store.

The GStore Container accepts the following environment variables:

* **VIRT\_USER**: The admin user of your virtuoso deployment
* **VIRT\_PASS**: The admin password of your virtuoso deployment
* **VIRT\_URI**: The uri of the virtuoso deployment. Keep this as is unless you want to host your virtuoso triple store elsewhere.

### Virtuoso Container

The Virtuoso container is the triple store database.

The Virtuoso Container accepts the following environment variables:

* **DBA\_PASSWORD**: Admin password
* **SPARQL\_UPDATE**: Needs to be set to true to allow updates
* **DEFAULT\_GRAPH**: Set this to your DATABUS\_RESOURCE\_BASE\_URL setting

## OIDC Configuration

### OIDC Client Configuration

Follow the documentation of your OIDC provider to configure a client. Connect the client to the deployed Databus instance by setting the following environment variables on Datbaus startup:

* **DATABUS\_OIDC\_ISSUER\_BASE\_URL**: The base URL of your OIDC provider
* **DATABUS\_OIDC\_CLIENT\_ID**: The client id of the configured client at the OIDC provider
* **DATABUS\_OIDC\_SECRET**: the client secret of the configured client at the OIDC provider

When configuring the client at the OIDC provider, you will be most likely asked to specify a callback URI for redirects after a login. The callback values need to be set to the following values:

**Callback** `https://databus.example.org/system/callback`

**Logout** `https://databus.example.org/system/logout`

**Login** `https://databus.example.org/system/login`

### OIDC Providers

Tested OIDC providers: Keycloak, Auth0, Microsoft Azure Active Directory

###
