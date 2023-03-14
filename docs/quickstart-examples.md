# Quickstart Examples

Some examples to copy and adapt. Example SPARQL queries.

## Dataset Version Example

### Minimal Example in JSON-LD

For a minimal submission the Databus requires only a few triples, while the rest is inferred:

```json
{
  "@context": "https://downloads.dbpedia.org/databus/context.jsonld",
  "@graph": [
    {
      "@type": [
        "Version",
        "Dataset"
      ],
      "@id": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology/2023-03-14",
      "hasVersion": "2023-03-14",
      "title": "DBpedia Ontology",
      "description": "Registered a version of the DBpedia Ontology into my account. \n\nUsing markdown:\n1. This is the version used in [project x](http://example.org) as a stable snapshot dependency \n2. License was checked -> CC-BY",
      "license": "http://creativecommons.org/licenses/by/4.0/",
      "distribution": [
        {
          "@type": "Part",
          "formatExtension": "nt",
          "compression": "none",
          "downloadURL": "https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/dbpedia.org/ontology--DEV/2021.07.09-070001/ontology--DEV_type=parsed_sorted.nt",
          "dcv:type": "parsed",
          "dcv:sorted": "true"
        }
      ]
    }
  ]
}
```

After the submission the Databus tries to infer the rest of the Metadata. Additionally, the Databus creates the superordinate identifier (group and artifact) if they are not yet existent. So the Databus expands the minimal metdata to :

#### Group

```json
{
  "@context": "https://downloads.dbpedia.org/databus/context.jsonld",
  "@id": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx",
  "@type": "Group",
  "title": "onto_dep_projectx"
}
```

#### Artifact

```json
{
  "@context": "https://downloads.dbpedia.org/databus/context.jsonld",
  "@graph": [
    {
      "@id": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology",
      "@type": "Artifact",
      "group": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx",
      "title": "DBpedia Ontology"
    },
    {
      "@id": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx",
      "@type": "Group"
    }
  ]
}
```

#### Version/Dataset

```json
{
  "@context": "https://downloads.dbpedia.org/databus/context.jsonld",
  "@graph": [
    {
      "@id": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology/2023-03-14",
      "@type": [
        "dataid:Version",
        "Dataset"
      ],
      "artifact": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology",
      "group": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx",
      "abstract": "Registered a version of the DBpedia Ontology into my account.",
      "description": "Registered a version of the DBpedia Ontology into my account. \n\nUsing markdown:\n1. This is the version used in [project x](http://example.org) as a stable snapshot dependency \n2. License was checked -> CC-BY",
      "hasVersion": "2023-03-14",
      "issued": "2023-03-14T15:35:55.754Z",
      "license": "http://creativecommons.org/licenses/by/4.0/",
      "modified": "2023-03-14T15:35:55.754Z",
      "publisher": "https://dev.databus.dbpedia.org/denis#this",
      "title": "DBpedia Ontology",
      "distribution": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology/2023-03-14#dbpedia-ontology_sorted=true_type=parsed.nt",
      "proof": {
        "@type": "dataid:DatabusTractateV1",
        "signature": {
          "@type": "xsd:string",
          "@value": "ptOX3+BRbjM4zNPFpaOt04pCCmR2MeWbrOsjssMWgYovEX6CZv4hnbqRt6H46I+ShVafL6gv9y0cRfcf5OlLIu63NKaLSvOoSchTjuh3Y12XWKwtThB9HLCHRNZWlPQZpsGH0ZNpgycrd64SpvUTViJPx9Wv5YLXDBrphxFr3Wzf4G4//XYF0E8EeBnMUqiTh8PazMX64lqotcLz8lFSvYI4M2fxZ3HNfxr22FYU6votpl689AGbOMht0a4abZuca8nVx0ztxwG9fKIl9680gJ1bXB5vnBubpJAFzhzbqBwJ3/D+brZkKXXKtDGV+f8m5gUMCzPE55m5vBK4EiQI+g=="
        }
      }
    },
    {
      "@id": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology/2023-03-14#dbpedia-ontology_sorted=true_type=parsed.nt",
      "@type": "Part",
      "compression": "none",
      "file": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology/2023-03-14/dbpedia-ontology_sorted=true_type=parsed.nt",
      "formatExtension": "nt",
      "sha256sum": "b3aa40e4a832e69ebb97680421fbeff968305931dafdb069a8317ac120af0380",
      "dcv:sorted": "true",
      "dcv:type": "parsed",
      "hasVersion": "2023-03-14",
      "issued": "2023-03-14T15:35:55.754Z",
      "modified": "2023-03-14T15:35:55.754Z",
      "byteSize": 4439722,
      "downloadURL": "https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/dbpedia.org/ontology--DEV/2021.07.09-070001/ontology--DEV_type=parsed_sorted.nt"
    },
    {
      "@id": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology",
      "@type": "Artifact"
    },
    {
      "@id": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx",
      "@type": "Group"
    },
    {
      "@id": "dcv:sorted",
      "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
      "subPropertyOf": "dataid:contentVariant"
    },
    {
      "@id": "dcv:type",
      "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
      "subPropertyOf": "dataid:contentVariant"
    }
  ]
}
```

If the Databus should NOT infer a certain metadatum (for example not auto-generating the `abtract` from the `description` field), it can be set explicitly and the Databus will accept it (if it fits its criteria).

### SPARQL Queries

Example Query for retrieving all files, the format and their size from a certain dataset (by knowing group, artifact and version)

```sparql
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX dct:    <http://purl.org/dc/terms/>
PREFIX dcat:   <http://www.w3.org/ns/dcat#>
PREFIX db:     <https://databus.dbpedia.org/>
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?file ?format ?byteSize WHERE {
  GRAPH ?g {
    ?dataset dataid:version <https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology/2023-03-14> .
    ?dataset dcat:distribution ?distribution .
    ?distribution dataid:file ?file .
    ?distribution dataid:format ?format .
    ?distribution dataid:byteSize ?byteSize .
  }
}
```

Example Query for retrieving the same information for the latest version of an artifact:

```sparql
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX dct:    <http://purl.org/dc/terms/>
PREFIX dcat:   <http://www.w3.org/ns/dcat#>
PREFIX db:     <https://databus.dbpedia.org/>
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?file ?format ?byteSize WHERE {
    ?dataset dataid:artifact <https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology> .
    ?dataset dcat:distribution ?distribution .
    ?distribution dct:hasVersion ?version .
    ?distribution dataid:file ?file .
    ?distribution dataid:format ?format .
    ?distribution dataid:byteSize ?byteSize .
    {
      SELECT (?v as ?version) { 
        ?dataset dataid:artifact <https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology> . 
        ?dataset dct:hasVersion ?v . 
      } ORDER BY DESC (?version) LIMIT 1 
    }
}
```

## Group/Artifact Metadata Example

In the minimal example metadata for the group is missing and the artifact is initialized with the metadata of the dataset. Both can be explicitly set for better documentation:

### Group

```json
{
	"@context": "http://downloads.dbpedia.org/databus/context.jsonld",
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
	"@context": "http://downloads.dbpedia.org/databus/context.jsonld",
	"@id": "https://dev.databus.dbpedia.org/denis/onto_dep_projectx/dbpedia-ontology",
	"@type": "Artifact",
	"title": "The DBpedia Ontology" ,
	"abstract": "Versions of DBpedia ontologies for Project X",
	"description": "This description is different from the DBpedia Ontology Dataset description, so describe the overarching goal of the Artifact. Should be similar to the description of each Dataset."
}
```

**NOTE**: As well as in the minimal example section the `abstract` can be inferred from the `description` field!
