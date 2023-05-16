# Server Configuration

## Mandatory Configuration

Configure your Databus installation by changing the values in the `.env` file in the root directory of the repository. The following values can be configured:

* **DATABUS\_RESOURCE\_BASE\_URL**: The base resource URL. All Databus resources will start with this URL prefix. Make sure that it matches the DNS entry pointing to your Databus server so that HTTP requests on the resource identifiers will point to your Databus deployment.
* **DATABUS\_OIDC\_ISSUER\_BASE\_URL**: Base URL of your OIDC provider
* **DATABUS\_OIDC\_CLIENT\_ID**: Client Id of your OIDC client
* **DATABUS\_OIDC\_SECRET**: Client Secret of your OIDC client
* **VIRTUOSO\_PASSWORD**: The password of the VIRTUOSO\_USER account

If you would like to use the internal reverse proxy with automatic HTTPS (certificate) provisioning follow further [proxy configuration instructions](docs/https-and-proxy-setup.md). Otherwise it is required to configure an external reverse proxy with a TLS-encrypted connection (HTTPS) of your choice for the Databus container (port 3000 by default - see [example config](docs/https-and-proxy-setup.md#external-proxy-example)).

## Advanced Configuration

The configuration can be adjusted by modifying the `docker-compose.yml` file directly. The compose file starts 3 docker containers.

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

**Callback** `https://databus.example.org/app/callback`

**Logout** `https://databus.example.org/app/logout`

**Login** `https://databus.example.org/app/login`

### OIDC Providers

Tested OIDC providers: Keycloak, Auth0, Microsoft Azure Active Directory
