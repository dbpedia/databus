# Artifact
*auto-generated from model/*.php via [pre-commit hook](https://github.com/dbpedia/databus/blob/master/model/README.md)*


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx",
	"@type": "Artifact",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
databus:Artifact a owl:Class ;
<<<<<<< HEAD
	rdfs:label "Databus Artifact"@en ;
	rdfs:comment "A Databus Artifact is a logical dataset on the Databus"@en ; 
	rdfs:subClassOf prov:Entity ; #TODO maybe add a Databus Structure Element class
	rdfs:isDefinedBy <https://dataid.dbpedia.org/databus#> . #TODO ontology ID
=======
     rdfs:label "Databus Artifact"@en ;
     rdfs:comment """A Databus Artifact represents a logical dataset in the DBpedia Databus platform, akin to the role that artifacts play in Maven. However, instead of software libraries, it encompasses datasets. Each artifact has an abstract identity, meaning it maintains a stable reference across different versions and variants of the dataset. The abstract identity facilitates tracking and retrieval of various versions of the dataset."""@en ;
     rdfs:subClassOf prov:Entity ;
     rdfs:isDefinedBy <http://dataid.dbpedia.org/databus#> .
>>>>>>> 02d9d804154d358937ab3388dfdb311dc8de61e0

```
```turtle
<#artifact-exists>
	a sh:NodeShape ;
	sh:targetNode databus:Artifact ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	  sh:minCount 1 ;
	  sh:maxCount 1;
	  sh:message "Exactly one subject with an rdf:type of databus:Artifact must occur."@en ;
	] ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	    sh:nodekind sh:IRI ;
      sh:pattern "/[a-zA-Z0-9\\-_]{4,}/[a-zA-Z0-9\\-_\\.]{3,}/[a-zA-Z0-9\\-_\\.]{3,}$" ;
      sh:message "IRI for databus:Artifact must match /[a-zA-Z0-9\\-_]{4,}/[a-zA-Z0-9\\-_\\.]{3,}/[a-zA-Z0-9\\-_\\.]{3,}$"@en ;
	] .
```
```javascript
"Artifact": 	"databus:Artifact",

"artifact": {
	"@id": "databus:artifact",
	"@type": "@id"
	}
```


## title (Artifact)


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx",
	"title": "Ontologies used in Project X" ,
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
<#title-artifact>
	a sh:NodeShape ;
	sh:targetClass databus:Artifact ;
	sh:property [
		sh:path dct:title ;
		sh:severity sh:Violation ;
		sh:message "Property dct:title MAY occur exactly once without language tag."@en ;
        sh:qualifiedValueShape [ sh:datatype xsd:string ] ;
		sh:qualifiedMaxCount 1 ;		
    ] ;
        sh:property [
		sh:path dct:title ;
		sh:severity sh:Violation ;
	    sh:maxLength 100 ;
		sh:message "dct:title must have less than 100 characters and each language must occure only once."@en ;
		sh:uniqueLang true ;
	] . 
```


## abstract (Artifact)


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx",
	"abstract": "Collected ontologies to be used in Project X as dependencies for development.",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dct:abstract
	rdfs:label "Abstract"@en ;
	rdfs:comment "A summary of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description>, dct:description .
```
```turtle
<#abstract-artifact>
	a sh:NodeShape ;
	sh:targetClass databus:Artifact ;
	sh:property [
	    sh:path dct:abstract ;
	    sh:severity sh:Violation ;
	    sh:message "Property dct:abstract MAY occur at least once without language tag."@en ;
	    sh:qualifiedValueShape [ sh:datatype xsd:string ] ;
		sh:qualifiedMaxCount 1 ;	
	];
	sh:property [
		sh:path dct:abstract ;
	    sh:severity sh:Violation ;
	    sh:message "dct:abstract must have less than 300 characters and each language must occure only once."@en ;
	    sh:uniqueLang true;
	    sh:maxLength 300 ;
	] . 
```


## description (Artifact)

Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx",
	"description": "Collected ontologies to be used in Project X as dependencies for development. The following work has beend done: \n1License was checked, all ontologies can be used in the project\n2. we created artifact using the original download location if the ontologies were ok, or we made a copy of a cleaned up version.",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dct:description
	rdfs:label "Description"@en ;
	rdfs:comment "An account of the resource."@en ;
	dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .
```
```turtle
<#description-artifact>
	a sh:NodeShape ;
	sh:targetClass databus:Artifact ;
	sh:property [
		sh:path dct:description ;
		sh:severity sh:Violation ;
		sh:message "Property dct:description MAY occur exactly once without language tag."@en ;
        sh:qualifiedValueShape [ sh:datatype xsd:string ] ;
		sh:qualifiedMaxCount 1 ;		
    ] ;
        sh:property [
		sh:path dct:description ;
		sh:severity sh:Violation ;
		sh:message "Each language of dct:description must occure only once."@en ;
		sh:uniqueLang true ;
	] . 
```


