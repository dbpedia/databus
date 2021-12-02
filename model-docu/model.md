

# Model

## Group

## Dataset (DataId)

## Distribution

### dcat:bytesize	
<table id="dcat:bytesize" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td> 
	
```sql
# excerpt from https://www.w3.org/ns/dcat2.ttl 
dcat:byteSize
  a rdf:Property ;
  a owl:DatatypeProperty ;
  rdfs:comment "The size of a distribution in bytes."@en ;
  rdfs:domain dcat:Distribution ;
  rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
  rdfs:label "byte size"@en ;
  rdfs:range rdfs:Literal ;
  skos:definition "The size of a distribution in bytes."@en ;
  skos:scopeNote "The size in bytes can be approximated when the precise size is not known. The literal value of dcat:byteSize should by typed as xsd:decimal."@en ;    
```

</td><td>

```sql
<#has-bytesize>   
  a sh:PropertyShape ;
  sh:targetClass dataid:SingleFile ;
  sh:severity sh:Violation ;
  sh:message "A dataid:SingleFile MUST have exactly one dct:byteSize of type xsd:decimal"@en ;
  sh:path dcat:byteSize ;
  sh:datatype xsd:decimal ;
  sh:maxCount 1 ;
  sh:minCount 1 .    
```

</td></tr><tr><td> 

```json	
"byteSize": "4439722" ,    
```

</td><td>

```json
"byteSize": {
    "@id": "dcat:byteSize",
    "@type": "xsd:decimal"
  },    
```

</td></tr></table>
