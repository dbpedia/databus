<?php

function init (){
    global $contextFile, $markDownFile, $shaclDir, $examplesDir;

    @unlink($contextFile);
    @unlink($markDownFile);

    array_map('unlink', glob("$shaclDir/*.*"));
    @rmdir($shaclDir);
    mkdir($shaclDir, 0777, true);
    
    array_map('unlink', glob("$examplesDir/*.*"));
    @rmdir($examplesDir);
    mkdir($examplesDir, 0777, true);

    $mdString = "# Model";
    file_put_contents($markDownFile, $mdString .PHP_EOL.PHP_EOL, FILE_APPEND);
}

    
function headerFooter($contextFile, $shaclDir){
    //context.json
    $contextStr = file_get_contents($contextFile);
    $contextStr = substr_replace($contextStr ,"",-2);

    $contextPrefix ='
    {
        "@language": "en",
        "dataid": "http://dataid.dbpedia.org/ns/core#",
        "databus": "https://databus.dbpedia.org/system/ontology#",
        "dcv": "http://dataid.dbpedia.org/ns/cv#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "dct": "http://purl.org/dc/terms/",
        "dcat": "http://www.w3.org/ns/dcat#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "cert": "http://www.w3.org/ns/auth/cert#",
        "dbo": "http://dbpedia.org/ontology/",
        "foaf": "http://xmlns.com/foaf/0.1/",
        "sec": "https://w3id.org/security#",

    ';
    
    $contextStr = $contextPrefix .PHP_EOL .$contextStr .PHP_EOL ."}";
    file_put_contents($contextFile, $contextStr);



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
@prefix dataid: <http://dataid.dbpedia.org/ns/core#> .
@prefix dct:   <http://purl.org/dc/terms/> .
@prefix dcat:  <http://www.w3.org/ns/dcat#> .
@prefix dcv: <http://dataid.dbpedia.org/ns/cv#> .
@prefix db: <https://databus.dbpedia.org/sys/ont/> .

";

        file_put_contents("$shaclDir/$shaclFile", $prefixes .$shaclStr);
    }

}

function table ($section, $id, $owl, $shacl, $example, $context){
    global $contextFile, $shaclDir, $examplesDir;


    if ($shacl != 'missing') {
	    file_put_contents("$shaclDir/$section.shacl",$shacl .PHP_EOL .PHP_EOL,FILE_APPEND);
    }

    if ($context !== "missing"){
	    file_put_contents($contextFile,$context ."," .PHP_EOL,FILE_APPEND);
    }

	file_put_contents("$examplesDir/$section.example.jsonld",$example .PHP_EOL,FILE_APPEND);

    writeMd($section, $id, $owl, $shacl, $example, $context);

}


function renderjson($example,$context){
	return "```json
# Example:
$example

#Context:
$context
```";
	}

function renderrdf($owl,$shacl){
	return "```sql
#OWL
$owl

#SHACL:
$shacl
```";
	}


function writeMd($section, $id, $owl, $shacl, $example, $context){
    global $markDownFile;

	$mdString="### $id
	
".renderjson($example,$context)."
	
".renderrdf($owl,$shacl);
	

    //check if new section
    $arrayOfLines = file($markDownFile);
    $sections = preg_grep('/^## /', $arrayOfLines);
    $lastSection = end($sections);
    $lastSection = str_replace("## ", "", $lastSection);
    $lastSection = trim($lastSection);

    $thisSection = ucfirst($section);



    if (strcmp($lastSection, $thisSection) !== 0) {
        $mdString = "## $thisSection" .PHP_EOL.PHP_EOL . $mdString;
    }


    file_put_contents($markDownFile, $mdString .PHP_EOL, FILE_APPEND);
}

?>



