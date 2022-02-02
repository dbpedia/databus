# Distribution (Part)

**auto-generated from model/*.php via pre-commit hook. Edit in PHP in git and enable hook with `cd .git/hooks && ln -s ../../.githooks/pre-commit pre-commit`**


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
	"@type": "Part",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dcat:Distribution
	a owl:Class ;
	rdfs:label "Distribution"@en ;
	rdfs:comment "A specific representation of a dataset. A dataset might be available in multiple serializations that may differ in various ways, including natural language, media-type or format, schematic organization, temporal and spatial resolution, level of detail or profiles (which might specify any or all of the above)."@en ;
	rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
	skos:definition "A specific representation of a dataset. A dataset might be available in multiple serializations that may differ in various ways, including natural language, media-type or format, schematic organization, temporal and spatial resolution, level of detail or profiles (which might specify any or all of the above)."@en ;
	skos:scopeNote "This represents a general availability of a dataset it implies no information about the actual access method of the data, i.e. whether by direct download, API, or through a Web page. The use of dcat:downloadURL property indicates directly downloadable distributions."@en ;
```
```turtle
<#part-exists>
	a sh:NodeShape ;
	sh:targetNode dataid:Part ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	  sh:minCount 1 ;
	  sh:message "At least one subject with an rdf:type of dataid:Part must occur for each dataid:Dataset."@en ;
	] ;
	sh:property [
    sh:path [ sh:inversePath rdf:type ] ;
    sh:nodekind sh:IRI ;
    sh:pattern "/[a-zA-Z0-9]{4,}/[a-zA-Z0-9\\-_\\.]{3,}/[a-zA-Z0-9\\-_\\.]{3,}/[a-zA-Z0-9\\-_\\.]{3,}#[a-zA-Z0-9\\-_\\.=]{3,}(?<!#Dataset)$" ;
    sh:message "IRI for dataid:Part must match /USER/GROUP/ARTIFACT/VERSION#PART , |USER|>3, PART != \"Dataset\""@en ;
    ] . 
```
```javascript
"Part": 	"dataid:Part" 
```



## issued 

Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
	"issued": "%NOW%",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dct:issued
	rdfs:label "Date Issued"@en ;
	rdfs:comment "Date of formal issuance of the resource."@en ;
	dct:description "Recommended practice is to describe the date, date/time, or period of time as recommended for the property Date, of which this is a subproperty."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/date>, dct:date .
```
```turtle
<#has-issued>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:issued MUST occur exactly once AND have xsd:dateTime as value"@en ;
	sh:path dct:issued;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:dateTime .
```


## file


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
	"file": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%/ontology--DEV_type=parsed_sorted.nt",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
missing
```
```turtle
<#has-file>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "A dataid:Part MUST have exactly one dataid:file of type IRI"@en ;
	sh:path dataid:file;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .

```
```javascript
"file": {
      "@id": "dataid:file",
      "@type": "@id"
    }
```

## format


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
	"format": "nt",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
missing
```
```turtle
<#has-format>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:path dataid:format ;
	sh:message "A dataid:Part MUST have exactly one dataid:format of type xsd:string AND should not inlcude a '.' in front"@en ; 
	sh:pattern "^[a-z0-9]{1,8}$" ;
	sh:datatype xsd:string ;
	sh:maxCount 1 ;
	sh:minCount 1 .
```
```javascript
"format":		{"@id": "dataid:format"}
```


## formatExtension

TODO Marvin: describe why formatExtension is practical
TODO Jan: add sh:pattern, i.e. no point at beginning, also must match the end of file URI



Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
	"formatExtension": "nt",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
missing
```
```turtle
<#has-formatExtension>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "Required property dataid:formatExtension MUST occur exactly once AND have xsd:string as value"@en ;
	sh:path dataid:formatExtension;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:string .
```
```javascript
"formatExtension": 	{"@id": "dataid:formatExtension"}
```


## compression


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
	"compression": "none",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
missing
```
```turtle
<#has-compression>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message """Required property dataid:compression MUST occur exactly once AND have xsd:string as value AND should not inlcude a '.' in front """@en ;
	sh:pattern "^[a-z0-9]{1,8}$" ;
	sh:path dataid:compression;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:string .
```
```javascript
"compression": 	{"@id": "dataid:compression"}
```


## downloadURL

Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
	"downloadURL": "https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/dbpedia.org/ontology--DEV/2021.07.09-070001/ontology--DEV_type=parsed_sorted.nt",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dcat:downloadURL
	a owl:ObjectProperty ;
	rdfs:label "download URL"@en ;
	rdfs:comment "The URL of the downloadable file in a given format. E.g. CSV file or RDF file. The format is indicated by the distribution's dct:format and/or dcat:mediaType."@en ;
	rdfs:domain dcat:Distribution ;
	rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
	skos:definition "The URL of the downloadable file in a given format. E.g. CSV file or RDF file. The format is indicated by the distribution's dct:format and/or dcat:mediaType."@en ;
```
```turtle
<#has-downloadURL>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "A dataid:Part MUST have exactly one dcat:downloadURL of type IRI"@en ;
	sh:path dcat:downloadURL ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .

```
```javascript
"downloadURL": {
      "@id": "dcat:downloadURL",
      "@type": "@id"
    }
```


## bytesize

Note: Determining byteSize is not trivial for two reasons:
1. intuitively, one would think that bytesize is a clearly determinable value, but different functions (e.g. for different programming language) return different bytesizes and are only comparable in the same system.
2. More often than expected determining bytesize fails, e.g. disk read problem, network problems or file corruption.

We are reusing `dcat:byteSize` here, which uses `xsd:decimal`. However, we do not deem this ideal and would rather opt to `xsd:double` as it supports the `NaN` value. So in any case, where bytesize calculation fails, please put 0.


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
	"byteSize": "4439722",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
# excerpt from https://www.w3.org/ns/dcat2.ttl
dcat:byteSize
	a owl:DatatypeProperty ;
	rdfs:label "byte size"@en ;
	rdfs:comment "The size of a distribution in bytes."@en ;
	rdfs:domain dcat:Distribution ;
	rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
	rdfs:range rdfs:Literal ;
	skos:definition "The size of a distribution in bytes."@en ;
	skos:scopeNote "The size in bytes can be approximated when the precise size is not known. The literal value of dcat:byteSize should by typed as xsd:decimal."@en ;
```
```turtle
<#has-bytesize>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "A dataid:Part MUST have exactly one dct:byteSize of type xsd:decimal"@en ;
	sh:path dcat:byteSize ;
	sh:datatype xsd:decimal ;
	sh:maxCount 1 ;
	sh:minCount 1 .  
```
```javascript
"byteSize": {
    "@id": "dcat:byteSize",
    "@type": "xsd:decimal"
  }
```


## sha256sum


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
	"sha256sum": "b3aa40e4a832e69ebb97680421fbeff968305931dafdb069a8317ac120af0380",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
missing
```
```turtle
<#has-sha256sum>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "Required property dataid:sha256sum MUST occur exactly once AND have xsd:string as value AND match pattern ^[a-f0-9]{64}$"@en ;
	sh:path dataid:sha256sum;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:string ;
	#   dataid:sha256sum         "49b0f2dd5bb6c1dcdbbb935dbc4463218d570b4b4499da081e07a2d52c60ceab"^^xsd:string ;
	sh:pattern "^[a-f0-9]{64}$" .
```
```javascript
"sha256sum": 		{"@id": "dataid:sha256sum"}
```

## hasVersion (Distribution)

Note: see section versioning above


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
	"hasVersion": "%VERSION%",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dct:hasVersion
	rdfs:label "Has Version"@en ;
	rdfs:comment "A related resource that is a version, edition, or adaptation of the described resource."@en ;
	dct:description "Changes in version imply substantive changes in content rather than differences in format. This property is intended to be used with non-literal values. This property is an inverse property of Is Version Of."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/relation>, dct:relation .
```
```turtle
<#has-hasVersion-part>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:hasVersion MUST occur exactly once AND be of type Literal"@en ;
	sh:path dct:hasVersion ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:Literal .
```

## signature/tractate
TODO ??

```
<#signature-violation>
#   dataid:signature         "dg6U+QmLt/WJvcb2yQApkAD5vanzNE1fBxvCwB87+G/XgsOpeDm3jDAEnCA43uWyw3A+sVKXfOvYFGfh7LPrJRIcZTlaqpXZ9UU1TmunCFrtvh+TZ+T0eMwOxzWfQ7eLAdZJlV5IDMNZZwNi9u6ukiF8ciSJjpRSHWDYD11NT79Q9sKMmVFosfoo8GEa9aM43BzqNDew/aoRMW6xlvAGKO4rbmbbONroeYLSeTApakF5SwgEQ8pcjvAZf7UoNNTlOFjklUiJIoVlhaUiuatptxa/aGK499Ja/sQqordPgJfOIa+pRhAXIBYZvXRGPxpi8lwHCU8oXSzSArArWIPyMg=="^^xsd:string ;
    a sh:PropertyShape ;
    sh:severity sh:Violation ;
    sh:message " TODO Optional property dataid:signature MUST occur 0 or 1 time AND have xsd:string as value AND match pattern"@en ;
    sh:path dataid:signature;
    sh:maxCount 1 ;
    sh:datatype xsd:string ;
    sh:pattern "^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$" .

```



##  Content variants
TODO ??


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
	missing
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
missing
```
```turtle
<#properties-are-cvs>
	a sh:PropertyShape ;
	sh:targetClass rdf:Property ;
	sh:path rdfs:subPropertyOf ;
	sh:hasValue dataid:contentVariant ;
	sh:message "All rdf:Properties MUST be an rdfs:subPropertyOf dataid:contentVariant."@en .

<#cvs-are-complete>
	a sh:NodeShape;
	sh:targetClass dataid:Dataset ;
	sh:sparql [
		sh:message "All used sub-properties of dataid:contentVariant MUST be used by all dataid:Parts." ;
    sh:select """
      SELECT ?this ?bindingCount ?distCount ?propCount
      {
        {
          SELECT ?this (COUNT(?cvProperty) AS ?bindingCount) {
            ?this a  <http://dataid.dbpedia.org/ns/core#Dataset> .
            ?this <http://www.w3.org/ns/dcat#distribution> ?dist .
            ?cvProperty <http://www.w3.org/2000/01/rdf-schema#subPropertyOf> <http://dataid.dbpedia.org/ns/core#contentVariant> .
            ?dist ?cvProperty ?cvValue
          } GROUP BY ?this
        }
        {
          SELECT ?this (COUNT(DISTINCT ?cvProperty) AS ?propCount) {
            ?this <http://www.w3.org/ns/dcat#distribution> ?dist .
            ?cvProperty <http://www.w3.org/2000/01/rdf-schema#subPropertyOf> <http://dataid.dbpedia.org/ns/core#contentVariant> .
            ?dist ?cvProperty ?cvValue .
          } GROUP BY ?this
        }
        {
          SELECT ?this (COUNT(DISTINCT ?dist) AS ?distCount) {
            ?this a  <http://dataid.dbpedia.org/ns/core#Dataset> .
            ?this <http://www.w3.org/ns/dcat#distribution> ?dist .
          } GROUP BY ?this
        }
      
        FILTER((?distCount * ?propCount) != ?bindingCount)
      }
			""" ;
	] .

<#parts-are-distinguishable-by-cv>
	a sh:NodeShape;
	sh:targetClass dataid:Dataset ;
	sh:sparql [
		sh:message "All dataid:Parts MUST be distinguishable by either format, compression OR at least one content variant dimension." ;
    sh:select """
      SELECT ?this ?distinguishableDistCount ?distCount WHERE
      {
        {
          SELECT ?this (COUNT(DISTINCT ?cvString) AS ?distinguishableDistCount) WHERE {
            ?this a  <http://dataid.dbpedia.org/ns/core#Dataset> .
            ?this <http://www.w3.org/ns/dcat#distribution> ?dist .
            {
              SELECT ?dist (CONCAT(STR(?format), ",", STR(?compression), ",", (GROUP_CONCAT(DISTINCT ?cvTuple; SEPARATOR=","))) AS ?cvString) WHERE {
                ?dist a <http://dataid.dbpedia.org/ns/core#Part> .
                ?dist ?cvProperty ?cvValue .
                ?dist <http://dataid.dbpedia.org/ns/core#format> ?format .
                ?dist <http://dataid.dbpedia.org/ns/core#compression> ?compression .
                ?cvProperty <http://www.w3.org/2000/01/rdf-schema#subPropertyOf> <http://dataid.dbpedia.org/ns/core#contentVariant> .
                BIND (CONCAT(STR(?cvProperty),"=",STR(?cvValue)) AS ?cvTuple)
              } GROUP BY ?dist ?format ?compression
            }
          } GROUP BY ?this
        }
        {
          SELECT ?this (COUNT(DISTINCT ?dist) AS ?distCount) WHERE {
            ?this a  <http://dataid.dbpedia.org/ns/core#Dataset> .
            ?this <http://www.w3.org/ns/dcat#distribution> ?dist .
          } GROUP BY ?this
        }
        FILTER(?distCount != ?distinguishableDistCount)
      }
			""" ;
	] .

```
```javascript
"subPropertyOf" : {
    "@id" : "rdfs:subPropertyOf",
    "@type" : "@id"
  }
```

## Remaining JSON-LD
TODO ??


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
	missing
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
missing
```
```turtle
missing
```
```javascript
"maker": {
    "@id": "foaf:maker",
    "@type": "@id"
  },
  "primaryTopic": {
    "@id": "foaf:primaryTopic",
    "@type": "@id"
  },
  "name": {"@id": "foaf:name"},
  "account": {
    "@id": "foaf:account",
    "@type": "@id"
  },
  "img": {
    "@id": "foaf:img",
    "@type": "@id"
  },
  "key": 	{"@id": "cert:key"},
  "modulus":	{"@id": "cert:modulus"},
  "exponent":	{"@id": "cert:exponent"},
  "signature":	{"@id": "sec:signature"},
  "proof":	{"@id": "sec:proof"}
```

