# Collection
*auto-generated from model/*.php via [pre-commit hook](https://github.com/dbpedia/databus/blob/master/model/README.md)*


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/collections/projectx-inputs",
	"@type": "Collection",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
databus:Collection a owl:Class ;
	rdfs:label "Databus Ceollection"@en ;
	rdfs:comment "A Databus Collection is a container owned by a Databus user that bundles Databus Artifacts intended to form a meaningful unit"@en ; 
	rdfs:subClassOf prov:Entity ;
	rdfs:isDefinedBy <https://dataid.dbpedia.org/databus#> . 


```
```turtle
<#collection-exists>
	a sh:NodeShape ;
	sh:targetNode databus:Collection ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	  sh:minCount 1 ;
	  sh:maxCount 1;
	  sh:message "Exactly one subject with an rdf:type of databus:Collection must occur."@en ;
	] ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	    sh:nodekind sh:IRI ;
      sh:pattern "/[a-zA-Z0-9\\-_]{4,}/collections/[a-zA-Z0-9\\-_\\.]{3,}$" ;
      sh:message "IRI for databus:Collection must match /[a-zA-Z0-9\\-_]{4,}/collections/[a-zA-Z0-9\\-_\\.]{3,}$"@en ;
	] .
```
```javascript
"Collection": "databus:Collection"
```



Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/collections/projectx-inputs",
	"title": "Latest Core Collection" ,
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
<#title-collection>
	a sh:NodeShape ;
	sh:targetClass databus:Collection ;
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
		sh:message "dct:title can be used with language tag, but each language only once."@en ;
		sh:uniqueLang true ;
	] . 
```




Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/collections/projectx-inputs",
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
<#abstract-collection>
	a sh:NodeShape ;
	sh:targetClass databus:Collection ;
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
	    sh:message "dct:abstract must have less than 300 characters and each language must occure only once. "@en ;
	    sh:uniqueLang true;
	    sh:maxLength 300 ;
	] . 
```


Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/collections/projectx-inputs",
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
<#description-collection>
	a sh:NodeShape ;
	sh:targetClass databus:Collection ;
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
		sh:message "dct:title can be used with language tag, but each language only once."@en ;
		sh:uniqueLang true ;
	] . 
```



Example (JSON-LD):
```javascript
{	
	"@id": "https://databus.dbpedia.org/janni/collections/projectx-inputs",
	"databusContent": "{ }",
}
```
Spec (OWL, SHACL, JSON-LD Context)
```turtle
databus:collectionContent
	rdfs:label "Description"@en ;
	rdfs:comment "An account of the resource."@en ;
	dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .
```
```turtle
<#collection-content>
	a sh:NodeShape ;
	sh:targetClass databus:Collection ;
	sh:property [
		sh:path databus:collectionContent ;
		sh:severity sh:Violation ;
		sh:message "A collection needs content."@en ;
        sh:qualifiedValueShape [ sh:datatype xsd:string ] ;
		sh:maxCount 1 ;	
		sh:minCount 1 ;			
    ] . 
```
```javascript
"databusContent": { "@id": "databus:databusContent" }
```


