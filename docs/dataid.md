# Dataset Version - the DataId
*auto-generated from model/*.php via [pre-commit hook](https://github.com/dbpedia/databus/blob/master/model/README.md)*
## Dataset

A specific version of a Databus artifact (artifacts = version-independent, abstract datasets). 
Please note that the fuzzy word `dataset` is disambiguated on the Databus, as it could mean:
1. artifact (see [here](https://dbpedia.gitbook.io/databus/model/model/artifact)): the abstract concept of a dataset (e.g. the DBpedia Label dataset, [https://databus.dbpedia.org/dbpedia/generic/labels/](https://databus.dbpedia.org/dbpedia/generic/labels/)).
2. **version (this page, see below)**: a specific version of a dataset (e.g. DBpedia Label dataset of Sep 1st, 2022, [https://databus.dbpedia.org/dbpedia/generic/labels/2022.09.01](https://databus.dbpedia.org/dbpedia/generic/labels/2022.09.01)).
3. distribution (see [here](https://dbpedia.gitbook.io/databus/model/model/distribution)): the bag of files of a specific version (e.g. the download location: [https://downloads.dbpedia.org/repo/dbpedia/generic/labels/2022.09.01/](https://downloads.dbpedia.org/repo/dbpedia/generic/labels/2022.09.01/))   




Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"@type": "dataid:Dataset",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
#copied from DataId ontology
dataid:Dataset
	a owl:Class ;
	rdfs:label "Databus Dataset"@en ;
	rdfs:comment "A collection of data, available for access in one or more formats. Dataset resources describe the concept of the dataset, not its manifestation (the data itself), which can be acquired as a Distribution"@en ; 
	rdfs:subClassOf void:Dataset, dcat:Dataset, prov:Entity ; 
	rdfs:isDefinedBy <http://dataid.dbpedia.org/ns/core#> . 

```
```turtle
<#dataset-exists>
	a sh:NodeShape ;
	sh:targetNode dataid:Dataset ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	  sh:minCount 1 ;
	  sh:maxCount 1 ;
	  sh:message "Exactly one subject with an rdf:type of dataid:Dataset must occur."@en ;
	] ;
	sh:property [
		sh:path [ sh:inversePath rdf:type ] ;
		  sh:nodekind sh:IRI ;
		sh:pattern "/[a-zA-Z0-9\\-_]{4,}/[a-zA-Z0-9\\-_\\.]{1,}/[a-zA-Z0-9\\-_\\.]{1,}/[a-zA-Z0-9\\-_\\.]{1,}#Dataset$" ;
		sh:message "IRI for dataid:Dataset must match /USER/GROUP/ARTIFACT/VERSION#Dataset , |USER|>3"@en ;
  ] . 
```
```javascript
"Dataset": 	"dataid:Dataset" 
```

## 1. General Metadata

### title

Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"title": "DBpedia Ontology",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dct:title
	rdfs:label "Title"@en ;
	rdfs:comment "A name given to the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/title> .
```
```turtle
<#title-dataid>
	a sh:NodeShape ;
	sh:targetClass dataid:Dataset ;
	sh:property [
		sh:path dct:title ;
		sh:severity sh:Violation ;
		sh:message "Required property dct:title MUST occur exactly once without language tag."@en ;
        sh:qualifiedValueShape [ sh:datatype xsd:string ] ;
		sh:qualifiedMinCount 1 ;
		sh:qualifiedMaxCount 1 ;		
    ] ;
        sh:property [
		sh:path dct:title ;
		sh:severity sh:Violation ;
		sh:message "Besides the required occurance of dct:title without language tag, dct:title can be used with language tag, but each language only once."@en ;
		sh:uniqueLang true ;
	] . 
```





### description

Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"description": "Registered a version of the DBpedia Ontology into my account. Using markdown:\n  1. This is the version used in [project x](http://example.org) as a stable snapshot dependency\n  2. License was checked -> CC-BY\n",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dct:description
	dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
	rdfs:comment "An account of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:label "Description"@en ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .
```
```turtle
<#description-dataid>
	a sh:NodeShape ;
    sh:targetClass dataid:Dataset ;
    sh:property [
		sh:path dct:description ;
		sh:severity sh:Violation ;
		sh:message "Required property dct:description MUST occur exactly once without language tag."@en ;
        sh:qualifiedValueShape [ sh:datatype xsd:string ] ;
		sh:qualifiedMinCount 1 ;
		sh:qualifiedMaxCount 1 ;		
    ] ;
        sh:property [
		sh:path dct:description ;
		sh:severity sh:Violation ;
		sh:message "Besides the required occurance of dct:description without language tag, dct:title can be used with language tag, but each language only once."@en ;
		sh:uniqueLang true ;
	] . 
```


### publisher


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"publisher": TODO
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dct:publisher
	dcam:rangeIncludes dct:Agent ;
	rdfs:comment "An entity responsible for making the resource available."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:label "Publisher"@en ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/publisher> .
```
```turtle
<#has-publisher>
	a sh:PropertyShape ;
  sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:publisher MUST occur exactly once and have URI/IRI as value"@en ;
	sh:path dct:publisher;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .
```
```javascript
"publisher": {
      "@id": "dct:publisher",
      "@type": "@id"
    }
```

## 2. Legal Metadata & Attribution

### license

Note:
* see roadmap above for planned changes
* must be an IRI
* license is set at the dataid:Dataset node, but is always valid for all distributions, which is also reflected by signing the tractacte.
* context.jsonld contains `"@context":{"@base": null },` to prevent creating local IRIs.


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"license": "http://creativecommons.org/licenses/by/4.0/",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dct:license
	rdfs:label "License"@en ;
	rdfs:comment "A legal document giving official permission to do something with the resource."@en ;
	dct:description "Recommended practice is to identify the license document with a URI. If this is not possible or feasible, a literal value that identifies the license may be provided."@en ;
	dcam:rangeIncludes dct:LicenseDocument ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/rights>, dct:rights .
```
```turtle
<#has-license>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:license MUST occur exactly once and have URI/IRI as value"@en ;
	sh:path dct:license;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .
```
```javascript
"license": {
      "@context":{"@base": null },
      "@id": "dct:license",
      "@type": "@id"
    }
```

### attribution


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"attribution": "TODO",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dataid:attribution a owl:DataTypeProperty; 
	rdfs:label "attribution"@en ;
	rdfs:comment "TODO"@en ;
	rdfs:domain dataid:Artifact, dataid:Dataset, dataid:Group ;
	rdfs:range xsd:string ;
	rdfs:isDefinedBy <http://dataid.dbpedia.org/ns/core#> . 
```
```turtle

```
```javascript
"attribution":	{"@id": "dataid:attribution"}
```

### wasDerivedFrom


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"wasDerivedFrom": "https://databus.dbpedia.org/dbpedia/generic/labels/2022.09.01",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
prov:wasDerivedFrom a owl:ObjectProperty ;
    rdfs:isDefinedBy <http://www.w3.org/ns/prov-o#> ;
    rdfs:label "wasDerivedFrom" ;
    prov:definition "A derivation is a transformation of an entity into another, an update of an entity resulting in a new one, or the construction of a new entity based on a pre-existing entity."@en ;
    rdfs:domain prov:Entity ;
    rdfs:range prov:Entity .

```
```turtle

```
```javascript
"wasDerivedFrom":	{
	"@id": "prov:wasDerivedFrom", 
	"@type": "@id"
}
```

## 3. Structural Metadata

`group`, `artifact`, `version`, `hasVersion` are the main properties used to structure all entries on the Databus for querying and retrieval. The most basic query here is to retrieve the latest version for each artifact in some group or to check, whether there is a new version available for one artifact.   


### group


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"group": "https://databus.dbpedia.org/janni/onto_dep_projectx",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dataid:group a owl:ObjectProperty; 
	rdfs:label "has parent Group"@en ;
	rdfs:comment "Defines the Databus Group a Databus Artifact belongs to"@en ;
	rdfs:domain dataid:Artifact ;
	rdfs:range dataid:Group ;
	rdfs:subPropertyOf dct:isPartOf ; 
	rdfs:isDefinedBy <http://dataid.dbpedia.org/ns/core#> . 

```
```turtle
<#has-group>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dataid:group MUST occur exactly once AND be of type IRI AND must match /USER/GROUP , |USER|>3"@en ;
	sh:path dataid:group ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI ;
  sh:pattern "/[a-zA-Z0-9\\-_]{4,}/[a-zA-Z0-9\\-_\\.]{1,}$" .

<#is-group-uri-correct>
	a sh:NodeShape;
	sh:targetClass dataid:Dataset ;
	sh:sparql [
		sh:message "Dataset URI must contain the group URI of the associated group." ;
		sh:prefixes dataid: ;
    sh:select """
			SELECT $this ?group
			WHERE {
				$this <http://dataid.dbpedia.org/ns/core#group> ?group .
        FILTER(!strstarts(str($this), str(?group)))
			}
			""" ;
	] .
```


### artifact 


autogenerated...
Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"artifact": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dataid:artifact a owl:ObjectProperty; 
	rdfs:label "has parent Artifact"@en ;
	rdfs:comment "Defines the Databus Artifact a Databus Dataset belongs to"@en ;
	rdfs:domain dataid:Dataset ;
	rdfs:range dataid:Artifact ;
	rdfs:subPropertyOf dct:isPartOf ; 
	rdfs:isDefinedBy <http://dataid.dbpedia.org/ns/core#> . 
```
```turtle
<#has-artifact>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dataid:artifact MUST occur exactly once AND be of type IRI AND must match /USER/GROUP/ARTIFACT , |USER|>3"@en ;
	sh:path dataid:artifact ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI  ;
  sh:pattern "/[a-zA-Z0-9\\-_]{4,}/[a-zA-Z0-9\\-_\\.]{1,}/[a-zA-Z0-9\\-_\\.]{1,}$" .

<#is-artifact-uri-correct>
	a sh:NodeShape;
	sh:targetClass dataid:Dataset ;
	sh:sparql [
		sh:message "Dataset URI must contain the artifact URI of the associated artifact." ;
		sh:prefixes dataid: ;
    sh:select """
			SELECT $this ?artifact
			WHERE {
				$this <http://dataid.dbpedia.org/ns/core#artifact> ?artifact .
        FILTER(!strstarts(str($this), str(?artifact)))
			}
			""" ;
	] .
```
```javascript
"artifact": {
      "@id": "dataid:artifact",
      "@type": "@id"
    }
```


### version


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"version": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
missing maybe obsolete
```
```turtle
<#has-version>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dataid:version MUST occur exactly once AND be of type IRI /USER/GROUP/ARTIFACT/VERSION , |USER|>3"@en ;
	sh:path dataid:version ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI  ;
  sh:pattern "/[a-zA-Z0-9\\-_]{4,}/[a-zA-Z0-9\\-_\\.]{1,}/[a-zA-Z0-9\\-_\\.]{1,}/[a-zA-Z0-9\\-_\\.]{1,}$" .

<#is-version-uri-correct>
	a sh:NodeShape;
	sh:targetClass dataid:Dataset ;
	sh:sparql [
		sh:message "Dataset URI must contain the version URI of the associated version." ;
		sh:prefixes dataid: ;
    sh:select """
			SELECT $this ?version
			WHERE {
				$this <http://dataid.dbpedia.org/ns/core#version> ?version .
        FILTER(!strstarts(str($this), str(?version)))
			}
			""" ;
	] .
```
```javascript
"version": {
      "@id": "dataid:version",
      "@type": "@id"
    }
```


### hasVersion

Note: see section versioning above


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"hasVersion": "2021-12-06",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dct:hasVersion
	dct:description "Changes in version imply substantive changes in content rather than differences in format. This property is intended to be used with non-literal values. This property is an inverse property of Is Version Of."@en ;
	rdfs:comment "A related resource that is a version, edition, or adaptation of the described resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:label "Has Version"@en ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/relation>, dct:relation .
```
```turtle
<#has-hasVersion-dataset>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:hasVersion MUST occur exactly once AND be of type Literal"@en ;
	sh:path dct:hasVersion ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:Literal .
```
```javascript
"hasVersion": 	{"@id": "dct:hasVersion"}
```

### distribution

Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"distribution": [{
          		"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt",
          		"@type": "dataid:Part",
          		"file": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06/ontology--DEV_type=parsed_sorted.nt",
          		"format": "nt",
          		"compression": "none",
          		"downloadURL": "https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/dbpedia.org/ontology--DEV/2021.07.09-070001/ontology--DEV_type=parsed_sorted.nt",
          		"byteSize": "4439722",
          		"sha256sum": "b3aa40e4a832e69ebb97680421fbeff968305931dafdb069a8317ac120af0380",
          		"hasVersion": "2021-12-06",
          		"dcv:type": "parsed_sorted"
              }]
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dcat:distribution
  a owl:ObjectProperty ;
  rdfs:label "distribution"@en ;
  rdfs:comment "An available distribution of the dataset."@en ;
  rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
  rdfs:domain dcat:Dataset ;
  rdfs:range dcat:Distribution ;
  rdfs:subPropertyOf dct:relation ;
  skos:definition "An available distribution of the dataset."@en .
```
```turtle
<#has-distribution>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dcat:distribution MUST occur at least once AND have URI/IRI as value"@en ;
	sh:path dcat:distribution;
	sh:minCount 1 ;
	sh:nodeKind sh:IRI .
```
```javascript
"distribution": {
      "@type": "@id",
      "@id": "dcat:distribution"
}
```

## 4. Other Metadata

### issued


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"issued": "2021-12-06T11:34:17Z",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dct:issued
	rdfs:label "Date Issued"@en ;
	rdfs:comment "Date of formal issuance of the resource."@en ;
	dct:description "Recommended practice is to describe the date, date/time, or period of time as recommended for the property Date, of which this is a subproperty."@en ;
	dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/date>, dct:date .
```
```turtle
<#has-issued>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:issued MUST occur exactly once AND have xsd:dateTime as value"@en ;
	sh:path dct:issued;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:dateTime .
```
```javascript
"issued": {
      "@id": "dct:issued",
      "@type": "xsd:dateTime"
    }
```

### modified

Note: dct:modified is *always* set by the Databus on post.


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"modified": "%NOW%",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dct:modified
	rdfs:label "Date Modified"@en ;
	rdfs:comment "Date on which the resource was changed."@en ;
	dct:description "Recommended practice is to describe the date, date/time, or period of time as recommended for the property Date, of which this is a subproperty."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/date>, dcterms:date .
```
```turtle
<#has-modified>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:modified MUST occur exactly once AND have xsd:dateTime as value"@en ;
	sh:path dct:modified;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:dateTime .
```
```javascript
"modified": {
      "@id": "dct:modified",
      "@type": "xsd:dateTime"
    }
```





### proof


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"proof": {
  "@type": "dataid:DatabusTractateV1",
  "signature": "d61a05ca4810367f361f17500304a168aab27a3119c93a18c00bce1775dfd6b1"
}
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
sec:proof a owl:ObjectProperty; 
	rdfs:label "has cryptographic proof"@en ;
	rdfs:comment "The proof property is used to associate a proof with a graph of information. The proof property is typically not included in the canonicalized graph that is then digested, and digitally signed."@en ;
	#rdfs:domain  ;
	#rdfs:range  ;
	rdfs:isDefinedBy <https://w3id.org/security#> . 

```
```turtle

```
```javascript
"signature":	{"@id": "sec:signature"},
"proof":	{"@id": "sec:proof"}
```
