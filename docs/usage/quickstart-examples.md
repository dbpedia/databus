# Quickstart Examples

In this chapter we will focus only on the main api which consists of publishing a dataset and querying metadata stored with SPARQL. Please refer to [API Docs](api/README.md) for details.

## Creating an API Token

Once the Databus has been started with the correct configuration, you can use the login button on the web interface to log in to your OIDC provider account. Once you are successfully logged in, you can navigate to your account page by using the 'My Account' button on the landing page or using the dropdown in the upper right corner of the screen.

![img.png](../images/my-account.png)

You will be asked to specify a namespace. Choose this namespace carefully, as it will be visible in all your databus URIs. The namespace can only be changed by an admin later.

![settings-tab.png](../images/settings-tab.png)

Navigate to the settings tab on your account page and scroll to the 'API Keys' section. Enter a display name for your API key (this is only for better distinguishability) and click 'Create' to create the key. You can use the copy icon on the API key to copy the key value to your clipboard.

Use the API key in the `x-api-key` HTTP-header of your API calls to authenticate yourself.

## Generating Json-LD Inputs (Metadata)

Most API calls can be used to create, change or delete data on the Databus. This includes groups, artifacts and versions but also account information and Databus Collections.

You can generate your own example inputs by using the Web-UI of Publish Wizard, for example in our [dev Databus](https://dev.databus.dbpedia.org). **NOTE! In case you use you own Databus server, you will need to change all the URI prefixes in the generated Json-LD to yours, i.e. `https://dev.databus.dbpedia.org` -> `https://<your server>`!**

![publish.png](../images/publish.png)

Before saving your inputs to the database, they will be validated in 2 steps:
1) **Construct Query:** A construct query is executed on your RDF input to only select the needed triples. This prevents users from inserting unneeded information.
2) **SHACL Validation** The result of the construct query is validated with SHACL constraints. This makes sure that the information in your input is complete and formatted correctly

## Examples

In the quickstart we use the minimal required input metadata for publishing a dataset on the Databus and a few SPARQL queries to demonstrate how the metadata can be integrated in your workflow.

### Publishing

The following example of use our dev Databus at `https://dev.databus.dbpedia.org/`.

In the following example we publish a minimal Json-LD with metadata about a test dataset containing our [README](https://raw.githubusercontent.com/dbpedia/databus/68f976e29e2db15472f1b664a6fd5807b88d1370/README.md) file.  

You need the execute the following HTTP request (we provide curl for it):

```shell
curl -X 'POST' \
  'https://dev.databus.dbpedia.org/api/publish?fetch-file-properties=true&log-level=info' \
  -H 'accept: application/json' \
  -H 'X-API-KEY: <your API key>' \
  -H 'Content-Type: application/ld+json' \
  -d '{
  "@context": "https://downloads.dbpedia.org/databus/context.jsonld",
  "@graph": [
    {
      "@type": [
        "Version",
        "Dataset"
      ],
      "@id": "https://dev.databus.dbpedia.org/<your username>/test_group/test_artifact/2023-06-13",
      "hasVersion": "2023-06-13",
      "title": "test dataset",
      "abstract": "test dataset abstract",
      "description": "test dataset description",
      "license": "https://dalicc.net/licenselibrary/Apache-2.0",
      "distribution": [
        {
          "@type": "Part",
          "formatExtension": "md",
          "compression": "none",
          "downloadURL": "https://raw.githubusercontent.com/dbpedia/databus/68f976e29e2db15472f1b664a6fd5807b88d1370/README.md"
        }
      ]
    }
  ]
}'
```

If the Databus should NOT infer a certain metadatum (for example not auto-generating the `abtract` from the `description` field), it can be set explicitly and the Databus will accept it (if it fits its criteria). For a full list of inferrable properties check out the [autocompletion page](../auto-completion.md)

#### Property Description

This gives a quick overview on what to put in for the different keys. In which exact triples the data will result can be seen in the [JSON-LD context](https://downloads.dbpedia.org/databus/context.jsonld).

| Key          | Value                                                                                                                                                                                                                                                     | 
|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| @type        | The type of the graph. For the databus the types `Group`, `Artifact`, `Version`, `Dataset` and `Part` are permitted.                                                                                                                                      |
| @id          | This represents the `id` (subject) of the triples. In the case of a `Dataset` this is the identifier consists of `${DATABUS_BASE_URL}/user/group/artifact/version`. What those are exactly can be see at the [model documentation](../model/README.md) |
| title        | This is a short title for the Dataset                                                                                                                                                                                                                     |
| description  | A longer description for the content of the dataset. Markdown syntax is supported.                                                                                                                                                                        |
| license      | The license of the dataset. Currently only one license as a URI is supported                                                                                                                                                                              |
| distribution | Contains a list of `Part`,  each representing a registered file.                                                                                                                                                                                          |
| downloadURL  | The location URL of the registered file.                                                                                                                                                                                                                  |
| dcv:key      | Set a value for a given key to individually identify a file and notate properties of a file. Example `"dcv:type": "rawdata"`                                                                                                                              |

#### Turtle

You can easily retrieve a turtle representation of a published dataset version by executing curl request with `Accept:text/turtle` header on the version uri:

```shell
curl -H "Accept:text/turtle" https://staging.databus.dbpedia.org/<your username>/testgroup/testartifact/2023-06-22#dataid.ttl
```

Here is an example of turtle representatation of the metadata stored in databus:

```text
@prefix rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix ns1:	<https://databus.dbpedia.org/debugi/> .
@prefix ns2:	<https://dataid.dbpedia.org/databus#> .
ns1:testgroup	rdf:type	ns2:Group .
@prefix ns3:	<https://databus.dbpedia.org/debugi/testgroup/> .
ns3:testartifact	rdf:type	ns2:Artifact .
@prefix ns4:	<http://dataid.dbpedia.org/ns/cv#> .
ns4:asdf	rdf:type	rdf:Property .
@prefix rdfs:	<http://www.w3.org/2000/01/rdf-schema#> .
ns4:asdf	rdfs:subPropertyOf	ns2:contentVariant .
<https://databus.dbpedia.org/debugi/testgroup/testartifact/2023-06-22#testartifact_asdf=qwer.ttl>	rdf:type	ns2:Part .
@prefix xsd:	<http://www.w3.org/2001/XMLSchema#> .
@prefix dcterms:	<http://purl.org/dc/terms/> .
<https://databus.dbpedia.org/debugi/testgroup/testartifact/2023-06-22#testartifact_asdf=qwer.ttl>	dcterms:modified	"2023-06-22T12:26:25.347Z"^^xsd:dateTime ;
	dcterms:hasVersion	"2023-06-22" ;
	dcterms:issued	"2023-06-22T12:26:25.347Z"^^xsd:dateTime .
@prefix ns8:	<http://www.w3.org/ns/dcat#> .
<https://databus.dbpedia.org/debugi/testgroup/testartifact/2023-06-22#testartifact_asdf=qwer.ttl>	ns8:byteSize	2944 ;
	ns4:asdf	"qwer" ;
	ns2:sha256sum	"3f2372305549beddb0bf9784dbfc0ad156c1789cc86c0077b3e14d70b69c7270" ;
	ns2:compression	"none" ;
	ns2:formatExtension	"ttl" ;
	ns8:downloadURL	<https://holycrab13.github.io/webid.ttl> ;
	ns2:file	<https://databus.dbpedia.org/debugi/testgroup/testartifact/2023-06-22/testartifact_asdf=qwer.ttl> .
<https://databus.dbpedia.org/debugi/testgroup/testartifact/2023-06-22>	rdf:typns2:Version .
@prefix ns9:	<http://dataid.dbpedia.org/ns/core#> .
<https://databus.dbpedia.org/debugi/testgroup/testartifact/2023-06-22>	rdf:typns9:Dataset ;
	dcterms:modified	"2023-06-22T12:26:25.347Z"^^xsd:dateTime ;
	dcterms:description	"This is just a test. Nothing to see here." ;
	dcterms:abstract	"This is just a test. Nothing to see here." ;
	dcterms:title	"My Title" ;
	dcterms:hasVersion	"2023-06-22" ;
	ns2:artifact	ns3:testartifact ;
	dcterms:issued	"2023-06-22T12:26:25.347Z"^^xsd:dateTime .
@prefix ns10:	<https://databus.dbpedia.org/debugi#> .
<https://databus.dbpedia.org/debugi/testgroup/testartifact/2023-06-22>	dcterms:publisher	ns10:this ;
	ns8:distribution	<https://databus.dbpedia.org/debugi/testgroup/testartifact/2023-06-22#testartifact_asdf=qwer.ttl> .
@prefix ns11:	<https://databus.dbpedia.org/> .
<https://databus.dbpedia.org/debugi/testgroup/testartifact/2023-06-22>	ns2:account	ns11:debugi ;
	ns2:group	ns1:testgroup .
@prefix ns12:	<https://w3id.org/security#> .
<https://databus.dbpedia.org/debugi/testgroup/testartifact/2023-06-22>	ns12:proof	<6cbae469abfbfc6014fb661a9d7400a1> ;
	dcterms:license	<https://dalicc.net/licenselibrary/AFL-3.0> .
<6cbae469abfbfc6014fb661a9d7400a1>	rdf:type	ns2:DatabusTractateV1 ;
	ns12:signature	"AQscxRHoMsdToTP1jW7RBFWJ+GUF333GXCydM4gVBvjt2S3crKUbOCG2NYCiSplhtIreXcSSA3t3mQsdfz3/f0w4+EYkVKFH5O19U5tX+WzJG/rXt1yHmNYI5waklvHypWgRUKHR84XwPAHvu4+Dojm5p0HqBlinEYEHmnOw1UrfClZmalGxBk+aoa5E4E1YPBDlAywzWfs7ZruS9meCTMh1RSt9lX2Xplrnzm09dpZ8mJR6q+XIUTm8VAwzHbNzMaZ+xqPip6pbVRefUS6IokWFsQ0gLOwkGotws4YxbXcFa50gO9fg4x973/PygPylXEtKvZPUrS13Z/Yg61jeuA==" .
```

Turtle is very useful for writing SPARQL requests as in the following sections.

### SPARQL Queries

After you have some data in Databus published you can execute SPARQL queries to filter out what you need.

For that you can use SPARQL endpoint interface or API method [`POST /sparql`](https://dev.databus.dbpedia.org/api/#/general/sparql-post).

![img.png](../images/SPARQL-endpoint.png)


Example query for retrieving list of all datasets in Databus:
```sparql
PREFIX databus: <https://dataid.dbpedia.org/databus#>
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT DISTINCT ?dataset WHERE {
  GRAPH ?g {
    ?dataset rdf:type databus:Version .
  }
}
```

Example Query for retrieving all files, their download location, format and size from a certain dataset (by knowing group, artifact and version)

```sparql
PREFIX databus: <https://dataid.dbpedia.org/databus#>
PREFIX dcat:   <http://www.w3.org/ns/dcat#>

SELECT DISTINCT ?distribution, ?file, ?downloadUrl, ?format, ?byteSize WHERE {
  GRAPH ?g {
    <https://dev.databus.dbpedia.org/<your username>/test_group/test_artifact/2023-06-13> dcat:distribution ?distribution .
    ?distribution databus:file ?file .
    ?distribution dcat:byteSize ?byteSize .
    ?distribution databus:formatExtension ?format .
    ?distribution dcat:downloadURL ?downloadUrl .
  }
}
```

Example Query for retrieving the same information for the latest version of an artifact:

```sparql
PREFIX databus: <https://dataid.dbpedia.org/databus#>
PREFIX dcat:   <http://www.w3.org/ns/dcat#>
PREFIX dct:    <http://purl.org/dc/terms/>

SELECT DISTINCT ?distribution, ?file, ?downloadUrl, ?format, ?byteSize WHERE {
    ?distribution databus:file ?file .
    ?distribution dct:hasVersion ?version .
    ?distribution dcat:byteSize ?byteSize .
    ?distribution databus:formatExtension ?format .
    ?distribution dcat:downloadURL ?downloadUrl .

  {
      SELECT (?v as ?version) { 
        ?dataset databus:artifact <https://dev.databus.dbpedia.org/kirikiki/test_group/test_artifact> . 
        ?dataset dct:hasVersion ?v . 
  } ORDER BY DESC (?version) LIMIT 1 
}
}
```

Retrieving download links for the latest version of an artifact:
```sparql
PREFIX dcat:   <http://www.w3.org/ns/dcat#>
PREFIX databus: <https://dataid.dbpedia.org/databus#>
PREFIX dct: <http://purl.org/dc/terms/>


SELECT ?file WHERE
{
    {
        SELECT ?v WHERE
        {
    	  ?latestVersion databus:artifact <your artifact ID> .
   	   	  ?latestVersion dct:hasVersion ?v .    
        } 
        ORDER BY DESC(STR(?v)) LIMIT 1
    }
  ?dataset dct:hasVersion ?v . 
  ?dataset dcat:distribution ?distribution .
  ?distribution dcat:downloadURL ?file .
    
}
```

#### Group/Artifact Metadata Example

In the minimal example metadata for the group is missing and the artifact is initialized with the metadata of the dataset. Both can be explicitly set for better documentation:

##### Group

```json
{
  "@id": "https://dev.databus.dbpedia.org/<your username>/test_group",
  "@type": "Group",
  "title": "Ontologies used in Project X" ,
  "abstract": "Collected ontologies to be used in Project X as dependencies for development.",
  "description": "Collected ontologies to be used in Project X as dependencies for development. The following work has beend done: \n1License was checked, all ontologies can be used in the project\n2. we created artifact using the original download location if the ontologies were ok, or we made a copy of a cleaned up version."
}
```

curl:

```shell
curl -X 'POST' \
  'https://dev.databus.dbpedia.org/api/publish?fetch-file-properties=true&log-level=info' \
  -H 'accept: application/json' \
  -H 'X-API-KEY: <your API key>' \
  -H 'Content-Type: application/ld+json' \
  -d '{
  "@context": "https://downloads.dbpedia.org/databus/context.jsonld",
  "@graph": [
    {
      "@id": "https://dev.databus.dbpedia.org/<your username>/test_group",
      "@type": "Group",
      "title": "Ontologies used in Project X" ,
      "abstract": "Collected ontologies to be used in Project X as dependencies for development.",
      "description": "Collected ontologies to be used in Project X as dependencies for development. The following work has beend done: \n1License was checked, all ontologies can be used in the project\n2. we created artifact using the original download location if the ontologies were ok, or we made a copy of a cleaned up version."
    }
  ]
}'
```

##### Artifact

```json
{
    "@id": "https://dev.databus.dbpedia.org/<your username>/test_group/test_artifact",
    "@type": "Artifact",
	"title": "The DBpedia Ontology" ,
	"abstract": "Versions of DBpedia ontologies for Project X",
	"description": "This description is different from the DBpedia Ontology Dataset description, so describe the overarching goal of the Artifact. Should be similar to the description of each Dataset."
}
```

curl:
```shell
curl -X 'POST' \
  'https://dev.databus.dbpedia.org/api/publish?fetch-file-properties=true&log-level=info' \
  -H 'accept: application/json' \
  -H 'X-API-KEY: <your API key>' \
  -H 'Content-Type: application/ld+json' \
  -d '{
  "@context": "https://downloads.dbpedia.org/databus/context.jsonld",
  "@graph": [
    {
    "@id": "https://dev.databus.dbpedia.org/<your username>/test_group/test_artifact",
    "@type": "Artifact",
	"title": "The DBpedia Ontology" ,
	"abstract": "Versions of DBpedia ontologies for Project X",
	"description": "This description is different from the DBpedia Ontology Dataset description, so describe the overarching goal of the Artifact. Should be similar to the description of each Dataset."
    }
  ]
}'
```

**NOTE**: As well as in the minimal example section the `abstract` can be inferred from the `description` field!


