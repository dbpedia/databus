<?php 
/*
sudo apt install php7.4-cli
sudo apt install pandoc
php model.php > model.md
pandoc -f markdown model.md | tidy -i > model.html


*/
function table ($id, $owl,$shacl,$example,$context){
	
?>	
<table id="<?=$id?>" border=1px >
<tr>
<td> OWL </td> <td> SHACL </td>
</tr>
<tr>	
	
<td> 
	
```sql
<?=$owl?>    
```

<span id="<?="owl|$id"?>" style="visibility: hidden;" ><?=str_replace("@","&#64;",htmlentities($owl))?></span>

</td>
<td>

```sql
<?=$shacl?>    
```

<span id="<?="shacl|$id"?>" style="visibility: hidden;" ><?=str_replace("@","&#64;",htmlentities($shacl))?></span>
</td>
</tr>
<tr>
<td> 

```json	
<?=$example?>    
```

<span id="<?="example|$id"?>" style="visibility: hidden;" ><?=str_replace("@","&#64;",htmlentities($example))?></span>

</td>
<td>

```json
<?=$context?>    
```

<span id="<?="context|$id"?>" style="visibility: hidden;" ><?=str_replace("@","&#64;",htmlentities($context))?></span>

</td>
</tr>
</table>
<?php	
	}

?>


# Model


## Group

## Dataset

## Distribution

<?php 

$owl='dcat:byteSize
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
  sh:minCount 1 .';


$example='"byteSize": "4439722" ,';

$context='"byteSize": {
    "@id": "dcat:byteSize",
    "@type": "xsd:decimal"
  },';



table("dcat:bytesize",$owl,$shacl,$example,$context);

?>
