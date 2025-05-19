# Quickstart Examples

This site describes the minimal required metadata for publishing a dataset (metadata) on the Databus and a few SPARQL queries for the first retrieving it. You can generate your own example inputs by using the publish wizard available at `${DATABUS_BASE_URL}/app/publish-wizard`. 

## Dataset Version Example

### Minimal Example in JSON-LD

> **Note**
> For a minimal submission to `${DATABUS_BASE_URL}/api/publish` the Databus requires only a few triples, while the rest is inferred. 



```json
{
  "@context": "https://dev.databus.dbpedia.org/res/context.jsonld",
  "@graph": [
    {
      "@type": [
        "Version",
        "Dataset"
      ],
      "@id": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology/2023-03-14",
      "title": "DBpedia Ontology",
      "description": "Registered a version of the DBpedia Ontology into my account. \n\nUsing markdown:\n1. This is the version used in [project x](http://example.org) as a stable snapshot dependency \n2. License was checked -> CC-BY",
      "license": "http://creativecommons.org/licenses/by/4.0/",
      "distribution": [
        {
          "@type": "Part",
          "downloadURL": "https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/dbpedia.org/ontology--DEV/2021.07.09-070001/ontology--DEV_type=parsed_sorted.nt",
          "dcv:type": "parsed",
          "dcv:sorted": "true"
        }
      ]
    }
  ]
}
```

If the Databus should NOT infer a certain metadatum (for example not auto-generating the `abtract` from the `description` field), it can be set explicitly and the Databus will accept it (if it fits its criteria). For a full list of inferrable properties check out the [autocompletion page](/docs/auto-completion.md)

#### Property Description

This gives a quick overview on what to put in for the different keys. In which exact triples the data will result can be seen in the [JSON-LD context](https://downloads.dbpedia.org/databus/context.jsonld).

| Key          | Value                                                                                                                                                                                                                                              | 
|--------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| @type        | The type of the graph. For the databus the types `Group`, `Artifact`, `Version`, `Dataset` and `Part` are permitted.                                                                                                                               |
| @id          | This represents the `id` (subject) of the triples. In the case of a `Dataset` this is the identifier consists of `${DATABUS_BASE_URL}/user/group/artifact/version`. What those are exactly can be see at the [model documentation](/docs/model.md) |
| title        | This is a short title for the Dataset                                                                                                                                                                                                              |
| description  | A longer description for the content of the dataset. Markdown syntax is supported.                                                                                                                                                                 |
| license      | The license of the dataset. Currently only one license as a URI is supported                                                                                                                                                                       |
| distribution | Contains a list of `Part`,  each representing a registered file.                                                                                                                                                                                   |
| downloadURL  | The location URL of the registered file.                                                                                                                                                                                                           |
| dcv:key      | Set a value for a given key to individually identify a file and notate properties of a file. Example `"dcv:type": "rawdata"`                                                                                                                       |

### SPARQL Queries

Example Query for retrieving all files, the format and their size from a certain dataset (by knowing group, artifact and version)

```sparql
PREFIX databus: <https://dataid.dbpedia.org/databus#>
PREFIX dct:    <http://purl.org/dc/terms/>
PREFIX dcat:   <http://www.w3.org/ns/dcat#>
PREFIX db:     <https://databus.dbpedia.org/>
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?file ?format ?byteSize WHERE {
  GRAPH ?g {
    ?dataset dataid:version <https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology/2023-03-14> .
    ?dataset dcat:distribution ?distribution .
    ?distribution databus:file ?file .
    ?distribution dataid:format ?format .
    ?distribution dataid:byteSize ?byteSize .
  }
}
```

Example Query for retrieving the same information for the latest version of an artifact:

```sparql
PREFIX databus: <https://dataid.dbpedia.org/databus#>
PREFIX dct:    <http://purl.org/dc/terms/>
PREFIX dcat:   <http://www.w3.org/ns/dcat#>
PREFIX db:     <https://databus.dbpedia.org/>
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?file ?format ?byteSize WHERE {
    ?dataset databus:artifact <https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology> .
    ?dataset dcat:distribution ?distribution .
    ?distribution dct:hasVersion ?version .
    ?distribution databus:file ?file .
    ?distribution dataid:format ?format .
    ?distribution dataid:byteSize ?byteSize .
    {
      SELECT (?v as ?version) { 
        ?dataset databus:artifact <https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology> . 
        ?dataset dct:hasVersion ?v . 
      } ORDER BY DESC (?version) LIMIT 1 
    }
}
```

## Group/Artifact Metadata Example

In the minimal example metadata for the group is missing and the artifact is initialized with the metadata of the dataset. Both can be explicitly set for better documentation:

### Group

```javascript
{
	"@context": "https://dev.databus.dbpedia.org/res/context.jsonld",
	"@id": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx",
	"@type": "Group",
	"title": "Ontologies used in Project X" ,
	"abstract": "Collected ontologies to be used in Project X as dependencies for development.",
	"description": "Collected ontologies to be used in Project X as dependencies for development. The following work has beend done: \n1License was checked, all ontologies can be used in the project\n2. we created artifact using the original download location if the ontologies were ok, or we made a copy of a cleaned up version."
}
```


### Artifact

```json
{
	"@context": "https://dev.databus.dbpedia.org/res/context.jsonld",
	"@id": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology",
	"@type": "Artifact",
	"title": "The DBpedia Ontology" ,
	"abstract": "Versions of DBpedia ontologies for Project X",
	"description": "This description is different from the DBpedia Ontology Dataset description, so describe the overarching goal of the Artifact. Should be similar to the description of each Dataset."
}
```

**NOTE**: As well as in the minimal example section the `abstract` can be inferred from the `description` field!
