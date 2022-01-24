#!/usr/bin/php
# Dataset Version - the DataId
<?php
error_reporting( E_ALL | E_STRICT );
require_once("function.php");
init();

?>
<?php
$section="dataid" ;
$sectionExampleURI="https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#Dataset";
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
		sh:pattern "/[a-zA-Z0-9]{4,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}#Dataset$" ;
		sh:message "IRI for dataid:Dataset must match /USER/GROUP/ARTIFACT/VERSION#Dataset , |USER|>3"@en ;
  ] . ';


$example='"@type": "dataid:Dataset",';

$context='"Dataset": 	"dataid:Dataset" ';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## title
<?php
$owl='dct:title
	rdfs:label "Title"@en ;
	rdfs:comment "A name given to the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/title> .';

$shacl='<#title-dataid>
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
	] . ';

$example='"title": "DBpedia Ontology",';

$context='duplicate';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## abstract
<?php
$owl='dct:abstract
	rdfs:label "Abstract"@en ;
	rdfs:comment "A summary of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description>, dct:description .';

$shacl='<#abstract-dataid>
	a sh:NodeShape ;
    sh:targetClass dataid:Dataset ;
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

$example='"abstract": "Registered a version of the DBpedia Ontology into my account",';

$context='duplicate';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## description
<?php
$owl='dct:description
	dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
	rdfs:comment "An account of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:label "Description"@en ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .';

$shacl='<#description-dataid>
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
	] . ';

$example='"description": "Registered a version of the DBpedia Ontology into my account. Using markdown:\n  1. This is the version used in [project x](http://example.org) as a stable snapshot dependency\n  2. License was checked -> CC-BY\n",';

$context='duplicate';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## publisher

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

$example='"publisher": TODO';

$context='"publisher": {
      "@id": "dct:publisher",
      "@type": "@id"
    }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## group

<?php
$owl='missing';

$shacl='<#has-group>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dataid:group MUST occur exactly once AND be of type IRI AND must match /USER/GROUP , |USER|>3"@en ;
	sh:path dataid:group ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI ;
  sh:pattern "/[a-zA-Z0-9]{4,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}$" .

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
	] .';

$example='"group": "https://databus.dbpedia.org/janni/onto_dep_projectx",';

$context='duplicate';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## artifact 


<?php
autonote();


$owl='missing';

$shacl='<#has-artifact>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dataid:artifact MUST occur exactly once AND be of type IRI AND must match /USER/GROUP/ARTIFACT , |USER|>3"@en ;
	sh:path dataid:artifact ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI  ;
  sh:pattern "/[a-zA-Z0-9]{4,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}$" .

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
	] .';

$example='"artifact": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology",';

$context='"artifact": {
      "@id": "dataid:artifact",
      "@type": "@id"
    }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## version

<?php
$owl='missing';

$shacl='<#has-version>
	a sh:PropertyShape ;
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dataid:version MUST occur exactly once AND be of type IRI /USER/GROUP/ARTIFACT/VERSION , |USER|>3"@en ;
	sh:path dataid:version ;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI  ;
  sh:pattern "/[a-zA-Z0-9]{4,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}$" .

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
	] .';

$example='"version": "https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06",';

$context='"version": {
      "@id": "dataid:version",
      "@type": "@id"
    }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## hasVersion

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

$example='"hasVersion": "2021-12-06",';

$context='"hasVersion": 	{"@id": "dct:hasVersion"}';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## issued

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

$example='"issued": "2021-12-06T11:34:17Z",';

$context='"issued": {
      "@id": "dct:issued",
      "@type": "xsd:dateTime"
    }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>

## modified

Note: dct:modified is *always* set by the Databus on post.

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

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## license

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

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>

## distribution
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
	sh:targetClass dataid:Dataset ;
	sh:severity sh:Violation ;
	sh:message "Required property dcat:distribution MUST occur at least once AND have URI/IRI as value"@en ;
	sh:path dcat:distribution;
	sh:minCount 1 ;
	sh:nodeKind sh:IRI .';

$example='"distribution": [{
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
              }]';

$context='"distribution": {
      "@type": "@id",
      "@id": "dcat:distribution"
}';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
exit;
?>


## Distribution (Part)

<?php
$section="distribution";
$sectionExampleURI="https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt";

$owl='dcat:Distribution
	a owl:Class ;
	rdfs:label "Distribution"@en ;
	rdfs:comment "A specific representation of a dataset. A dataset might be available in multiple serializations that may differ in various ways, including natural language, media-type or format, schematic organization, temporal and spatial resolution, level of detail or profiles (which might specify any or all of the above)."@en ;
	rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
	skos:definition "A specific representation of a dataset. A dataset might be available in multiple serializations that may differ in various ways, including natural language, media-type or format, schematic organization, temporal and spatial resolution, level of detail or profiles (which might specify any or all of the above)."@en ;
	skos:scopeNote "This represents a general availability of a dataset it implies no information about the actual access method of the data, i.e. whether by direct download, API, or through a Web page. The use of dcat:downloadURL property indicates directly downloadable distributions."@en ;';

$shacl='<#part-exists>
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
    sh:pattern "/[a-zA-Z0-9]{4,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}/[a-zA-Z0-9\\\\-_\\\\.]{3,}#[a-zA-Z0-9\\\\-_\\\\.=]{3,}(?<!#Dataset)$" ;
    sh:message "IRI for dataid:Part must match /USER/GROUP/ARTIFACT/VERSION#PART , |USER|>3, PART != \"Dataset\""@en ;
    ] . ';

$example='"@type": "Part",';


$context='"Part": 	"dataid:Part" ';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>



## issued (Distribution)

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

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## file

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

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>

## format

<?php
$owl='missing';

$shacl='<#has-format>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:path dataid:format ;
	sh:message "A dataid:Part MUST have exactly one dataid:format of type xsd:string AND should not inlcude a \'.\' in front"@en ; 
	sh:pattern "^[a-z0-9]{1,8}$" ;
	sh:datatype xsd:string ;
	sh:maxCount 1 ;
	sh:minCount 1 .';

$example='"format": "nt",';

$context='"format":		{"@id": "dataid:format"}';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## formatExtension

TODO Marvin: describe why formatExtension is practical
TODO Jan: add sh:pattern, i.e. no point at beginning, also must match the end of file URI


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

$context='"formatExtension": 	{"@id": "dataid:formatExtension"}';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## compression

<?php
$owl='missing';

$shacl='<#has-compression>
	a sh:PropertyShape ;
	sh:targetClass dataid:Part ;
	sh:severity sh:Violation ;
	sh:message """Required property dataid:compression MUST occur exactly once AND have xsd:string as value AND should not inlcude a \'.\' in front """@en ;
	sh:pattern "^[a-z0-9]{1,8}$" ;
	sh:path dataid:compression;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:string .';

$example='"compression": "none",';

$context='"compression": 	{"@id": "dataid:compression"}';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## downloadURL
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

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## bytesize

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


table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## sha256sum

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

$context='"sha256sum": 		{"@id": "dataid:sha256sum"}';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>

## hasVersion (Distribution)

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

$context='duplicate';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);

?>

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

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>

## Remaining JSON-LD
TODO ??

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
  "proof":	{"@id": "sec:proof"}';


table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>

