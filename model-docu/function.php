<?php

function init ($contextFile, $shaclDir, $examplesDir){
    unlink($contextFile);
    
    array_map('unlink', glob("$shaclDir/*.*"));
    @rmdir($shaclDir);
    mkdir($shaclDir, 0777, true);
    
    array_map('unlink', glob("$examplesDir/*.*"));
    @rmdir($examplesDir);
    mkdir($examplesDir, 0777, true);
    }
    
    
function headerFooter($contextFile, $shaclDir){
    //context.json
    $fileContent = file_get_contents($contextFile);
    $fileContent = substr_replace($fileContent ,"",-2);
    $fileContent = "{" .PHP_EOL .$fileContent .PHP_EOL ."}";
    file_put_contents($contextFile, $fileContent);

    //prepare shacl files
    $shaclFiles = array_diff(scandir($shaclDir), array('.', '..'));
    foreach($shaclFiles as $shaclFile){

        $fileContent = file_get_contents("$shaclDir/$shaclFile");

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

        file_put_contents("$shaclDir/$shaclFile", $prefixes .$fileContent);
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

	if($section === "distribution" ) {
		$section = "dataid";
	}

	file_put_contents("$examplesDir/$section.example.jsonld",$example .PHP_EOL,FILE_APPEND);
?>

<table id="<?=$id?>" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
<?=$owl?>
```

</td><td>

```sql
<?=$shacl?>
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
<?=$example?>
```

</td><td>

```json
<?=$context?>
```

</td></tr></table>

<?php
	}

?>
