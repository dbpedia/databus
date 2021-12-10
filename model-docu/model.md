

# Model

## Group

### group
<table id="group" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
missing
```

</td><td>

```sql
<#group-exists>
          a sh:NodeShape ;
          sh:targetNode dataid:Group ;
          sh:property [
              sh:path [ sh:inversePath rdf:type ] ;
              sh:minCount 1 ;
              sh:maxCount 1;
              sh:message "Exactly one subject with an rdf:type of dataid:Group must occur."@en ;
          ] .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"@id": "%DATABUS_URI%/%ACCOUNT%/examples",
"@type": "dataid:Group",
```

</td><td>

```json
"Group": "dataid:Group",
"group": {
       "@id": "dataid:group",
       "@type": "@id"
     }
```

</td></tr></table>



### dct:title
<table id="dct:title" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dct:title
          dct:issued "2008-01-14"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A name given to the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Title"@en ;
          rdfs:range rdfs:Literal ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/title> .
```

</td><td>

```sql
<#en-title>
            a sh:PropertyShape ;
            sh:targetClass dataid:Group ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:title MUST occur at least once AND have one @en "@en ;
            sh:path dct:title ;
            sh:minCount 1 ;
            sh:languageIn ("en") ;
            sh:uniqueLang true .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"title": "Example Group" ,
```

</td><td>

```json
"title": {
    "@id": "dct:title",
    "@type": "xsd:string"
  }
```

</td></tr></table>



### dct:abstract
<table id="dct:abstract" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dct:abstract
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A summary of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Abstract"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description>, dct:description .
```

</td><td>

```sql
<#en-abstract>
          a sh:PropertyShape ;
          sh:targetClass dataid:Group ;
          sh:severity sh:Violation ;
          sh:message "Required property dct:abstract MUST occur at least once AND have one @en "@en ;
          sh:path dct:abstract ;
          sh:minCount 1 ;
          sh:languageIn ("en") ;
          sh:uniqueLang true .
        
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"abstract": "This is an example group for API testing.",
```

</td><td>

```json
"abstract": {
      "@id": "dct:abstract",
      "@type": "xsd:string",
      "@language": "en"
    }
```

</td></tr></table>



### dct:description
<table id="dct:description" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dct:description
          dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
          dct:issued "2008-01-14"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "An account of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Description"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .
```

</td><td>

```sql
<#en-description>
            a sh:PropertyShape ;
            sh:targetClass dataid:Group ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:description MUST occur at least once AND have one @en "@en ;
            sh:path dct:description ;
            sh:minCount 1 ;
            sh:languageIn ("en") ;
            sh:uniqueLang true .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"description": "This is an example group for API testing.",
```

</td><td>

```json
"description": {
      "@id": "dct:description",
      "@type": "xsd:string",
      "@language": "en"
    }
```

</td></tr></table>



## Dataset (DataId)

### dataid
<table id="dataid" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
missing
```

</td><td>

```sql
<#dataset-exists>
          a sh:NodeShape ;
          sh:targetNode dataid:Dataset ;
          sh:property [
              sh:path [ sh:inversePath rdf:type ] ;
              sh:minCount 1 ;
              sh:maxCount 1 ;
              sh:message "Exactly one subject with an rdf:type of dataid:Dataset must occur."@en ;
          ] .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"@id": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%#Dataset",
"@type": "dataid:Dataset",
```

</td><td>

```json
"Dataset": "dataid:Dataset",
```

</td></tr></table>



### dct:title
<table id="dct:title" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dct:title
          dct:issued "2008-01-14"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A name given to the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Title"@en ;
          rdfs:range rdfs:Literal ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/title> .
```

</td><td>

```sql
<#en-title>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:title MUST occur at least once AND have one @en " ;
            sh:path dct:title ;
            sh:minCount 1 ;
            sh:languageIn ("en") ;
            sh:uniqueLang true .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"title": "DBpedia Ontology Example",
```

</td><td>

```json
"title": {
    "@id": "dct:title",
    "@type": "xsd:string"
  }
```

</td></tr></table>



### dct:abstract
<table id="dct:abstract" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dct:abstract
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A summary of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Abstract"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description>, dct:description .
```

</td><td>

```sql
<#en-abstract>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:title MUST occur at least once AND have one @en "@en ;
            sh:path dct:abstract ;
            sh:minCount 1 ;
            sh:languageIn ("en") ;
            sh:uniqueLang true .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"abstract": "This is an example for API testing.",
```

</td><td>

```json
"abstract": {
      "@id": "dct:abstract",
      "@type": "xsd:string",
      "@language": "en"
    }
```

</td></tr></table>



### dct:description
<table id="dct:description" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dct:description
          dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
          dct:issued "2008-01-14"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "An account of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Description"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .
```

</td><td>

```sql
<#en-description>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:title MUST occur at least once AND have one @en "@en ;
            sh:path dct:description ;
            sh:minCount 1 ;
            sh:languageIn ("en") ;
            sh:uniqueLang true .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"description": "This is an example for API testing.",
```

</td><td>

```json
"description": {
      "@id": "dct:description",
      "@type": "xsd:string",
      "@language": "en"
    }
```

</td></tr></table>



### dct:publisher
<table id="dct:publisher" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dct:publisher
          dcam:rangeIncludes dct:Agent ;
          dct:issued "2008-01-14"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "An entity responsible for making the resource available."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Publisher"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/publisher> .
```

</td><td>

```sql
<#publisher-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:publisher MUST occur exactly once and have URI/IRI as value"@en ;
            sh:path dct:publisher;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:nodeKind sh:IRI .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"publisher": "%DATABUS_URI%/%ACCOUNT%#this",
```

</td><td>

```json
"publisher": {
      "@id": "dct:publisher",
      "@type": "@id"
    }
```

</td></tr></table>



### dataid:group
<table id="dataid:group" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
missing
```

</td><td>

```sql
missing
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"group": "%DATABUS_URI%/%ACCOUNT%/examples",
```

</td><td>

```json
"group": {
      "@id": "dataid:group",
      "@type": "@id"
    }
```

</td></tr></table>



### dataid:artifact
<table id="dataid:artifact" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
missing
```

</td><td>

```sql
missing
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"artifact": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example",
```

</td><td>

```json
"artifact": {
      "@id": "dataid:artifact",
      "@type": "@id"
    }
```

</td></tr></table>



### dataid:version
<table id="dataid:version" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
missing
```

</td><td>

```sql
<#version-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "TODO Required property dataid:version MUST occur exactly once AND have URI/IRI as value AND match pattern"@en ;
            sh:path dataid:version;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            #TODO specify version better
            # sh:pattern "^https://databus.dbpedia.org/[^\/]+/[^/]+/[^/]+/[^/]+$" ;
            # all need to comply to URI path spec ?
            # user: keycloak -> jan
            # group: maven
            # artifact: maven + some extra
            # version: maven
            sh:nodeKind sh:IRI .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"version": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%",
```

</td><td>

```json
"version": {
      "@id": "dataid:version",
      "@type": "@id"
    }
```

</td></tr></table>



### dct:hasVersion
<table id="dct:hasVersion" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dct:hasVersion
          dct:description "Changes in version imply substantive changes in content rather than differences in format. This property is intended to be used with non-literal values. This property is an inverse property of Is Version Of."@en ;
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A related resource that is a version, edition, or adaptation of the described resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Has Version"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/relation>, dct:relation .
```

</td><td>

```sql
missing
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"hasVersion": "%VERSION%",
```

</td><td>

```json
"hasVersion": {
      "@id": "dct:hasVersion",
      "@type": "xsd:string"
    }
```

</td></tr></table>



### dct:issued
<table id="dct:issued" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dct:issued
          dct:description "Recommended practice is to describe the date, date/time, or period of time as recommended for the property Date, of which this is a subproperty."@en ;
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "Date of formal issuance of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Date Issued"@en ;
          rdfs:range rdfs:Literal ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/date>, dct:date .
```

</td><td>

```sql
<#issued-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:issued MUST occur exactly once AND have xsd:dateTime as value"@en ;
            sh:path dct:issued;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:datatype xsd:dateTime .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"issued": "%NOW%",
```

</td><td>

```json
"issued": {
      "@id": "dct:issued",
      "@type": "xsd:dateTime"
    }
```

</td></tr></table>



### dct:license
<table id="dct:license" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dct:license
          dcam:rangeIncludes dct:LicenseDocument ;
          dct:description "Recommended practice is to identify the license document with a URI. If this is not possible or feasible, a literal value that identifies the license may be provided."@en ;
          dct:issued "2004-06-14"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A legal document giving official permission to do something with the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "License"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/rights>, dct:rights .
```

</td><td>

```sql
<#license-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:license MUST occur exactly once and have URI/IRI as value"@en ;
            sh:path dct:license;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:nodeKind sh:IRI .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"license": "http://creativecommons.org/licenses/by/4.0/",
```

</td><td>

```json
"license": {
      "@id": "dct:license",
      "@type": "@id"
    }
```

</td></tr></table>





## Distribution

### dcat:distribution
<table id="dcat:distribution" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dcat:Distribution
        a rdfs:Class ;
        a owl:Class ;
        rdfs:comment "A specific representation of a dataset. A dataset might be available in multiple serializations that may differ in various ways, including natural language, media-type or format, schematic organization, temporal and spatial resolution, level of detail or profiles (which might specify any or all of the above)."@en ;
        rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
        rdfs:label "Distribution"@en ;
        skos:definition "A specific representation of a dataset. A dataset might be available in multiple serializations that may differ in various ways, including natural language, media-type or format, schematic organization, temporal and spatial resolution, level of detail or profiles (which might specify any or all of the above)."@en ;
        skos:scopeNote "This represents a general availability of a dataset it implies no information about the actual access method of the data, i.e. whether by direct download, API, or through a Web page. The use of dcat:downloadURL property indicates directly downloadable distributions."@en ;
      .
```

</td><td>

```sql
<#distribution-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dcat:distribution MUST occur exactly once AND have URI/IRI as value"@en ;
            sh:path dcat:distribution;
            sh:minCount 1 ;
            sh:nodeKind sh:IRI .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"@id": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%#ontology--DEV_type=parsed_sorted.nt",
"@type": "dataid:SingleFile",
```

</td><td>

```json
"distribution": "dcat:distribution"
```

</td></tr></table>


### dct:issued
<table id="dct:issued" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dct:issued
          dct:description "Recommended practice is to describe the date, date/time, or period of time as recommended for the property Date, of which this is a subproperty."@en ;
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "Date of formal issuance of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Date Issued"@en ;
          rdfs:range rdfs:Literal ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/date>, dct:date .
```

</td><td>

```sql
<#issued-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:issued MUST occur exactly once AND have xsd:dateTime as value"@en ;
            sh:path dct:issued;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:datatype xsd:dateTime .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"issued": "%NOW%",
```

</td><td>

```json
"issued": {
      "@id": "dct:issued",
      "@type": "xsd:dateTime"
    }
```

</td></tr></table>



### dataid:file
<table id="dataid:file" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
missing
```

</td><td>

```sql
missing
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"file": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%/ontology--DEV_type=parsed_sorted.nt",
```

</td><td>

```json
"file": {
      "@id": "dataid:file",
      "@type": "@id"
    }
```

</td></tr></table>



### dataid:formatExtension
<table id="dataid:formatExtension" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
missing
```

</td><td>

```sql
<#formatExtension-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dataid:formatExtension MUST occur exactly once AND have xsd:string as value"@en ;
            sh:path dataid:formatExtension;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:datatype xsd:string .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"format": "nt",
```

</td><td>

```json
"formatExtension": {
      "@id": "dataid:formatExtension",
      "@type": "xsd:string"
    }
```

</td></tr></table>



### dataid:compression
<table id="dataid:compression" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
missing
```

</td><td>

```sql
<#compression-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dataid:compression MUST occur exactly once AND have xsd:string as value"@en ;
            sh:path dataid:compression;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:datatype xsd:string .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"compression": "none",
```

</td><td>

```json
"compression": {
      "@id": "dataid:compression",
      "@type": "xsd:string"
    }
```

</td></tr></table>



### dcat:downloadURL
<table id="dcat:downloadURL" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dcat:downloadURL
a rdf:Property ;
a owl:ObjectProperty ;
rdfs:comment "The URL of the downloadable file in a given format. E.g. CSV file or RDF file. The format is indicated by the distribution's dct:format and/or dcat:mediaType."@en ;
rdfs:domain dcat:Distribution ;
rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
rdfs:label "download URL"@en ;
skos:definition "The URL of the downloadable file in a given format. E.g. CSV file or RDF file. The format is indicated by the distribution's dct:format and/or dcat:mediaType."@en ;
.
```

</td><td>

```sql
<#downloadurl-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property  dcat:downloadURL MUST occur exactly once and have URI/IRI as value"@en ;
            sh:path dcat:downloadURL ;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:nodeKind sh:IRI .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"downloadURL": "https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/dbpedia.org/ontology--DEV/2021.07.09-070001/ontology--DEV_type=parsed_sorted.nt",
```

</td><td>

```json
"downloadURL": {
      "@id": "dcat:downloadURL",
      "@type": "@id"
    }
```

</td></tr></table>



### dcat:byteSize


### dataid:sha256sum
<table id="dataid:sha256sum" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
missing
```

</td><td>

```sql
<#sha256sum-violation>
        #   dataid:sha256sum         "49b0f2dd5bb6c1dcdbbb935dbc4463218d570b4b4499da081e07a2d52c60ceab"^^xsd:string ;
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dataid:sha256sum MUST occur exactly once AND have xsd:string as value AND match pattern ^[a-f0-9]{64}$"@en ;
            sh:path dataid:sha256sum;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:datatype xsd:string ;
            sh:pattern "^[a-f0-9]{64}$" .
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"sha256sum": "b3aa40e4a832e69ebb97680421fbeff968305931dafdb069a8317ac120af0380",
```

</td><td>

```json
"sha256sum": {
      "@id": "dataid:sha256sum",
      "@type": "xsd:string"
    }
```

</td></tr></table>


### dct:hasVersion
<table id="dct:hasVersion" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr><tr><td>

```sql
dct:hasVersion
          dct:description "Changes in version imply substantive changes in content rather than differences in format. This property is intended to be used with non-literal values. This property is an inverse property of Is Version Of."@en ;
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A related resource that is a version, edition, or adaptation of the described resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Has Version"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/relation>, dct:relation .
```

</td><td>

```sql
missing
```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"hasVersion": "%VERSION%",
```

</td><td>

```json
"hasVersion": {
      "@id": "dct:hasVersion",
      "@type": "xsd:string"
    }
```

</td></tr></table>





