# Databus (BETA)

## Deployment

In order to build and run the On-Premise Databus Application you will need `npm`, `docker` and `docker-compose` installed on your machine.
* `npm`: 7.24.0 or higher
* `docker`: 20.10.2 or higher
* `docker-compose`: 1.25.0 or higher

### Building the Docker Image

```
git clone https://github.com/holycrab13/databus-beta.git
cd databus-beta
bash install.sh
```

The `install.sh` script will install all npm dependencies for the server and webclient and build the docker image for the Databus application.

### Redeploying a new Beta Version

```
bash restart.sh
```

### Basic Configuration

Configure your Databus installation by changing the values in the `.env` file in the root directory of the repository. The following values can be configured:

* **DATABUS_RESOURCE_BASE_URL**: The base resource URL. All Databus resources will start with this URL prefix. Make sure that it matches the DNS entry pointing to your Databus server so that HTTP requests on the resource identifiers will point to your Databus deployment.
* **DATABUS_OIDC_ISSUER_BASE_URL**: Base URL of your OIDC provider
* **DATABUS_OIDC_CLIENT_ID**: Client Id of your OIDC client
* **DATABUS_OIDC_SECTRET**: Client Secret of your OIDC client
* **VIRTUOSO_USER**: A virtuoso database user with write access (SPARQL_UPDATE)
* **VIRTUOSO_PASSWORD**: The password of the VIRTUOSO_USER account

### Starting the Databus Server

```
docker-compose up
```


### Advanced Configuration

The configuration can be adjusted by modifying the docker-compose.yml file directly. The compose file starts 3 docker containers.

#### Databus Container

The Databus container holds the Databus server application (port 3000) and search API (port 8080). The internal ports can be mapped to an outside port using the docker-compose port settings. Mapping the port of the search API is optional.

The Databus container accepts the following environment variables:
* DATABUS_RESOURCE_BASE_URL: The base resource URL. All Databus resources will start with this URL prefix. Make sure that it matches the DNS entry pointing to your Databus server so that HTTP requests on the resource identifiers will point to your Databus deployment.
* DATABUS_DATABASE_URL: The URL of your GStore database. Can be left as is. Change this only if you want to host your database elsewhere and you know what you are doing.
* DATABUS_OIDC_ISSUER_BASE_URL: Base URL of your OIDC provider
* DATABUS_OIDC_CLIENT_ID: Client Id of your OIDC client
* DATABUS_OIDC_SECTRET: Client Secret of your OIDC client

The volumes of the Databus container are best left unchanged. The internal path of the volumes should not be altered. The ourside paths may be changed to any desired path. The keypair folder will store the private and public key of your Databus deployment. The users folder will hold a mini-database associating your OIDC users with Databus users.

#### GStore Container

The GStore is a git-repository / triple store hybrid database. It stores chunks of RDF data both as files in a git repository and graphs in a triple store. This allows rollback of commits AND sending of SPARQL queries. The default GStore configuration operates with an internal git repository (can be changed to an external repository, please refer to the GStore documentation) and a Virtuoso triple store. 

The GStore Container accepts the following environment variables:
* VIRT_USER: The admin user of your virtuoso deployment
* VIRT_PASS: The admin password of your virtuoso deployment
* VIRT_URI: The uri of the virtuoso deployment. Keep this as is unless you want to host your virtuoso triple store elsewhere.

#### Virtuoso Container

The Virtuoso container is the triple store database.

The Virtuoso Container accepts the following environment variables:
* DBA_PASSWORD: Admin password
* SPARQL_UPDATE: Needs to be set to true to allow updates
* DEFAULT_GRAPH: Set this to your DATABUS_RESOURCE_BASE_URL setting


Example:

```
version: "3.0"
services:
  databus:
    image: databus
    ports:
      - 3000:3000 # Port of the databus
      - 3001:8080 # OPTIONAL: exposes search
    environment: 
      - "DATABUS_RESOURCE_BASE_URL=https://dev.databus.dbpedia.org" # Resource base URL
      - "DATABUS_DATABASE_URL=http://172.17.0.01:3002"
      - "DATABUS_OIDC_ISSUER_BASE_URL=https://kilt.eu.auth0.com"
      - "DATABUS_OIDC_CLIENT_ID=K5PCEOr7OJGBGU9xN7SvBrX1RWDs4S4n"
      - "DATABUS_OIDC_SECRET=LiL_X1tzwRmReU3RO7kBlBdDopmVEGf4gj5Ve8No16kifyi3weXK7u6IS1Ttpl_q"
    volumes:
      - ./keypair/:/databus/server/keypair
      - ./users/:/databus/server/users
  gstore:
    image: gstore
    environment: 
      VIRT_USER: "dba"
      VIRT_PASS: "everyoneknows"
      VIRT_URI: "http://172.17.0.01:3003"
    ports:
      - "3002:80"
  virtuoso:
    image: "tenforce/virtuoso:1.3.2-virtuoso7.2.5.1"
    environment:
      DBA_PASSWORD: "everyoneknows"
      SPARQL_UPDATE: "true"
      DEFAULT_GRAPH: "https://dev.databus.dbpedia.org"
    ports:
      - "3003:8890"
    volumes: 
      - ./data/virtuoso:/data
```

## Authentication

### Client Configuration

Follow the documentation of your OIDC provider to configure a client. Connect the client to the deployed Databus instance by setting the following environment variables on Datbaus startup:

* DATABUS_OIDC_ISSUER_BASE_URL: The base URL of your OIDC provider
* DATABUS_OIDC_CLIENT_ID: The client id of the configured client at the OIDC provider
* DATABUS_OIDC_SECRET: the client secret of the configured client at the OIDC provider

When configuring the client at the OIDC provider, you will be most likely asked to specify a callback URI for redirects after a login. The callback values need to be set to the following values:

**Callback**
`https://databus.example.org/system/callback`

**Logout**
`https://databus.example.org/system/logout`

**Login**
`https://databus.example.org/system/login`

### OIDC Providers 

Tested OIDC providers: Keycloak, Auth0, Microsoft Azure

### Creating an API Token

Once the Databus has been started with the correct configuration, you can use the login button on the web interface to log in to your OIDC provider account. Once you are successfully logged in, you can navigate to your account page by using the 'My Account' button on the landing page or using the dropdown in the upper right corner of the screen.

You will be asked to specify a namespace. Choose this namespace carefully, as it will be visible in all your databus URIs. The namespace can only be changed by an admin later.

Navigate to the settings tab on your account page and scroll to the 'API Keys' section. Enter a display name for your API key (this is only for better distinguishability) and click 'Create' to create the key. You can use the copy icon on the API key to copy the key value to your clipboard.

Use any API key in the `X-Api-Token` header of your API calls to authenticate yourself.

## Databus API

The following examples of the API usage use a non-existing example databus at `https://databus.example.org`. The user performing the requests will be John who is using the namespace `john`. John has already created an API token on his account page with a value of `27b29848-69c6-4eaf`.


### Accounts

Account data can be changed via `PUT` or `DELETE` request. It is however recommended to use the web interface for these actions.
* The request uri is the path of your account. 
* The `X-Api-Token` header needs to specify a valid API token. 
* The `Content-Type` header needs to be set to the content type of your data. 
* The supplied data needs to conform to the following SHACL shapes

```
@prefix dash: <http://datashapes.org/dash#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix dataid: <http://dataid.dbpedia.org/ns/core#> .
@prefix dct:   <http://purl.org/dc/terms/> .
@prefix dcat:  <http://www.w3.org/ns/dcat#> .
@prefix dcv: <http://dataid.dbpedia.org/ns/cv#> .
@prefix db: <https://databus.dbpedia.org/sys/ont/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

##########
# Account
##########

<#person-exists>
  a sh:NodeShape ;
  sh:targetNode foaf:Person ; 
  sh:property [
      sh:path [ sh:inversePath rdf:type ] ;
      sh:minCount 1 ;
      sh:maxCount 1;
      sh:message "Exactly one subject with an rdf:type of foaf:Person must occur."@en ;
  ] .

<#profile-exists>
  a sh:NodeShape ;
  sh:targetNode foaf:PersonalProfileDocument ; 
  sh:property [
      sh:path [ sh:inversePath rdf:type ] ;
      sh:minCount 1 ;
      sh:maxCount 1;
      sh:message "Exactly one subject with an rdf:type of foaf:PersonalProfileDocument must occur."@en ;
  ] .

<#foaf-maker>   
    a sh:PropertyShape ;
    sh:targetClass foaf:PersonalProfileDocument ;
    sh:severity sh:Violation ;
    sh:message "Required property foaf:maker MUST occur exactly once in foaf:PersonalProfileDocument."@en ;
    sh:path foaf:maker ;
    sh:minCount 1 ;
    sh:maxCount 1 .

  <#foaf-primary-topic>   
    a sh:PropertyShape ;
    sh:targetClass foaf:PersonalProfileDocument ;
    sh:severity sh:Violation ;
    sh:message "Required property foaf:primaryTopic MUST occur exactly once in foaf:PersonalProfileDocument."@en ;
    sh:path foaf:primaryTopic ;
    sh:minCount 1 ;
    sh:maxCount 1 .

  <#foaf-primary-topic-target>   
    a sh:PropertyShape ;
    sh:targetClass foaf:PersonalProfileDocument ;
    sh:severity sh:Violation ;
    sh:message "Object of foaf:primaryTopic must be of type foaf:Person."@en ;
    sh:path foaf:primaryTopic ;
    sh:class foaf:Person .

  <#foaf-account-target>   
    a sh:PropertyShape ;
    sh:targetClass foaf:Person ;
    sh:severity sh:Violation ;
    sh:message "Object of foaf:account must be of type foaf:PersonalProfileDocument."@en ;
    sh:path foaf:account ;
    sh:class foaf:PersonalProfileDocument .

  <#foaf-account>   
    a sh:PropertyShape ;
    sh:targetClass foaf:Person ;
    sh:severity sh:Violation ;
    sh:message "Required property foaf:account MUST occur exactly once in foaf:Person."@en ;
    sh:path foaf:account ;
    sh:minCount 1 ;
    sh:maxCount 1 .

  <#foaf-name>   
    a sh:PropertyShape ;
    sh:targetClass foaf:Person ;
    sh:severity sh:Violation ;
    sh:message "Required property foaf:name MUST be of type xsd:string and occur exactly once in foaf:Person."@en ;
    sh:path foaf:name ;
    sh:datatype xsd:string ;
    sh:minCount 1 ;
    sh:maxCount 1 .
  
<#foaf-img>   
    a sh:PropertyShape ;
    sh:targetClass foaf:Person ;
    sh:severity sh:Violation ;
    sh:message "Property foaf:img MUST be an IRI."@en ;
    sh:path foaf:img ;
    sh:nodeKind sh:IRI .
```



### Groups

You can add, change and remove groups. The actions are invoked by using the corresponding http request method `PUT`, `PATCH` and `DELETE`. The request uri is the path of your Databus Group. The `X-Api-Token` header needs to specify a valid API token. The `Content-Type` header needs to be set to the content type of your data. The supplied data needs to conform to the following SHACL shapes

```
@prefix dash: <http://datashapes.org/dash#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix dataid: <http://dataid.dbpedia.org/ns/core#> .
@prefix dct:   <http://purl.org/dc/terms/> .
@prefix dcat:  <http://www.w3.org/ns/dcat#> .
@prefix dcv: <http://dataid.dbpedia.org/ns/cv#> .
@prefix db: <https://databus.dbpedia.org/sys/ont/> .

##########
# Group
##########

<#group-exists>
  a sh:NodeShape ;
  sh:targetNode dataid:Group ; 
  sh:property [
      sh:path [ sh:inversePath rdf:type ] ;
      sh:minCount 1 ;
      sh:maxCount 1;
      sh:message "Exactly one subject with an rdf:type of dataid:Group must occur."@en ;
  ] .

<#en-title>   
    a sh:PropertyShape ;
    sh:targetClass dataid:Group ;
    sh:severity sh:Violation ;
    sh:message "Required property dct:title MUST occur at least once AND have one @en "@en ;
    sh:path dct:title ;
    sh:minCount 1 ;
    sh:languageIn ("en") ;
    sh:uniqueLang true .

<#en-abstract>   
    a sh:PropertyShape ;
    sh:targetClass dataid:Group ;
    sh:severity sh:Violation ;
    sh:message "Required property dct:abstract MUST occur at least once AND have one @en "@en ;
    sh:path dct:abstract ;
    sh:minCount 1 ;
    sh:languageIn ("en") ;
    sh:uniqueLang true .
  
<#en-description>   
    a sh:PropertyShape ;
    sh:targetClass dataid:Group ;
    sh:severity sh:Violation ;
    sh:message "Required property dct:description MUST occur at least once AND have one @en "@en ;
    sh:path dct:description ;
    sh:minCount 1 ;
    sh:languageIn ("en") ;
    sh:uniqueLang true .
```

The uri of the dataid:Group has to be the same as the request uri. Additionally, the uri has to be in the namespace of the issuing publisher (identified by the API token).



#### Example:
John wants to create the group `general` to later publish some of his artifacts. He issues the following `PUT` request:

```
curl -X PUT -H "Content-Type: application/json" -H "X-Api-Token: 27b29848-69c6-4eaf" -d "./group.jsonld" https://databus.example.org/john/general
```

The contents of the file `./group.jsonld` are the following:

```
{
  "@id": "https://databus.example.org/john/general",
  "@type": "http://dataid.dbpedia.org/ns/core#Group",
  "http://purl.org/dc/terms/title": {
    "@value": "General",
    "@language": "en"
  },
  "http://purl.org/dc/terms/abstract": {
    "@value": "General artifacts.",
    "@language": "en"
  },
  "http://purl.org/dc/terms/description": {
    "@value": "This group contains various general artifacts.",
    "@language": "en"
  }
}
```

Note that the *@id* of the supplied graph has to be the same as the request uri. Additionally, the uri has to be in John's namespace `john`.
