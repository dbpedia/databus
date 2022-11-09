#!/usr/bin/php
<?php
error_reporting( E_ALL | E_STRICT );
require_once("function.php");
init();

?>
## Artifact

A specific version of a Databus artifact (artifacts = version-independent, abstract datasets). 
Please note that the fuzzy word `dataset` is disambiguated on the Databus, as it could mean:
1. **artifact (this page, see below)**: the abstract concept of a dataset (e.g. the DBpedia Label dataset, [https://databus.dbpedia.org/dbpedia/generic/labels/](https://databus.dbpedia.org/dbpedia/generic/labels/)).
2. version (see [here](https://dbpedia.gitbook.io/databus/model/model/version)): a specific version of a dataset (e.g. DBpedia Label dataset of Sep 1st, 2022, [https://databus.dbpedia.org/dbpedia/generic/labels/2022.09.01](https://databus.dbpedia.org/dbpedia/generic/labels/2022.09.01)).
3. distribution (see [here](https://dbpedia.gitbook.io/databus/model/model/distribution)): the bag of files of a specific version (e.g. the download location: [https://downloads.dbpedia.org/repo/dbpedia/generic/labels/2022.09.01/](https://downloads.dbpedia.org/repo/dbpedia/generic/labels/2022.09.01/))   



<?php
$section="artifact" ;
$sectionExampleURI="https://databus.dbpedia.org/janni/onto_dep_projectx/dbpedia-ontology";
$owl=
'#copied from DataId ontology
dataid:Dataset
	a owl:Class ;
	rdfs:label "Databus Dataset"@en ;
	rdfs:comment "A collection of data, available for access in one or more formats. Dataset resources describe the concept of the dataset, not its manifestation (the data itself), which can be acquired as a Distribution"@en ; 
	rdfs:subClassOf void:Dataset, dcat:Dataset, prov:Entity ; 
	rdfs:isDefinedBy <http://dataid.dbpedia.org/ns/core#> . 
';

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
		sh:pattern "/[a-zA-Z0-9\\\\-_]{4,}/[a-zA-Z0-9\\\\-_\\\\.]{1,}/[a-zA-Z0-9\\\\-_\\\\.]{1,}/[a-zA-Z0-9\\\\-_\\\\.]{1,}#Dataset$" ;
		sh:message "IRI for dataid:Dataset must match /USER/GROUP/ARTIFACT/VERSION#Dataset , |USER|>3"@en ;
  ] . ';


$example='"@type": "dataid:Dataset",';

$context='"Dataset": 	"dataid:Dataset" ';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
?>

## 1. General Metadata

### title
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



<?php
/*
## abstract
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
	    sh:message "Besides the required occurance of dct:abstract without language tag, each occurance of dct:abstract must have less than 300 characters and each language must occure only once. "@en ;
	    sh:uniqueLang true;
	    sh:maxLength 300 ;
	] . ';

$example='"abstract": "Registered a version of the DBpedia Ontology into my account",';

$context='duplicate';

table($section,$sectionExampleURI,$owl,$shacl,$example,$context);
*/
?>


### description
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

