# Quickstart Examples

Some examples to copy and adapt. Example SPARQL queries.

## Dataset Version Example

### Example in JSON-LD
```json
{
	"@context": "http://downloads.dbpedia.org/databus/context.jsonld",
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"@type": "dataid:Dataset",
	"title": "DBpedia Ontology",
	"abstract": "Registered a version of the DBpedia Ontology into my account",
	"description": "Registered a version of the DBpedia Ontology into my account. Using markdown:\n  1. This is the version used in [project x](http://example.org) as a stable snapshot dependency\n  2. License was checked -> CC-BY\n",
	"hasVersion": "2021-12-06",
	"license": "http://creativecommons.org/licenses/by/4.0/",
	"distribution": [
    {
      "@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
      "@type": "dataid:Part",
      "file": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06/ontology--DEV_type=parsed_sorted.nt",
      "format": "nt",
      "compression": "none",
      "downloadURL": "https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/dbpedia.org/ontology--DEV/2021.07.09-070001/ontology--DEV_type=parsed_sorted.nt",
      "byteSize": "4439722",
      "sha256sum": "b3aa40e4a832e69ebb97680421fbeff968305931dafdb069a8317ac120af0380",
      "dcv:type": "parsed_sorted"
    }
  ]
}

# Automatically inferred after post
	"group": "https://databus.dbpedia.org/janni/onto_dep_projectx",
	"artifact": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology",
	"version": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06",
	"publisher"
	"issued": "2021-12-06T11:34:17Z",
    "issued": "2021-12-06T11:34:17Z",
	"modified"
	additional types
```

### SUGGESTION Example

### Example in JSON-LD


```json
{
  "@context": "http://downloads.dbpedia.org/databus/context.jsonld",
	"@id": "https://databus.example.org/john/animals/cats/2022-02-02#Dataset",
	"@type": "dataid:Dataset",
	"title": "Cat Facts",
	"abstract": "A collection of facts about cats.",
	"description": "A collection of facts about cats. Contains data about cat species and specific famous cats.",
	"hasVersion": "2022-02-02",
	"license": "http://creativecommons.org/licenses/by/4.0/",
	"distribution": [
    {
      "@id": "https://databus.example.org/john/animals/cats/2022-02-02#cats_topic=species.nt",
      "@type": "dataid:Part",
      "file": "https://databus.example.org/john/animals/cats/2022-02-02/cats_topic=species.nt",
      "format": "nt",
      "compression": "none",
      "downloadURL": "https://storage.example.org/files/john/animals/cat_species.nt",
      "byteSize": "4439722",
      "sha256sum": "b3aa40e4a832e69ebb97680421fbeff968305931dafdb069a8317ac120af0380",
      "dcv:topic": "species"
    },
    {
      "@id": "https://databus.example.org/john/animals/cats/2022-02-02#cats_topic=famous.nt",
      "@type": "dataid:Part",
      "file": "https://databus.example.org/john/animals/cats/2022-02-02/cats_topic=famous.nt",
      "format": "nt",
      "compression": "none",
      "downloadURL": "https://storage.example.org/files/john/animals/famous_cats.nt",
      "byteSize": "4439722",
      "sha256sum": "b3aa40e4a832e69ebb97680421fbeff968305931dafdb069a8317ac120af0380",
      "dcv:topic": "famous"
    }
  ]
}
```


Example input after auto-completion

```json
[
  {
    "@context": "http://downloads.dbpedia.org/databus/context.jsonld",
    "@id": "https://databus.example.org/john/animals/cats/2022-02-02#Dataset",
    "@type": "dataid:Dataset",
    "title": "Cat Facts",
    "abstract": "A collection of facts about cats.",
    "description": "A collection of facts about cats. Contains data about cat species and specific famous cats.",
    "hasVersion": "2022-02-02",
    "license": "http://creativecommons.org/licenses/by/4.0/",
    "group": "https://databus.example.org/john/animals",
    "artifact": "https://databus.example.org/john/animals/cats",
    "version": "https://databus.example.org/john/animals/cats/2022-02-02",
    "publisher": "https://databus.example.org/john#this",
    "issued": "2022-02-02T11:34:17Z",
    "modified": "2022-02-02T11:34:17Z",
    "distribution": [
      {
        "@id": "https://databus.example.org/john/animals/cats/2022-02-02#cats_topic=species.nt",
        "@type": "dataid:Part",
        "file": "https://databus.example.org/john/animals/cats/2022-02-02/cats_topic=species.nt",
        "format": "nt",
        "compression": "none",
        "downloadURL": "https://storage.example.org/files/john/animals/cat_species.nt",
        "byteSize": "4439722",
        "sha256sum": "b3aa40e4a832e69ebb97680421fbeff968305931dafdb069a8317ac120af0380",
        "dcv:topic": "species",
        "hasVersion": "2022-02-02",
        "issued": "2022-02-02T11:34:17Z",
      },
      {
        "@id": "https://databus.example.org/john/animals/cats/2022-02-02#cats_topic=famous.nt",
        "@type": "dataid:Part",
        "file": "https://databus.example.org/john/animals/cats/2022-02-02/cats_topic=famous.nt",
        "format": "nt",
        "compression": "none",
        "downloadURL": "https://storage.example.org/files/john/animals/famous_cats.nt",
        "byteSize": "4439722",
        "sha256sum": "b3aa40e4a832e69ebb97680421fbeff968305931dafdb069a8317ac120af0380",
        "dcv:topic": "famous",
        "hasVersion": "2022-02-02",
        "issued": "2022-02-02T11:34:17Z",
      }
    ]
  },
  {
    "@id": "https://databus.example.org/john/animals/cats",
    "@type:": "dataid:Artifact"
  },
  {
    "@id": "https://databus.example.org/john/animals/cats/2022-02-02",
    "@type:": "dataid:Version"
  },
  {
    "@type": "rdf:Property",
    "@id": "http://dataid.dbpedia.org/ns/cv#topic",
    "rdfs:subPropertyOf": {
      "@id": "dataid:contentVariant"
    }
  }
]
```





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
    ?dataset dataid:version <https://databus.dbpedia.org/john/animals/cats/2022-02-02> .
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
    ?dataset dataid:artifact <https://databus.dbpedia.org/john/animals/cats> .
    ?dataset dcat:distribution ?distribution .
    ?distribution dct:hasVersion ?version .
    ?distribution dataid:file ?file .
    ?distribution dataid:format ?format .
    ?distribution dataid:byteSize ?byteSize .
    {
      SELECT (?v as ?version) { 
        ?dataset dataid:artifact <https://databus.dbpedia.org/john/animals/cats> . 
        ?dataset dct:hasVersion ?v . 
      } ORDER BY DESC (?version) LIMIT 1 
    }
}
```

## Group Example
```json
{
	"@context": "http://downloads.dbpedia.org/databus/context.jsonld",
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx",
	"@type": "Group",
	"title": "Ontologies used in Project X" ,
	"abstract": "Collected ontologies to be used in Project X as dependencies for development.",
	"description": "Collected ontologies to be used in Project X as dependencies for development. The following work has beend done: \n1License was checked, all ontologies can be used in the project\n2. we created artifact using the original download location if the ontologies were ok, or we made a copy of a cleaned up version."
}
```
