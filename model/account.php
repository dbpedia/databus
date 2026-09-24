#!/usr/bin/php
# Collection
<?php
error_reporting( E_ALL | E_STRICT );
require_once("function.php");
init();

?>

<?php

## Account SHACL and context

$section="account";

$sectionExampleURI="https://databus.dbpedia.org/janfo";

$owl='';

$shacl='<#person-exists>
	a sh:NodeShape ;
	sh:targetNode foaf:Person ; 
	sh:property [
		sh:path [ sh:inversePath rdf:type ] ;
		sh:minCount 1 ;
		sh:maxCount 1;
		sh:message "Exactly one subject with an rdf:type of foaf:Person must occur."@en ;
	] .

<#profile-exists>
	a sh:NodeShape ;
	sh:targetNode foaf:PersonalProfileDocument ; 
	sh:property [
		sh:path [ sh:inversePath rdf:type ] ;
		sh:minCount 1 ;
		sh:maxCount 1;
		sh:message "Exactly one subject with an rdf:type of foaf:PersonalProfileDocument must occur."@en ;
	] .

<#foaf-maker>   
  a sh:PropertyShape ;
  sh:targetClass foaf:PersonalProfileDocument ;
  sh:severity sh:Violation ;
  sh:message "Required property foaf:maker MUST occur exactly once in foaf:PersonalProfileDocument."@en ;
  sh:path foaf:maker ;
  sh:minCount 1 ;
  sh:maxCount 1 .


<#foaf-primary-topic>   
	a sh:PropertyShape ;
	sh:targetClass foaf:PersonalProfileDocument ;
	sh:severity sh:Violation ;
	sh:message "Required property foaf:primaryTopic MUST occur exactly once in foaf:PersonalProfileDocument."@en ;
	sh:path foaf:primaryTopic ;
	sh:minCount 1 ;
	sh:maxCount 1 .

<#foaf-primary-topic-target>   
	a sh:PropertyShape ;
	sh:targetClass foaf:PersonalProfileDocument ;
	sh:severity sh:Violation ;
	sh:message "Object of foaf:primaryTopic must be of type foaf:Person."@en ;
	sh:path foaf:primaryTopic ;
	sh:class foaf:Person .

<#foaf-account>   
	a sh:PropertyShape ;
	sh:targetClass foaf:Person ;
	sh:severity sh:Violation ;
	sh:message "Required property foaf:account MUST occur exactly once in foaf:Person and must target an IRI."@en ;
	sh:path foaf:account ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .

<#foaf-name>   
	a sh:PropertyShape ;
	sh:targetClass foaf:Person ;
	sh:severity sh:Violation ;
	sh:message "Required property foaf:name MUST be of type xsd:string and occur exactly once in foaf:Person."@en ;
	sh:path foaf:name ;
	sh:datatype xsd:string ;
	sh:minCount 1 ;
	sh:maxCount 1 .

<#foaf-img>   
	a sh:PropertyShape ;
	sh:targetClass foaf:Person ;
	sh:severity sh:Violation ;
	sh:message "Property foaf:img MUST be an IRI."@en ;
	sh:path foaf:img ;
	sh:nodeKind sh:IRI .

<#person-secretary>
	a sh:PropertyShape ;
	sh:targetClass foaf:Person ;
	sh:severity sh:Violation ;
	sh:message "databus:secretary must point at a databus:Secretary."@en ;
	sh:path databus:secretary ;
	sh:class databus:Secretary ;
	sh:nodeKind sh:BlankNodeOrIRI .

<#secretary-agent>
	a sh:PropertyShape ;
	sh:targetClass databus:Secretary ;
	sh:severity sh:Violation ;
	sh:message "databus:agent MUST occur exactly once on databus:Secretary and target an IRI."@en ;
	sh:path databus:agent ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .

<#secretary-write-access>
	a sh:PropertyShape ;
	sh:targetClass databus:Secretary ;
	sh:severity sh:Violation ;
	sh:message "databus:hasWriteAccessTo must target an IRI."@en ;
	sh:path databus:hasWriteAccessTo ;
	sh:nodeKind sh:IRI .';

$example='"@type": "Person",';

$context='"maker": {
    "@id": "foaf:maker",
    "@type": "@id"
  },
  "primaryTopic": {
    "@id": "foaf:primaryTopic",
    "@type": "@id"
  },
  "displayName": {"@id": "foaf:name"},
  "account": {
    "@id": "databus:account",
    "@type": "@id"
  },
  "img": {
    "@id": "foaf:img",
    "@type": "@id"
  },
  "secretary": {
    "@id": "databus:secretary",
    "@type": "@id"
  },
  "agent": {
    "@id": "databus:agent",
    "@type": "@id"
  },
  "hasWriteAccessTo": {
    "@id": "databus:hasWriteAccessTo",
    "@type": "@id"
  },
  "Secretary": "databus:Secretary",
"Person": "foaf:Person",
"PersonalProfileDocument": "foaf:PersonalProfileDocument",
"DBpedian": "dbo:DBpedian"';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>

