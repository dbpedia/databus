<?php 
/*
sudo apt install php7.4-cli
php model.php > model.md

Goal:
* php script is a template to fill a markdown doc (stdout)
* also generates context, shacl and example (these are the Single Source of Truth files) 
* OWL should be taken from dataid, dct, dcat, etc. SSoT is elsewhere

Success criteria:
* context.json, shacl and example have a correct syntax.
* model.md renders well and looks pretty


TODO 1 Preparation Fabian:
* remove @value and @language from databus/example/generate-example_slim.sh
<"title": { "@value" : "Example Group", "@language" : "en" },
>"title": "Example Group",
* generate new example file

TODO 2 Fabian
* migrate all content in model.php from ontologies, ../context.json, example file (generated from "slim") and server/app/common/shacl/   
* follow the order of example file in this doc
* do header/footer for the generated files so they are valid



Other attempts (outdated html conversion):
sudo apt install pandoc
pandoc -f markdown model.md | tidy -i > model.html
<span id="<?="context|$id"?>" style="visibility: hidden;" ><?=str_replace("@","&#64;",htmlentities($context))?></span>

*/
function table ($section, $id, $owl,$shacl,$example,$context){
	file_put_contents("context.json",$context,FILE_APPEND);
	file_put_contents("$section.shacl",$shacl,FILE_APPEND);
	if($section === "distribution" ) {
		$section = "dataid";
		}
	file_put_contents("$section.example.jsonld",$example,FILE_APPEND);
	
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

</td></tr><tr><td> 

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


# Model

<?php $section="group" ?>
## Group

### <?=$id="dct:title" ?>

<?php 

//$owl=
//$shacl=
//$example=
//$context=

//table()

?>

### <?=$id="dct:abstract" ?>

### <?=$id="dct:description" ?>


<?php $section="dataid" ?>
## Dataset (DataId)

<?php $section="distribution" ?>
## Distribution

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


$example='"byteSize": "4439722" ,';

$context='"byteSize": {
    "@id": "dcat:byteSize",
    "@type": "xsd:decimal"
  },';

table($section,$id,$owl,$shacl,$example,$context);

?>
