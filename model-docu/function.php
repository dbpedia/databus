<?php

function init ($contextFile, $shaclDir, $examplesDir){
    unlink($contextFile);
    array_map('unlink', glob("$shaclDir/*.*"));
    @rmdir($shaclDir);
    array_map('unlink', glob("$examplesDir/*.*"));
    @rmdir($examplesDir);
    mkdir($shaclDir, 0777, true);
    mkdir($examplesDir, 0777, true);
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
