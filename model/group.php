#!/usr/bin/php
# Group
<?php
error_reporting( E_ALL | E_STRICT );
require_once("function.php");
init();

?>

<?php
$section="group";
$sectionExampleURI="https://databus.dbpedia.org/janni/onto_dep_projectx";
$owl=
'databus:Group a owl:Class ;
	rdfs:label "Databus Group"@en ;
	rdfs:comment "A Databus Group is a container owned by a Databus user that bundles Databus Artifacts intended to form a meaningful unit"@en ; 
	rdfs:subClassOf prov:Entity ; #TODO maybe add a Databus Structure Element class
	rdfs:isDefinedBy <http://dataid.dbpedia.org/databus#> . #TODO ontology ID

';

$shacl='<#group-exists>
	a sh:NodeShape ;
	sh:targetNode databus:Group ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	  sh:minCount 1 ;
	  sh:maxCount 1;
	  sh:message "Exactly one subject with an rdf:type of databus:Group must occur."@en ;
	] ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	    sh:nodekind sh:IRI ;
      sh:pattern "/[a-zA-Z0-9\\\\-_]{4,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}$" ;
      sh:message "IRI for databus:Group must match /[a-zA-Z0-9\\\\-_]{4,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}$"@en ;
	] .';

$example='"@type": "Group",';

$context='"Group": 	"databus:Group",

"group": {
	"@id": "databus:group",
	"@type": "@id"
	}';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## title (Group)

<?php
$owl='dct:title
	rdfs:label "Title"@en ;
	rdfs:comment "A name given to the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/title> .';

$shacl='<#title-group>
	a sh:NodeShape ;
	sh:targetClass databus:Group ;
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
	] . ';

$example='"title": "Ontologies used in Project X" ,';

$context='"title": { "@id": "dct:title" }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>



<?php

## abstract (Group)

$owl='dct:abstract
	rdfs:label "Abstract"@en ;
	rdfs:comment "A summary of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description>, dct:description .';

$shacl='<#abstract-group>
	a sh:NodeShape ;
	sh:targetClass databus:Group ;
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
	] . ';

$example='"abstract": "Collected ontologies to be used in Project X as dependencies for development.",';

$context='"abstract": { "@id": "dct:abstract" }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);

?>


## description (Group)
<?php
$owl='dct:description
	rdfs:label "Description"@en ;
	rdfs:comment "An account of the resource."@en ;
	dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .';

$shacl='<#description-group>
	a sh:NodeShape ;
	sh:targetClass databus:Group ;
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
	] . ';

$example='"description": "Collected ontologies to be used in Project X as dependencies for development. The following work has beend done: \n1License was checked, all ontologies can be used in the project\n2. we created artifact using the original download location if the ontologies were ok, or we made a copy of a cleaned up version.",';

$context='"description": { "@id": "dct:description" }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


<?php
//headerFooter($contextFile, $shaclDir);
?>
