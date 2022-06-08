# Group
**auto-generated from model/*.php via pre-commit hook. Edit in PHP in git and enable hook with `cd .git/hooks && ln -s ../../.githooks/pre-commit pre-commit`**


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx",
	"@type": "Group",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
dataid:Group a owl:Class ;
	rdfs:label "Databus Group"@en ;
	rdfs:comment "A Databus Group is a container owned by a Databus user that bundles Databus Artifacts intended to form a meaningful unit"@en ; 
	rdfs:subClassOf prov:Entity ; #TODO maybe add a Databus Structure Element class
	rdfs:isDefinedBy <http://dataid.dbpedia.org/ns/core#> . #TODO ontology ID


```
```turtle
<#group-exists>
	a sh:NodeShape ;
	sh:targetNode dataid:Group ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	  sh:minCount 1 ;
	  sh:maxCount 1;
	  sh:message "Exactly one subject with an rdf:type of dataid:Group must occur."@en ;
	] ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	    sh:nodekind sh:IRI ;
      sh:pattern "/[a-zA-Z0-9\\-_]{4,}/[a-zA-Z0-9\\-_\\.]{3,}$" ;
      sh:message "IRI for dataid:Group must match /USER/GROUP , |USER|>3"@en ;
	] .
```
```javascript
"Group": 	"dataid:Group",

"group": {
	"@id": "dataid:group",
	"@type": "@id"
	}
```


## title (Group)


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
<#title-group>
	a sh:NodeShape ;
	sh:targetClass dataid:Group ;
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
```javascript
"title": { "@id": "dct:title" }
```


## abstract (Group)


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
<#abstract-group>
	a sh:NodeShape ;
	sh:targetClass dataid:Group ;
	sh:property [
	    sh:path dct:abstract ;
	    sh:severity sh:Violation ;
	    sh:message "Required property dct:abstract MUST occur at least once without language tag."@en ;
	    sh:qualifiedValueShape [ sh:datatype xsd:string ] ;
		sh:qualifiedMinCount 1 ;
		sh:qualifiedMaxCount 1 ;	
	];
	sh:property [
		sh:path dct:abstract ;
	    sh:severity sh:Violation ;
	    sh:message "Besides the required occurance of dct:abstract without language tag, each occurance of dct:abstract must have less than 200 characters and each language must occure only once. "@en ;
	    sh:uniqueLang true;
	    sh:maxLength 200 ;
	] . 
```
```javascript
"abstract": { "@id": "dct:abstract" }
```


## description (Group)

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
<#description-group>
	a sh:NodeShape ;
	sh:targetClass dataid:Group ;
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
```javascript
"description": { "@id": "dct:description" }
```


