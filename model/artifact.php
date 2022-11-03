#!/usr/bin/php
# Artifact
<?php
error_reporting( E_ALL | E_STRICT );
require_once("function.php");
init();

?>

<?php
$section="artifact";
$sectionExampleURI="https://databus.dbpedia.org/janni/onto_dep_projectx";
$owl=
'dataid:Artifact a owl:Class ;
	rdfs:label "Databus Artifact"@en ;
	rdfs:comment "A Databus Artifact is a logical dataset on the Databus"@en ; 
	rdfs:subClassOf prov:Entity ; #TODO maybe add a Databus Structure Element class
	rdfs:isDefinedBy <http://dataid.dbpedia.org/ns/core#> . #TODO ontology ID
';

$shacl='<#artifact-exists>
	a sh:NodeShape ;
	sh:targetNode dataid:Artifact ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	  sh:minCount 1 ;
	  sh:maxCount 1;
	  sh:message "Exactly one subject with an rdf:type of dataid:Artifact must occur."@en ;
	] ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	    sh:nodekind sh:IRI ;
      sh:pattern "/[a-zA-Z0-9\\\\-_]{4,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}$" ;
      sh:message "IRI for dataid:Artifact must match /[a-zA-Z0-9\\\\-_]{4,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}$"@en ;
	] .';

$example='"@type": "Artifact",';

$context='"Artifact": 	"dataid:Artifact",

"artifact": {
	"@id": "dataid:artifact",
	"@type": "@id"
	}';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## title (Artifact)

<?php
$owl='dct:title
	rdfs:label "Title"@en ;
	rdfs:comment "A name given to the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/title> .';

$shacl='<#title-artifact>
	a sh:NodeShape ;
	sh:targetClass dataid:Artifact ;
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
	] . ';

$example='"title": "Ontologies used in Project X" ,';

$context='"title": { "@id": "dct:title" }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## abstract (Artifact)

<?php
$owl='dct:abstract
	rdfs:label "Abstract"@en ;
	rdfs:comment "A summary of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description>, dct:description .';

$shacl='<#abstract-artifact>
	a sh:NodeShape ;
	sh:targetClass dataid:Artifact ;
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
	] . ';

$example='"abstract": "Collected ontologies to be used in Project X as dependencies for development.",';

$context='"abstract": { "@id": "dct:abstract" }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## description (Artifact)
<?php
$owl='dct:description
	rdfs:label "Description"@en ;
	rdfs:comment "An account of the resource."@en ;
	dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .';

$shacl='<#description-artifact>
	a sh:NodeShape ;
	sh:targetClass dataid:Artifact ;
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
	] . ';

$example='"description": "Collected ontologies to be used in Project X as dependencies for development. The following work has beend done: \n1License was checked, all ontologies can be used in the project\n2. we created artifact using the original download location if the ontologies were ok, or we made a copy of a cleaned up version.",';

$context='"description": { "@id": "dct:description" }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


<?php
//headerFooter($contextFile, $shaclDir);
?>
