#!/usr/bin/php
# Distribution (Part)

<?php
error_reporting( E_ALL | E_STRICT );
require_once("function.php");
init();

?>

<?php
$section="version";
$sectionExampleURI="https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology/2021-12-06#ontology--DEV_type=parsed_sorted.nt";

$owl='databus:Part  a owl:Class ;
    rdfs:label "Part"@en ;
    rdfs:comment """A Part represents a single file (i.e. distribution) which is referenced from a particular Version.
    Typically a dataset consists of several files, e.g. same (or similar) files but in multiple serializations that may differ in various ways, including natural language, media-type or format, schematic organization, temporal and spatial resolution, level of detail. Artifacts are packaged compositionally, i.e. each Part adds to the dataset, which is the sum of information."""@en ;
    rdfs:subClassOf dcat:Distribution ;
    rdfs:isDefinedBy <http://dataid.dbpedia.org/databus#> .';

$shacl='<#part-exists>
	a sh:NodeShape ;
	sh:targetNode databus:Part ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	  sh:minCount 1 ;
	  sh:message "At least one subject with an rdf:type of databus:Part must occur for each databus:Version."@en ;
	] ;
	sh:property [
    sh:path [ sh:inversePath rdf:type ] ;
    sh:nodekind sh:IRI ;
    sh:pattern "/[a-zA-Z0-9\\\\-_]{4,}/[a-zA-Z0-9\\\\-_\\\\.]{1,}/[a-zA-Z0-9\\\\-_\\\\.]{1,}/[a-zA-Z0-9\\\\-_\\\\.]{1,}#[a-zA-Z0-9\\\\-_\\\\.=]{3,}$" ;
    sh:message "IRI for databus:Part must match /USER/GROUP/ARTIFACT/VERSION#PART , |USER|>3"@en ;
    ] . ';

$example='"@type": "Part",';


$context='"Part": 	"databus:Part" ';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>



## issued 
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
	sh:targetClass databus:Part ;
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
	sh:targetClass databus:Part ;
	sh:severity sh:Violation ;
	sh:message "A databus:Part MUST have exactly one databus:file of type IRI"@en ;
	sh:path databus:file;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .
';

$example='"file": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%/ontology--DEV_type=parsed_sorted.nt",';

$context='"file": {
      "@id": "databus:file",
      "@type": "@id"
    }';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## formatExtension

TODO Marvin: describe why formatExtension is practical
TODO Jan: add sh:pattern, i.e. no point at beginning, also must match the end of file URI


<?php
$owl='missing';

$shacl='<#has-formatExtension>
	a sh:PropertyShape ;
	sh:targetClass databus:Part ;
	sh:severity sh:Violation ;
	sh:message "Required property databus:formatExtension MUST occur exactly once AND have xsd:string as value"@en ;
	sh:path databus:formatExtension;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:string .';

$example='"formatExtension": "nt",';

$context='"formatExtension": 	{"@id": "databus:formatExtension"}';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>


## compression

<?php
$owl='missing';

$shacl='<#has-compression>
	a sh:PropertyShape ;
	sh:targetClass databus:Part ;
	sh:severity sh:Violation ;
	sh:message """Required property databus:compression MUST occur exactly once AND have xsd:string as value AND should not inlcude a \'.\' in front """@en ;
	sh:pattern "^[a-z0-9]{1,8}$" ;
	sh:path databus:compression;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:string .';

$example='"compression": "none",';

$context='"compression": 	{"@id": "databus:compression"}';

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
	sh:targetClass databus:Part ;
	sh:severity sh:Violation ;
	sh:message "A databus:Part MUST have exactly one dcat:downloadURL of type IRI"@en ;
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
	sh:targetClass databus:Part ;
	sh:severity sh:Violation ;
	sh:message "A databus:Part MUST have exactly one dcat:byteSize of type xsd:decimal"@en ;
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
	sh:targetClass databus:Part ;
	sh:severity sh:Violation ;
	sh:message "Required property databus:sha256sum MUST occur exactly once AND have xsd:string as value AND match pattern ^[a-f0-9]{64}$"@en ;
	sh:path databus:sha256sum;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:datatype xsd:string ;
	#   databus:sha256sum         "49b0f2dd5bb6c1dcdbbb935dbc4463218d570b4b4499da081e07a2d52c60ceab"^^xsd:string ;
	sh:pattern "^[a-f0-9]{64}$" .';

$example='"sha256sum": "b3aa40e4a832e69ebb97680421fbeff968305931dafdb069a8317ac120af0380",';

$context='"sha256sum": 		{"@id": "databus:sha256sum"}';

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
	sh:targetClass databus:Part ;
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
#   sec:signature         "dg6U+QmLt/WJvcb2yQApkAD5vanzNE1fBxvCwB87+G/XgsOpeDm3jDAEnCA43uWyw3A+sVKXfOvYFGfh7LPrJRIcZTlaqpXZ9UU1TmunCFrtvh+TZ+T0eMwOxzWfQ7eLAdZJlV5IDMNZZwNi9u6ukiF8ciSJjpRSHWDYD11NT79Q9sKMmVFosfoo8GEa9aM43BzqNDew/aoRMW6xlvAGKO4rbmbbONroeYLSeTApakF5SwgEQ8pcjvAZf7UoNNTlOFjklUiJIoVlhaUiuatptxa/aGK499Ja/sQqordPgJfOIa+pRhAXIBYZvXRGPxpi8lwHCU8oXSzSArArWIPyMg=="^^xsd:string ;
    a sh:PropertyShape ;
    sh:severity sh:Violation ;
    sh:message " TODO Optional property sec:signature MUST occur 0 or 1 time AND have xsd:string as value AND match pattern"@en ;
    sh:path sec:signature;
    sh:maxCount 1 ;
    sh:datatype xsd:string ;
    sh:pattern "^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$" .

```



##  Content variants
TODO ??

The shape `<#parts-are-distinguishable-by-cv>` relies on a ordering of results in the *GROUP BY* and consequentially *GROUP_CONCAT* instruction that is agnostic of the ordering of properties in the data. This seems to work for Apache JENA and Virtuoso but has not been tested with other SPARQL engines.

<?php
$owl='missing';

$shacl='<#properties-are-cvs>
	a sh:PropertyShape ;
	sh:targetClass rdf:Property ;
	sh:path rdfs:subPropertyOf ;
	sh:hasValue databus:contentVariant ;
	sh:message "All rdf:Properties MUST be an rdfs:subPropertyOf databus:contentVariant."@en .

  <#is-part-uri-correct>
	a sh:NodeShape;
	sh:targetClass databus:Version ;
	sh:sparql [
		sh:message "Part URI must contain the version URI of the associated version." ;
		sh:prefixes databus: ;
    sh:select """
			SELECT $this ?value
			WHERE {
        ?this <http://www.w3.org/ns/dcat#distribution> ?value .
				$this <https://dataid.dbpedia.org/databus#version> ?version .
        FILTER(!strstarts(str($value), str(?version)))
			}
			""" ;
	] .

  <#is-file-uri-correct>
	a sh:NodeShape;
	sh:targetClass databus:Version ;
	sh:sparql [
		sh:message "File URI must contain the version URI of the associated version." ;
		sh:prefixes databus: ;
    sh:select """
			SELECT $this ?value
			WHERE {
        ?this <http://www.w3.org/ns/dcat#distribution> ?dist .
        ?dist <https://dataid.dbpedia.org/databus#file> ?value .
				$this <https://dataid.dbpedia.org/databus#version> ?version .
        FILTER(!strstarts(str($value), str(?version)))
			}
			""" ;
	] .
';

$example='missing';

$context='"contentVariant": { "@id" : "databus:contentVariant" },
	"subPropertyOf" : {
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

$context='
  "RSAPublicKey" : "cert:RSAPublicKey",
  "key": 	{"@id": "cert:key"},
  "modulus":	{"@id": "cert:modulus"},
  "exponent":	{"@id": "cert:exponent"}';


table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>

