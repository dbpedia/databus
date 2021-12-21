<?php


/*
sudo apt install php7.4-cli
php model.php 

Goal:
* php script is a template to fill a markdown doc (stdout)
* also generates context, shacl and example (these are the Single Source of Truth files)
* OWL should be taken from dataid, dct, dcat, etc. SSoT is elsewhere

Success criteria:
* context.json, shacl and example have a correct syntax.
* model.md renders well and looks pretty

comm -23 <(cat ../context.json | jq| grep '": {' | sort -u ) <(cat remainingFiles/context.json | jq | grep '": {' | sort -u)

*/

error_reporting( E_ALL | E_STRICT );
require_once("function.php");

$contextFile="generated/context.json";
$markDownFile="model.md";
$shaclDir="generated/shacl";
$examplesDir="generated/examples";

init();

?>

# Databus Model


Databus runs on an RDF model made from DCAT, DCT and DataId properties. Additional SHACL constraints are imposed to guarantee clean metadata. The default format we are propagating is JSON-LD, however, other RDF serializations are also working. 

## URI Design
TODO explain URIs

## Quickstart Examples

Some examples to copy and adapt. 

### Dataset Version

```
TODO Jan -> can you copy an example here, e.g. the DBpedia Ontology example
```
After posting, Databus will add these inferred statements:

```

```

### Group
```json
{
	"@context": "http://downloads.dbpedia.org/databus/context.jsonld",
	"@id": "https://databus.dbpedia.org/username/example_group",
	"@type": "dataid:Group",
	"title": "Group title" ,
	"abstract": "This is an example group for API testing.",
	"description": "This is an example group for API testing."
}
```






## Group 

TODO:
* shacl check URI pattern? $DOMAIN/$USER/$GROUP  w/o slash

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
	] .';

$example='"@id": "https://databus.dbpedia.org/janni/examples",
"@type": "dataid:Group",';

$context='"Group": "dataid:Group",
"group": {
	"@id": "dataid:group",
	"@type": "@id"
	}';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dct:title" ?>
<?php
$owl='dct:title
	rdfs:label "Title"@en ;
	rdfs:comment "A name given to the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/title> .';

$shacl='<#en-title>
	a sh:PropertyShape ;
	sh:targetClass dataid:Group ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:title MUST occur at least once AND have one @en "@en ;
	sh:path dct:title ;
	sh:minCount 1 ;
	sh:languageIn ("en") ;
	sh:uniqueLang true .';

$example='"title": "Example Group" ,';

$context='"title": {
    "@id": "dct:title",
    "@language": "en"
  }';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dct:abstract" ?>
<?php
$owl='dct:abstract
	rdfs:label "Abstract"@en ;
	rdfs:comment "A summary of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description>, dct:description .';

$shacl='<#en-abstract>
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

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dct:description" ?>
<?php
$owl='dct:description
	rdfs:label "Description"@en ;
	rdfs:comment "An account of the resource."@en ;
	dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .';

$shacl='<#en-description>
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

table($section,$id,$owl,$shacl,$example,$context);
?>


## Dataset (DataId)
<?php $section="dataid" ?>

### <?=$id="dataid" ?>
<?php
$owl='missing';

$shacl='<#dataset-exists>
	a sh:NodeShape ;
	sh:targetNode dataid:Dataset ;
	sh:property [
	  sh:path [ sh:inversePath rdf:type ] ;
	  sh:minCount 1 ;
	  sh:maxCount 1 ;
	  sh:message "Exactly one subject with an rdf:type of dataid:Dataset must occur."@en ;
	] .';

$example='"@id": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%#Dataset",
"@type": "dataid:Dataset",';

$context='"Dataset": "dataid:Dataset" ';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dct:title" ?>
<?php
$owl='dct:title
	rdfs:label "Title"@en ;
	rdfs:comment "A name given to the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:range rdfs:Literal ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/title> .';

$shacl='<#en-title>
	a sh:PropertyShape ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:title MUST occur at least once AND have one @en " ;
	sh:path dct:title ;
	sh:minCount 1 ;
	sh:languageIn ("en") ;
	sh:uniqueLang true .';

$example='"title": "DBpedia Ontology Example",';

$context='"title": {
    "@id": "dct:title",
    "@language": "en"
  }';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dct:abstract" ?>
<?php
$owl='dct:abstract
	rdfs:label "Abstract"@en ;
	rdfs:comment "A summary of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description>, dct:description .';

$shacl='<#en-abstract>
	a sh:PropertyShape ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:title MUST occur at least once AND have one @en "@en ;
	sh:path dct:abstract ;
	sh:minCount 1 ;
	sh:languageIn ("en") ;
	sh:uniqueLang true .';

$example='"abstract": "This is an example for API testing.",';

$context='"abstract": {
      "@id": "dct:abstract",
      "@language": "en"
    }';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dct:description" ?>
<?php
$owl='dct:description
	dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
	rdfs:comment "An account of the resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:label "Description"@en ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .';

$shacl='<#en-description>
	a sh:PropertyShape ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:title MUST occur at least once AND have one @en "@en ;
	sh:path dct:description ;
	sh:minCount 1 ;
	sh:languageIn ("en") ;
	sh:uniqueLang true .';

$example='"description": "This is an example for API testing.",';

$context='"description": {
      "@id": "dct:description",
      "@language": "en"
    }';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dct:publisher" ?>
<?php
$owl='dct:publisher
	dcam:rangeIncludes dct:Agent ;
	rdfs:comment "An entity responsible for making the resource available."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:label "Publisher"@en ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/publisher> .';

$shacl='<#publisher-violation>
	a sh:PropertyShape ;
	sh:severity sh:Violation ;
	sh:message "Required property dct:publisher MUST occur exactly once and have URI/IRI as value"@en ;
	sh:path dct:publisher;
	sh:minCount 1 ;
	sh:maxCount 1 ;
	sh:nodeKind sh:IRI .';

$example='"publisher": "https://databus.dbpedia.org/TODO#this",';

$context='"publisher": {
      "@id": "dct:publisher",
      "@type": "@id"
    }';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dataid:group" ?>
<?php
$owl='missing';

$shacl='missing';

$example='"group": "%DATABUS_URI%/%ACCOUNT%/examples",';

$context='"group": {
      "@id": "dataid:group",
      "@type": "@id"
    }';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dataid:artifact" ?>
<?php
$owl='missing';

$shacl='missing';

$example='"artifact": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example",';

$context='"artifact": {
      "@id": "dataid:artifact",
      "@type": "@id"
    }';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dataid:version" ?>
<?php
$owl='missing';

$shacl='<#version-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "TODO Required property dataid:version MUST occur exactly once AND have URI/IRI as value AND match pattern"@en ;
            sh:path dataid:version;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            #TODO specify version better
            # sh:pattern "^https://databus.dbpedia.org/[^\\/]+/[^/]+/[^/]+/[^/]+$" ;
            # all need to comply to URI path spec ?
            # user: keycloak -> jan
            # group: maven
            # artifact: maven + some extra
            # version: maven
            sh:nodeKind sh:IRI .';

$example='"version": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%",';

$context='"version": {
      "@id": "dataid:version",
      "@type": "@id"
    }';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dct:hasVersion" ?>
<?php
$owl='dct:hasVersion
	dct:description "Changes in version imply substantive changes in content rather than differences in format. This property is intended to be used with non-literal values. This property is an inverse property of Is Version Of."@en ;
	rdfs:comment "A related resource that is a version, edition, or adaptation of the described resource."@en ;
	rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
	rdfs:label "Has Version"@en ;
	rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/relation>, dct:relation .';

$shacl='missing';

$example='"hasVersion": "%VERSION%",';

$context='"hasVersion": {
      "@id": "dct:hasVersion",
      "@type": "xsd:string"
    }';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dct:issued" ?>
<?php
$owl='dct:issued
          dct:description "Recommended practice is to describe the date, date/time, or period of time as recommended for the property Date, of which this is a subproperty."@en ;
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "Date of formal issuance of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Date Issued"@en ;
          rdfs:range rdfs:Literal ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/date>, dct:date .';

$shacl='<#issued-violation>
            a sh:PropertyShape ;
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

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dct:license" ?>
<?php
$owl='dct:license
          dcam:rangeIncludes dct:LicenseDocument ;
          dct:description "Recommended practice is to identify the license document with a URI. If this is not possible or feasible, a literal value that identifies the license may be provided."@en ;
          dct:issued "2004-06-14"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A legal document giving official permission to do something with the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "License"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/rights>, dct:rights .';

$shacl='<#license-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:license MUST occur exactly once and have URI/IRI as value"@en ;
            sh:path dct:license;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:nodeKind sh:IRI .';

$example='"license": "http://creativecommons.org/licenses/by/4.0/",';

$context='"license": {
      "@id": "dct:license",
      "@type": "@id"
    }';

table($section,$id,$owl,$shacl,$example,$context);
?>




## Distribution
<?php $section="distribution" ?>

### <?=$id="dcat:distribution" ?>
<?php
$owl=<<<XML
dcat:Distribution
        a rdfs:Class ;
        a owl:Class ;
        rdfs:comment "A specific representation of a dataset. A dataset might be available in multiple serializations that may differ in various ways, including natural language, media-type or format, schematic organization, temporal and spatial resolution, level of detail or profiles (which might specify any or all of the above)."@en ;
        rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
        rdfs:label "Distribution"@en ;
        skos:definition "A specific representation of a dataset. A dataset might be available in multiple serializations that may differ in various ways, including natural language, media-type or format, schematic organization, temporal and spatial resolution, level of detail or profiles (which might specify any or all of the above)."@en ;
        skos:scopeNote "This represents a general availability of a dataset it implies no information about the actual access method of the data, i.e. whether by direct download, API, or through a Web page. The use of dcat:downloadURL property indicates directly downloadable distributions."@en ;
      .
XML;

$shacl='<#distribution-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dcat:distribution MUST occur exactly once AND have URI/IRI as value"@en ;
            sh:path dcat:distribution;
            sh:minCount 1 ;
            sh:nodeKind sh:IRI .';

$example='"@id": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%#ontology--DEV_type=parsed_sorted.nt",
"@type": "dataid:SingleFile",';

$context='"distribution": "dcat:distribution"';

table($section,$id,$owl,$shacl,$example,$context);
?>

### <?=$id="dct:issued" ?>
<?php
$owl='dct:issued
          dct:description "Recommended practice is to describe the date, date/time, or period of time as recommended for the property Date, of which this is a subproperty."@en ;
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "Date of formal issuance of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Date Issued"@en ;
          rdfs:range rdfs:Literal ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/date>, dct:date .';

$shacl='<#issued-violation>
            a sh:PropertyShape ;
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

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dataid:file" ?>
<?php
$owl='missing';

$shacl='missing';

$example='"file": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%/ontology--DEV_type=parsed_sorted.nt",';

$context='"file": {
      "@id": "dataid:file",
      "@type": "@id"
    }';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dataid:formatExtension" ?>
<?php
$owl='missing';

$shacl='<#formatExtension-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dataid:formatExtension MUST occur exactly once AND have xsd:string as value"@en ;
            sh:path dataid:formatExtension;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:datatype xsd:string .';

$example='"format": "nt",';

$context='"formatExtension": {
      "@id": "dataid:formatExtension",
      "@type": "xsd:string"
    }';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dataid:compression" ?>
<?php
$owl='missing';

$shacl='<#compression-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dataid:compression MUST occur exactly once AND have xsd:string as value"@en ;
            sh:path dataid:compression;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:datatype xsd:string .';

$example='"compression": "none",';

$context='"compression": {
      "@id": "dataid:compression",
      "@type": "xsd:string"
    }';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dcat:downloadURL" ?>
<?php
$owl='
    dcat:downloadURL
    a rdf:Property ;
    a owl:ObjectProperty ;
    rdfs:comment "The URL of the downloadable file in a given format. E.g. CSV file or RDF file. The format is indicated by the distribution\'s dct:format and/or dcat:mediaType."@en ;
    rdfs:domain dcat:Distribution ;
    rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
    rdfs:label "download URL"@en ;
    skos:definition "The URL of the downloadable file in a given format. E.g. CSV file or RDF file. The format is indicated by the distribution\'s dct:format and/or dcat:mediaType."@en ;
    .
    ';

$shacl='<#downloadurl-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property  dcat:downloadURL MUST occur exactly once and have URI/IRI as value"@en ;
            sh:path dcat:downloadURL ;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:nodeKind sh:IRI .';

$example='"downloadURL": "https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/dbpedia.org/ontology--DEV/2021.07.09-070001/ontology--DEV_type=parsed_sorted.nt",';

$context='"downloadURL": {
      "@id": "dcat:downloadURL",
      "@type": "@id"
    }';

table($section,$id,$owl,$shacl,$example,$context);
?>


### <?=$id="dcat:bytesize" ?>
<?php
$owl='# excerpt from https://www.w3.org/ns/dcat2.ttl 
dcat:byteSize
  a rdf:Property ;
  a owl:DatatypeProperty ;
  rdfs:comment "The size of a distribution in bytes."@en ;
  rdfs:domain dcat:Distribution ;
  rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
  rdfs:label "byte size"@en ;
  rdfs:range rdfs:Literal ;
  skos:definition "The size of a distribution in bytes."@en ;
  skos:scopeNote "The size in bytes can be approximated when the precise size is not known. The literal value of dcat:byteSize should by typed as xsd:decimal."@en ;';

$shacl='<#has-bytesize>   
  a sh:PropertyShape ;
  sh:targetClass dataid:SingleFile ;
  sh:severity sh:Violation ;
  sh:message "A dataid:SingleFile MUST have exactly one dct:byteSize of type xsd:decimal"@en ;
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



### <?=$id="dataid:sha256sum" ?>
<?php
$owl='missing';

$shacl='<#sha256sum-violation>
        #   dataid:sha256sum         "49b0f2dd5bb6c1dcdbbb935dbc4463218d570b4b4499da081e07a2d52c60ceab"^^xsd:string ;
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dataid:sha256sum MUST occur exactly once AND have xsd:string as value AND match pattern ^[a-f0-9]{64}$"@en ;
            sh:path dataid:sha256sum;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:datatype xsd:string ;
            sh:pattern "^[a-f0-9]{64}$" .';

$example='"sha256sum": "b3aa40e4a832e69ebb97680421fbeff968305931dafdb069a8317ac120af0380",';

$context='"sha256sum": {
      "@id": "dataid:sha256sum",
      "@type": "xsd:string"
    }';

table($section,$id,$owl,$shacl,$example,$context);
?>

### <?=$id="dct:hasVersion" ?>
<?php
$owl='dct:hasVersion
          dct:description "Changes in version imply substantive changes in content rather than differences in format. This property is intended to be used with non-literal values. This property is an inverse property of Is Version Of."@en ;
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A related resource that is a version, edition, or adaptation of the described resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Has Version"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/relation>, dct:relation .';

$shacl='missing';

$example='"hasVersion": "%VERSION%",';

$context='"hasVersion": {
      "@id": "dct:hasVersion",
      "@type": "xsd:string"
    }';

table($section,$id,$owl,$shacl,$example,$context);

headerFooter($contextFile, $shaclDir);
?>




