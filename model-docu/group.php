#!/usr/bin/php
# Group
<?php
/*
# Usage:
sudo apt install php7.4-cli
php model.php > model.md

RECOMMENDED if context or shacl was changed
cat generated/context.json | jq
cd generated/shacl/
for i in `ls *.shacl` ; do rapper -gc $i  ; done

Goal:
* php script is a template to fill a markdown doc (stdout)
* also generates context, shacl (these are the Single Source of Truth SSoT files)
* OWL should be taken from dataid, dct, dcat, etc. SSoT is elsewhere

Success criteria:
* context.json, shacl have a correct syntax.
* model.md renders well and looks pretty and serves as good docu
* model.md can be viewed at github and might be converted to HTML and shipped with the bus later

*/

error_reporting( E_ALL | E_STRICT );
require_once("function.php");
init();

?>

<?php
$section="group";
$sectionExampleURI="https://databus.dbpedia.org/janni/onto_dep_projectx";
$owl='missing';

$shacl='<#group-exists>
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
      sh:pattern "/[a-zA-Z0-9]{4,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}$" ;
      sh:message "IRI for dataid:Group must match /USER/GROUP , |USER|>3"@en ;
	] .';

$example='"@type": "Group",';

$context='"Group": 	"dataid:Group",

"group": {
	"@id": "dataid:group",
	"@type": "@id"
	}';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


### title (Group)

<?php
$owl='dct:title
	rdfs:label "Title"@en ;
	rdfs:comment "A name given to the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/title> .';

$shacl='<#title-group>
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
	] . ';

$example='"title": "Ontologies used in Project X" ,';

$context='"title": 		{ "@id": "dct:title", "@language" : "en" }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


### abstract (Group)

<?php
$owl='dct:abstract
	rdfs:label "Abstract"@en ;
	rdfs:comment "A summary of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description>, dct:description .';

$shacl='<#abstract-group>
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
	] . ';

$example='"abstract": "Collected ontologies to be used in Project X as dependencies for development.",';

$context='"abstract": 	{ "@id": "dct:abstract", "@language" : "en" }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


### description (Group)
<?php
$owl='dct:description
	rdfs:label "Description"@en ;
	rdfs:comment "An account of the resource."@en ;
	dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .';

$shacl='<#description-group>
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
	] . ';

$example='"description": "Collected ontologies to be used in Project X as dependencies for development. The following work has beend done: \n1License was checked, all ontologies can be used in the project\n2. we created artifact using the original download location if the ontologies were ok, or we made a copy of a cleaned up version.",';

$context='"description": 	{ "@id": "dct:description", "@language" : "en" }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


<?php
//headerFooter($contextFile, $shaclDir);
?>
