<?php
error_reporting( E_ALL | E_STRICT );
require_once("function.php");
global $contextFile, $shaclDir, $generatedDir;

headerFooterContext($contextFile);
headerFooterShacl($shaclDir);



function headerFooterContext($contextFile){
    //context.json
    $contextStr = file_get_contents($contextFile);

    // removes last comma
    $contextStr = substr_replace(trim($contextStr) ,"",-1);

    $contextPrefix ='{ 
"@context": {
	"databus": "https://dataid.dbpedia.org/databus#",
	"dcv": "https://dataid.dbpedia.org/databus-cv#",
	"rdfs": "http://www.w3.org/2000/01/rdf-schema#",
	"dct": "http://purl.org/dc/terms/",
	"dcat": "http://www.w3.org/ns/dcat#",
	"xsd": "http://www.w3.org/2001/XMLSchema#",
	"cert": "http://www.w3.org/ns/auth/cert#",
	"dbo": "http://dbpedia.org/ontology/",
	"foaf": "http://xmlns.com/foaf/0.1/",
	"prov": "http://www.w3.org/ns/prov-o#",
	"sec": "https://w3id.org/security#",

';

    $contextStr = $contextPrefix .PHP_EOL .$contextStr .PHP_EOL ."}}";

    
    file_put_contents($contextFile, $contextStr);
}

function headerFooterShacl($shaclDir){

    //prepare shacl files
    $shaclFiles = array_diff(scandir($shaclDir), array('.', '..'));
    foreach($shaclFiles as $shaclFile){

        $shaclStr = file_get_contents("$shaclDir/$shaclFile");

        $prefixes = "@prefix dash: <http://datashapes.org/dash#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix databus: <https://dataid.dbpedia.org/databus#> .
@prefix dct:   <http://purl.org/dc/terms/> .
@prefix dcat:  <http://www.w3.org/ns/dcat#> .
@prefix dcv: <https://dataid.dbpedia.org/databus-cv#> .
@prefix dbo: <http://dbpedia.org/ontology/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix db: <https://databus.dbpedia.org/sys/ont/> .
@prefix prov: <http://www.w3.org/ns/prov-o#> .

";

        file_put_contents("$shaclDir/$shaclFile", $prefixes .$shaclStr);
    }

}


?>
