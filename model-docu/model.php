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

$contextFile="generated/context.json";
$markDownFile="model.md";
$shaclDir="generated/shacl";
$examplesDir="generated/examples";

init();

?>

TODO Design decisions:
*  language tag vs. xsd:string vs. nothing in title,abstract,description https://github.com/dbpedia/databus/issues/6
* impose a limit on dct:abstract? 200 chars? https://github.com/dbpedia/databus/issues/7



# Databus Model

Databus runs on an RDF model made from DCAT, DCT and DataId properties. Additional SHACL constraints are imposed to guarantee clean metadata. The default format we are propagating is JSON-LD, however, other RDF serializations are also working. 

## URI Design
TODO Jan: 
explain URIs

## Structure 
TODO Sebastian:
Group, Artifact, Version, CVS

## Versioning
TODO Denis: 
explain alphanumeric order and give an example query and also give some patterns (e.g. day vs. datetime as in Archivo vs. using version numbers 01.01.10 )

## Timestamping
* if dct:issue is given on post, this will be used
* if not, then Databus inserts %now%
* dct:modified is always set by Databus

## Customization, Mods, Metadata Quality
TODO Marvin:
Databus can be customized, by changing shacl, the webid and posting additional data. Please give some best practices, when to use this customization mechanism and when to use mods. I think, that if people have metadata that can not generated from the file and is available to poster, then that could be included, e.g. if they have own identifiers. 



## Roadmap - planned changes
* license can be any URI at the moment, however, these URIs are not validated and in most cases they are not proper [linked data](https://www.w3.org/DesignIssues/LinkedData.html), i.e. they violate rule 3, do not resolve properly and do not provide usefull information. We plan to intensify collaboration with dalicc.net and implement mappings and more stricter checks.  

## Quickstart Examples

Some examples to copy and adapt. 

### Dataset Version

```json
{
	"@context": "http://downloads.dbpedia.org/databus/context.jsonld",
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset",
	"@type": "dataid:Dataset",
	"title": "DBpedia Ontology",
	"abstract": "Registered a version of the DBpedia Ontology into my account",
	"description": "Registered a version of the DBpedia Ontology into my account. Using markdown:
  1. This is the version used in [project x](http://example.org) as a stable snapshot dependency
  2. License was checked -> CC-BY
",
	"publisher": "https://databus.dbpedia.org/janni#this",
	"version": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06",
	"hasVersion": "2021-12-06",
	"license": "http://creativecommons.org/licenses/by/4.0/",
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

# Automatically inferred after post
	"group": "https://databus.dbpedia.org/janni/onto_dep_projectx",
	"artifact": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology",
	"publisher"
	"issued": "2021-12-06T11:34:17Z",
    "issued": "2021-12-06T11:34:17Z",
	"modified"
	additional types
```

### Group
```json
{
	"@context": "http://downloads.dbpedia.org/databus/context.jsonld",
	"@id": "https://databus.dbpedia.org/janni/onto_dep_projectx",
	"@type": "Group",
	"title": "Ontologies used in Project X" ,
	"abstract": "Collected ontologies to be used in Project X as dependencies for development.",
	"description": "Collected ontologies to be used in Project X as dependencies for development. The following work has beend done: \n1License was checked, all ontologies can be used in the project\n2. we created artifact using the original download location if the ontologies were ok, or we made a copy of a cleaned up version."

# Automatically inferred after post
language tags

}
```

## Group 

TODO Jan:
* check sh:pattern in SHACL

<?php 
$section="group"; 
$id="group" ;
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
      sh:pattern "/[a-zA-Z0-9]{4,}/[a-zA-Z0-9]{1,}$" ;
      sh:message "IRI for dataid:Group must match /USER/GROUP , |USER|>3"@en ;
	] .';

$example='"@id": "https://databus.dbpedia.org/janni/examples",
"@type": "dataid:Group",';

$context='"Group": "dataid:Group",

"group": {
	"@id": "dataid:group",
	"@type": "@id"
	}';

table($section,$owl,$shacl,$example,$context);
?>


### title (Group)

<?php
$owl='dct:title
	rdfs:label "Title"@en ;
	rdfs:comment "A name given to the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/title> .';

$shacl='<#en-title-group>
	a sh:PropertyShape ;
	sh:targetClass dataid:Group ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:title MUST occur at least once AND have one @en. Each language MUST only occur once "@en ;
	sh:path dct:title ;
	sh:minCount 1 ;
	sh:languageIn ("en") ;
	sh:uniqueLang true .';

$example='"title": "Example Group" ,';

$context='"title": {
    "@id": "dct:title",
    "@language": "en"
  }';

table($section,$owl,$shacl,$example,$context);
?>


### abstract (Group)

<?php
$owl='dct:abstract
	rdfs:label "Abstract"@en ;
	rdfs:comment "A summary of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description>, dct:description .';

$shacl='<#en-abstract-group>
	a sh:PropertyShape ;
	sh:targetClass dataid:Group ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:abstract MUST occur at least once AND have one @en "@en ;
	sh:path dct:abstract ;
	sh:minCount 1 ;
	sh:languageIn ("en") ;
	sh:uniqueLang true .';

$example='"abstract": "TODO",';

$context='"abstract": {
      "@id": "dct:abstract",
      "@language": "en"
    }';

table($section,$owl,$shacl,$example,$context);
?>


### description (Group)
<?php
$owl='dct:description
	rdfs:label "Description"@en ;
	rdfs:comment "An account of the resource."@en ;
	dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .';

$shacl='<#en-description-group>
	a sh:PropertyShape ;
	sh:targetClass dataid:Group ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:description MUST occur at least once AND have one @en "@en ;
	sh:path dct:description ;
	sh:minCount 1 ;
	sh:languageIn ("en") ;
	sh:uniqueLang true .';

$example='"description": "This is an example group for API testing.",';

$context='"description": {
      "@id": "dct:description",
      "@language": "en"
    }';

table($section,$owl,$shacl,$example,$context);
?>


## Dataset Version - the DataId

TODO check sh:pattern in shacl

<?php 
$section="dataid" ;
$owl='missing';

$shacl='<#dataset-exists>
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
      sh:pattern "/[a-zA-Z0-9]{4,}/[a-zA-Z0-9]{1,}/[a-zA-Z0-9]{1,}$" ;
      sh:message "IRI for dataid:Group must match /USER/GROUP/VERSION , |USER|>3"@en ;
    ] . ';
    
  

$example='"@id": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%#Dataset",
"@type": "Dataset",';

$context='"Dataset": "dataid:Dataset" ';

table($section,$owl,$shacl,$example,$context);
?>


### title
<?php
$owl='dct:title
	rdfs:label "Title"@en ;
	rdfs:comment "A name given to the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/title> .';

$shacl='<#has-title-dataid>
	a sh:PropertyShape ;
    sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:title MUST occur at least once AND have one @en " ;
	sh:path dct:title ;
	sh:minCount 1 ;
	sh:languageIn ("en") ;
	sh:uniqueLang true .';

$example='"title": "DBpedia Ontology Example",';

$context='duplicate';

table($section,$owl,$shacl,$example,$context);
?>


### abstract
<?php
$owl='dct:abstract
	rdfs:label "Abstract"@en ;
	rdfs:comment "A summary of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description>, dct:description .';

$shacl='<#has-abstract-dataid>
	a sh:PropertyShape ;
    sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:title MUST occur at least once AND have one @en "@en ;
	sh:path dct:abstract ;
	sh:minCount 1 ;
	sh:languageIn ("en") ;
	sh:uniqueLang true .';

$example='"abstract": "This is an example for API testing.",';

$context='duplicate';

table($section,$owl,$shacl,$example,$context);
?>


### description
<?php
$owl='dct:description
	dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
	rdfs:comment "An account of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:label "Description"@en ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .';

$shacl='<#has-description-dataid>
	a sh:PropertyShape ;
    sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:title MUST occur at least once AND have one @en "@en ;
	sh:path dct:description ;
	sh:minCount 1 ;
	sh:languageIn ("en") ;
	sh:uniqueLang true .';

$example='"description": "This is an example for API testing.",';

$context='duplicate';

table($section,$owl,$shacl,$example,$context);
?>


### publisher

TODO explain webid and how databus also provides these

<?php
$owl='dct:publisher
	dcam:rangeIncludes dct:Agent ;
	rdfs:comment "An entity responsible for making the resource available."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:label "Publisher"@en ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/publisher> .';

$shacl='<#has-publisher>
	a sh:PropertyShape ;
    sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:publisher MUST occur exactly once and have URI/IRI as value"@en ;
	sh:path dct:publisher;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .';

$example='"publisher": "https://databus.dbpedia.org/janni#this",';

$context='"publisher": {
      "@id": "dct:publisher",
      "@type": "@id"
    }';

table($section,$owl,$shacl,$example,$context);
?>


### group

TODO:
* add sh:pattern to SHACL

<?php
$owl='missing';

$shacl='<#has-group>   
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dataid:group MUST occur exactly once AND be of type IRI"@en ;
	sh:path dataid:group ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .';

$example='"group": "%DATABUS_URI%/%ACCOUNT%/examples",';

$context='"group": {
      "@id": "dataid:group",
      "@type": "@id"
    }';

table($section,$owl,$shacl,$example,$context);
?>


### artifact

TODO:
* add sh:pattern to SHACL

<?php
$owl='missing';

$shacl='<#has-artifact>   
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dataid:artifact MUST occur exactly once AND be of type IRI"@en ;
	sh:path dataid:group ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .';

$example='"artifact": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example",';

$context='"artifact": {
      "@id": "dataid:artifact",
      "@type": "@id"
    }';

table($section,$owl,$shacl,$example,$context);
?>


### version

TODO:
* add sh:pattern to SHACL

<?php
$owl='missing';

$shacl='<#has-version>   
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dataid:version MUST occur exactly once AND be of type IRI"@en ;
	# sh:pattern "^https://databus.dbpedia.org/[^\\/]+/[^/]+/[^/]+/[^/]+$" ;
	sh:path dataid:version ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .';

$example='"version": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%",';

$context='"version": {
      "@id": "dataid:version",
      "@type": "@id"
    }';

table($section,$owl,$shacl,$example,$context);
?>


### hasVersion

Note: see section versioning above

<?php
$owl='dct:hasVersion
	dct:description "Changes in version imply substantive changes in content rather than differences in format. This property is intended to be used with non-literal values. This property is an inverse property of Is Version Of."@en ;
	rdfs:comment "A related resource that is a version, edition, or adaptation of the described resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:label "Has Version"@en ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/relation>, dct:relation .';

$shacl='<#has-hasVersion-dataset>   
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:hasVersion MUST occur exactly once AND be of type Literal"@en ;
	sh:path dct:hasVersion ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:Literal .';

$example='"hasVersion": "%VERSION%",';

$context='"hasVersion": {
      "@id": "dct:hasVersion",
      "@type": "xsd:string"
    }';

table($section,$owl,$shacl,$example,$context);
?>


### issued

<?php
$owl='dct:issued
	rdfs:label "Date Issued"@en ;
	rdfs:comment "Date of formal issuance of the resource."@en ;
	dct:description "Recommended practice is to describe the date, date/time, or period of time as recommended for the property Date, of which this is a subproperty."@en ;
	dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/date>, dct:date .';

$shacl='<#has-issued>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:issued MUST occur exactly once AND have xsd:dateTime as value"@en ;
	sh:path dct:issued;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:dateTime .';

$example='"issued": "%NOW%",';

$context='"issued": {
      "@id": "dct:issued",
      "@type": "xsd:dateTime"
    }';

table($section,$owl,$shacl,$example,$context);
?>

### modified

Note: *Always* set by the Databus on post.

<?php
$owl='dct:modified
	rdfs:label "Date Modified"@en ;
	rdfs:comment "Date on which the resource was changed."@en ;
	dct:description "Recommended practice is to describe the date, date/time, or period of time as recommended for the property Date, of which this is a subproperty."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/date>, dcterms:date .';

$shacl='<#has-modified>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:modified MUST occur exactly once AND have xsd:dateTime as value"@en ;
	sh:path dct:modified;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:dateTime .';

$example='"modified": "%NOW%",';

$context='"modified": {
      "@id": "dct:modified",
      "@type": "xsd:dateTime"
    }';

table($section,$owl,$shacl,$example,$context);
?>


### license

Note:
* see roadmap above for planned changes
* must be an IRI
* license is set at the dataid:Dataset node, but is always valid for all distributions, which is also reflected by signing the tractacte.
* context.jsonld contains `"@context":{"@base": null },` to prevent creating local IRIs. 

<?php
$owl='dct:license
	rdfs:label "License"@en ;
	rdfs:comment "A legal document giving official permission to do something with the resource."@en ;
	dct:description "Recommended practice is to identify the license document with a URI. If this is not possible or feasible, a literal value that identifies the license may be provided."@en ;
	dcam:rangeIncludes dct:LicenseDocument ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/rights>, dct:rights .';

$shacl='<#has-license>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:license MUST occur exactly once and have URI/IRI as value"@en ;
	sh:path dct:license;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .';

$example='"license": "http://creativecommons.org/licenses/by/4.0/",';

$context='"license": {
      "@context":{"@base": null },
      "@id": "dct:license",
      "@type": "@id"
    }';

table($section,$owl,$shacl,$example,$context);
?>

### distribution
<?php
$owl='dcat:distribution
  a owl:ObjectProperty ;
  rdfs:label "distribution"@en ;
  rdfs:comment "An available distribution of the dataset."@en ;
  rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
  rdfs:domain dcat:Dataset ;
  rdfs:range dcat:Distribution ;
  rdfs:subPropertyOf dct:relation ;
  skos:definition "An available distribution of the dataset."@en .';

$shacl='<#has-distribution>
	a sh:PropertyShape ;
	sh:targetClase dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dcat:distribution MUST occur at least once AND have URI/IRI as value"@en ;
	sh:path dcat:distribution;
	sh:minCount 1 ;
	sh:nodeKind sh:IRI .';

$example='"distribution":"TODO"';

$context='"distribution": {
      "@type": "@id",
      "@id": "@dcat:distribution"
}';

table($section,$owl,$shacl,$example,$context);
?>


## Distribution (Part)

TODO: check if sh:pattern in SHACL is possible 

<?php 
$section="distribution";

$owl='dcat:Distribution
	a owl:Class ;
	rdfs:label "Distribution"@en ;
	rdfs:comment "A specific representation of a dataset. A dataset might be available in multiple serializations that may differ in various ways, including natural language, media-type or format, schematic organization, temporal and spatial resolution, level of detail or profiles (which might specify any or all of the above)."@en ;
	rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
	skos:definition "A specific representation of a dataset. A dataset might be available in multiple serializations that may differ in various ways, including natural language, media-type or format, schematic organization, temporal and spatial resolution, level of detail or profiles (which might specify any or all of the above)."@en ;
	skos:scopeNote "This represents a general availability of a dataset it implies no information about the actual access method of the data, i.e. whether by direct download, API, or through a Web page. The use of dcat:downloadURL property indicates directly downloadable distributions."@en ;';

$shacl='<#dataset-exists>
	a sh:NodeShape ;
	sh:targetNode dataid:Part ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	  sh:minCount 1 ;
	  sh:message "At least one subject with an rdf:type of dataid:Part must occur for each dataid:Dataset."@en ;
	] .
	#sh:property [
    #  sh:path [ sh:inversePath rdf:type ] ;
	#  sh:nodekind sh:IRI ;            
    #  sh:pattern "/[a-zA-Z0-9]{4,}/[a-zA-Z0-9]{1,}/[a-zA-Z0-9]{1,}$" ;
    #  sh:message "IRI for dataid:Group must match /USER/GROUP/VERSION , |USER|>3"@en ;
    #] . ';

$example='"@id": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%#ontology--DEV_type=parsed_sorted.nt",
"@type": "Part",';


$context='"Part": "dataid:Part" ';

table($section,$owl,$shacl,$example,$context);
?>



### issued (Distribution)

<?php
$owl='dct:issued
	rdfs:label "Date Issued"@en ;
	rdfs:comment "Date of formal issuance of the resource."@en ;
	dct:description "Recommended practice is to describe the date, date/time, or period of time as recommended for the property Date, of which this is a subproperty."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/date>, dct:date .';

$shacl='<#has-issued>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:issued MUST occur exactly once AND have xsd:dateTime as value"@en ;
	sh:path dct:issued;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:dateTime .';

$example='"issued": "%NOW%",';

$context='duplicate';

table($section,$owl,$shacl,$example,$context);
?>


### file

<?php
$owl='missing';

$shacl='<#has-file>   
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "A dataid:Part MUST have exactly one dataid:file of type IRI"@en ;
	sh:path dataid:file;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .
';

$example='"file": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%/ontology--DEV_type=parsed_sorted.nt",';

$context='"file": {
      "@id": "dataid:file",
      "@type": "@id"
    }';

table($section,$owl,$shacl,$example,$context);
?>

### format

TODO: check sh:pattern

<?php
$owl='missing';

$shacl='<#has-format>   
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:path dataid:format ;
	sh:message """A dataid:Part MUST have exactly one dataid:format of type xsd:string AND should not inlcude a \'.\' in front"@en ; xsd:string as value  """@en ;
	sh:pattern "^\." ;
	sh:datatype xsd:string ;
	sh:maxCount 1 ;
	sh:minCount 1 .';

$example='"format": "nt",';

$context='"format": {
      "@id": "dataid:format",
      "@type": "xsd:string"
    }';

table($section,$owl,$shacl,$example,$context);
?>


### formatExtension

TODO:
* is this needed? would it help to query this?

<?php
$owl='missing';

$shacl='<#has-formatExtension>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "Required property dataid:formatExtension MUST occur exactly once AND have xsd:string as value"@en ;
	sh:path dataid:formatExtension;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:string .';

$example='"formatExtension": "nt",';

$context='"formatExtension": {
      "@id": "dataid:formatExtension",
      "@type": "xsd:string"
    }';

table($section,$owl,$shacl,$example,$context);
?>


### compression

TODO:
* Check sh:pattern

<?php
$owl='missing';

$shacl='<#has-compression>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message """Required property dataid:compression MUST occur exactly once AND have xsd:string as value AND should not inlcude a \'.\' in front """@en ;
	sh:pattern "^\." ;
	sh:path dataid:compression;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:string .';

$example='"compression": "none",';

$context='"compression": {
      "@id": "dataid:compression",
      "@type": "xsd:string"
    }';

table($section,$owl,$shacl,$example,$context);
?>


### downloadURL
<?php
$owl='dcat:downloadURL
	a owl:ObjectProperty ;
	rdfs:label "download URL"@en ;
	rdfs:comment "The URL of the downloadable file in a given format. E.g. CSV file or RDF file. The format is indicated by the distribution\'s dct:format and/or dcat:mediaType."@en ;
	rdfs:domain dcat:Distribution ;
	rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
	skos:definition "The URL of the downloadable file in a given format. E.g. CSV file or RDF file. The format is indicated by the distribution\'s dct:format and/or dcat:mediaType."@en ;';

$shacl='<#has-downloadURL>   
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "A dataid:Part MUST have exactly one dcat:downloadURL of type IRI"@en ;
	sh:path dcat:downloadURL ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .
';

$example='"downloadURL": "https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/dbpedia.org/ontology--DEV/2021.07.09-070001/ontology--DEV_type=parsed_sorted.nt",';

$context='"downloadURL": {
      "@id": "dcat:downloadURL",
      "@type": "@id"
    }';

table($section,$owl,$shacl,$example,$context);
?>


### bytesize

Note: Determining byteSize is not trivial for two reasons:
1. intuitively, one would think that bytesize is a clearly determinable value, but different functions (e.g. for different programming language) return different bytesizes and are only comparable in the same system. 
2. More often than expected determining bytesize fails, e.g. disk read problem, network problems or file corruption. 
  
We are reusing `dcat:byteSize` here, which uses `xsd:decimal`. However, we do not deem this ideal and would rather opt to `xsd:double` as it supports the `NaN` value. So in any case, where bytesize calculation fails, please put 0.

<?php
$owl='# excerpt from https://www.w3.org/ns/dcat2.ttl 
dcat:byteSize
	a owl:DatatypeProperty ;
	rdfs:label "byte size"@en ;
	rdfs:comment "The size of a distribution in bytes."@en ;
	rdfs:domain dcat:Distribution ;
	rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
	rdfs:range rdfs:Literal ;
	skos:definition "The size of a distribution in bytes."@en ;
	skos:scopeNote "The size in bytes can be approximated when the precise size is not known. The literal value of dcat:byteSize should by typed as xsd:decimal."@en ;';

$shacl='<#has-bytesize>   
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "A dataid:Part MUST have exactly one dct:byteSize of type xsd:decimal"@en ;
	sh:path dcat:byteSize ;
	sh:datatype xsd:decimal ;
	sh:maxCount 1 ;
	sh:minCount 1 .  ';

$example='"byteSize": "4439722",';

$context='"byteSize": {
    "@id": "dcat:byteSize",
    "@type": "xsd:decimal"
  }';
?>



### sha256sum

<?php
$owl='missing';

$shacl='<#has-sha256sum>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "Required property dataid:sha256sum MUST occur exactly once AND have xsd:string as value AND match pattern ^[a-f0-9]{64}$"@en ;
	sh:path dataid:sha256sum;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:string ;
	#   dataid:sha256sum         "49b0f2dd5bb6c1dcdbbb935dbc4463218d570b4b4499da081e07a2d52c60ceab"^^xsd:string ;
	sh:pattern "^[a-f0-9]{64}$" .';

$example='"sha256sum": "b3aa40e4a832e69ebb97680421fbeff968305931dafdb069a8317ac120af0380",';

$context='"sha256sum": {
      "@id": "dataid:sha256sum",
      "@type": "xsd:string"
    }';

table($section,$owl,$shacl,$example,$context);
?>

### hasVersion (Distribution)

Note: see section versioning above

<?php
$owl='dct:hasVersion
	rdfs:label "Has Version"@en ;
	rdfs:comment "A related resource that is a version, edition, or adaptation of the described resource."@en ;
	dct:description "Changes in version imply substantive changes in content rather than differences in format. This property is intended to be used with non-literal values. This property is an inverse property of Is Version Of."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/relation>, dct:relation .';

$shacl='<#has-hasVersion-part>   
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:hasVersion MUST occur exactly once AND be of type Literal"@en ;
	sh:path dct:hasVersion ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:Literal .';
	
$example='"hasVersion": "%VERSION%",';

$context='"hasVersion": {
      "@id": "dct:hasVersion",
      "@type": "xsd:string"
    }';

table($section,$owl,$shacl,$example,$context);

?>

### TODO signature/tractate

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



## TODO Content variants


<?php
$owl='missing';

$shacl='<#properties-are-cvs>
	a sh:PropertyShape ;
	sh:targetClass rdf:Property ; 
	sh:path rdfs:subPropertyOf ;
	sh:hasValue dataid:contentVariant ;
	sh:message "All rdf:Properties MUST be an rdfs:subPropertyOf dataid:contentVariant."@en .
';
	
$example='missing';

$context='"subPropertyOf" : {
    "@id" : "rdfs:subPropertyOf",
    "@type" : "@id"
  }';

table($section,$owl,$shacl,$example,$context);
?>  

## TODO Remaining JSON-LD

<?php
$owl='missing';

$shacl='missing';
	
$example='missing';

$context='"maker": {
    "@id": "foaf:maker",
    "@type": "@id"
  },
  "primaryTopic": {
    "@id": "foaf:primaryTopic",
    "@type": "@id"
  },
  "name": {
    "@id": "foaf:name",
    "@type": "xsd:string"
  },
  "account": {
    "@id": "foaf:account",
    "@type": "@id"
  },
  "img": {
    "@id": "foaf:img",
    "@type": "@id"
  },
  "key": {
    "@id": "cert:key"
  },
  "modulus": {
    "@id": "cert:modulus"
  },
  "exponent": {
    "@id": "cert:exponent"
  },
  "signature": {
    "@id": "dataid:signature",
    "@type": "xsd:string"
  },
  "tractate": {
    "@id": "databus:tractate"
  }';


table($section,$owl,$shacl,$example,$context);
?>
<?php
headerFooter($contextFile, $shaclDir);
?>




