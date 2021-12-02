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

## Group
### <?=$id="group" ?>
<?php
$owl='';

$shacl='<#group-exists>
          a sh:NodeShape ;
          sh:targetNode dataid:Group ;
          sh:property [
              sh:path [ sh:inversePath rdf:type ] ;
              sh:minCount 1 ;
              sh:maxCount 1;
              sh:message "Exactly one subject with an rdf:type of dataid:Group must occur."@en ;
          ] .';

$example='';

$context='"maker": {
      "@id": "foaf:maker",
      "@type": "@id"
    }';
?>

### <?=$id="dct:title" ?>
<?php 

$owl='';

$shacl='<#en-title>
            a sh:PropertyShape ;
            sh:targetClass dataid:Group ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:title MUST occur at least once AND have one @en "@en ;
            sh:path dct:title ;
            sh:minCount 1 ;
            sh:languageIn ("en") ;
            sh:uniqueLang true .';

$example='';

$context='';

//

?>

### <?=$id="dct:abstract" ?>
<?php
$owl='';

$shacl='<#en-abstract>
          a sh:PropertyShape ;
          sh:targetClass dataid:Group ;
          sh:severity sh:Violation ;
          sh:message "Required property dct:abstract MUST occur at least once AND have one @en "@en ;
          sh:path dct:abstract ;
          sh:minCount 1 ;
          sh:languageIn ("en") ;
          sh:uniqueLang true .
        ';

$example='';

$context='';
?>

### <?=$id="dct:description" ?>
<?php
$owl='';

$shacl='<#en-description>
            a sh:PropertyShape ;
            sh:targetClass dataid:Group ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:description MUST occur at least once AND have one @en "@en ;
            sh:path dct:description ;
            sh:minCount 1 ;
            sh:languageIn ("en") ;
            sh:uniqueLang true .';

$example='';

$context='';
?>

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

?>


### <?=$id="foaf:maker" ?>
<?php
$owl='';

$shacl='';

$example='';

$context='"maker": {
      "@id": "foaf:maker",
      "@type": "@id"
    }';
?>


### <?=$id="dcat:bytesize" ?>
<?php

$owl='';

$shacl='';

$example='';

$context='"primaryTopic": {
      "@id": "foaf:primaryTopic",
      "@type": "@id"
    }';

?>


### <?=$id="dcat:bytesize" ?>
<?php

$owl='';

$shacl='';

$example='';

$context='"name": {
      "@id": "foaf:name",
      "@type": "xsd:string"
    }';

?>


### <?=$id="foaf:account" ?>
<?php

$owl='';

$shacl='';

$example='';

$context='"account": {
      "@id": "foaf:account",
      "@type": "@id"
    }';

?>


### <?=$id="dcat:bytesize" ?>
<?php

$owl='';

$shacl='';

$example='';

$context='';

?>


### <?=$id="dcat:bytesize" ?>
<?php

$owl='';

$shacl='';

$example='';

$context='';

?>


### <?=$id="dcat:bytesize" ?>
<?php

$owl='';

$shacl='';

$example='';

$context='';

?>


### <?=$id="dcat:bytesize" ?>
<?php

$owl='';

$shacl='';

$example='';

$context='';

?>

,
,

,
  "img": {
    "@id": "foaf:img",
    "@type": "@id"
  },
  "key": {
    "@id": "cert:key"
  },
  "modulus": {
    "@id": "cert:modulus"
  },
  "exponent": {
    "@id": "cert:exponent"
  },
  "title": {
    "@id": "dct:title",
    "@type": "xsd:string"
  },
  "label": {
    "@id": "rdfs:label",
    "@type": "xsd:string"
  },
  "comment": {
    "@id": "rdfs:comment",
    "@type": "xsd:string"
  },
  "abstract": {
    "@id": "dct:abstract",
    "@type": "xsd:string",
    "@language": "en"
  },
  "description": {
    "@id": "dct:description",
    "@type": "xsd:string",
    "@language": "en"
  },
  "issued": {
    "@id": "dct:issued",
    "@type": "xsd:dateTime"
  },
  "modified": {
    "@id": "dct:modified",
    "@type": "xsd:dateTime"
  },
  "license": {
    "@id": "dct:license",
    "@type": "@id"
  },
  "publisher": {
    "@id": "dct:publisher",
    "@type": "@id"
  },
  "distribution": "dcat:distribution",
  "downloadURL": {
    "@id": "dcat:downloadURL",
    "@type": "@id"
  },
  "file": {
    "@id": "dataid:file",
    "@type": "@id"
  },
  "byteSize": {
    "@id": "dcat:byteSize",
    "@type": "xsd:decimal"
  },
  "group": {
    "@id": "dataid:group",
    "@type": "@id"
  },
  "Group": "dataid:Group",
  "Dataset": "dataid:Dataset",
  "Artifact": "dataid:Artifact",
  "artifact": {
    "@id": "dataid:artifact",
    "@type": "@id"
  },
  "version": {
    "@id": "dataid:version",
    "@type": "@id"
  },
  "hasVersion": {
    "@id": "dct:hasVersion",
    "@type": "xsd:string"
  },
  "formatExtension": {
    "@id": "dataid:formatExtension",
    "@type": "xsd:string"
  },
  "format": {
    "@id": "dataid:formatExtension",
    "@type": "xsd:string"
  },
  "compression": {
    "@id": "dataid:compression",
    "@type": "xsd:string"
  },
  "sha256sum": {
    "@id": "dataid:sha256sum",
    "@type": "xsd:string"
  },
  "signature": {
    "@id": "dataid:signature",
    "@type": "xsd:string"
  },
  "tractate": {
    "@id": "databus:tractate",
    "@type": "xsd:string"
  }

table($section,$id,$owl,$shacl,$example,$context);

?>
