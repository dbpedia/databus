

# Model

## Group

### group

<table id="group" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
missing```

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
          ] .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
dataid:Group```

</td><td>

```json
"group": {
       "@id": "dataid:group",
       "@type": "@id"
     }```

</td></tr></table>



### dct:title

<table id="dct:title" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dct:title
          dct:issued "2008-01-14"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A name given to the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Title"@en ;
          rdfs:range rdfs:Literal ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/title> .```

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
            sh:uniqueLang true .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
Example Group```

</td><td>

```json
"title": {
    "@id": "dct:title",
    "@type": "xsd:string"
  }```

</td></tr></table>



### dct:abstract

<table id="dct:abstract" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dct:abstract
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A summary of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Abstract"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description>, dct:description .```

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
This is an example group for API testing.```

</td><td>

```json
"abstract": {
      "@id": "dct:abstract",
      "@type": "xsd:string",
      "@language": "en"
    }```

</td></tr></table>



### dct:description

<table id="dct:description" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dct:description
          dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
          dct:issued "2008-01-14"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "An account of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Description"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .```

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
            sh:uniqueLang true .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
This is an example group for API testing.```

</td><td>

```json
"description": {
      "@id": "dct:description",
      "@type": "xsd:string",
      "@language": "en"
    }```

</td></tr></table>



## Dataset (DataId)

### dct:title

<table id="dct:title" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dct:title
          dct:issued "2008-01-14"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A name given to the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Title"@en ;
          rdfs:range rdfs:Literal ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/title> .```

</td><td>

```sql
<#en-title>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:title MUST occur at least once AND have one @en " ;
            sh:path dct:title ;
            sh:minCount 1 ;
            sh:languageIn ("en") ;
            sh:uniqueLang true .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
DBpedia Ontology Example```

</td><td>

```json
"title": {
    "@id": "dct:title",
    "@type": "xsd:string"
  }```

</td></tr></table>



### dct:abstract

<table id="dct:abstract" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dct:abstract
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A summary of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Abstract"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description>, dct:description .```

</td><td>

```sql
<#en-abstract>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:title MUST occur at least once AND have one @en "@en ;
            sh:path dct:abstract ;
            sh:minCount 1 ;
            sh:languageIn ("en") ;
            sh:uniqueLang true .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
This is an example group for API testing.```

</td><td>

```json
"abstract": {
      "@id": "dct:abstract",
      "@type": "xsd:string",
      "@language": "en"
    }```

</td></tr></table>



### dct:description

<table id="dct:description" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dct:description
          dct:description "Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource."@en ;
          dct:issued "2008-01-14"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "An account of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Description"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/description> .```

</td><td>

```sql
<#en-description>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:title MUST occur at least once AND have one @en "@en ;
            sh:path dct:description ;
            sh:minCount 1 ;
            sh:languageIn ("en") ;
            sh:uniqueLang true .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
This is an example for API testing.```

</td><td>

```json
"description": {
      "@id": "dct:description",
      "@type": "xsd:string",
      "@language": "en"
    }```

</td></tr></table>



### dct:publisher

<table id="dct:publisher" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dct:publisher
          dcam:rangeIncludes dct:Agent ;
          dct:issued "2008-01-14"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "An entity responsible for making the resource available."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Publisher"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/publisher> .```

</td><td>

```sql
<#publisher-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:publisher MUST occur exactly once and have URI/IRI as value"@en ;
            sh:path dct:publisher;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:nodeKind sh:IRI .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
%DATABUS_URI%/%ACCOUNT%#this```

</td><td>

```json
"publisher": {
      "@id": "dct:publisher",
      "@type": "@id"
    }```

</td></tr></table>



### dataid:group

<table id="dataid:group" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
missing```

</td><td>

```sql
missing```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
%DATABUS_URI%/%ACCOUNT%/examples```

</td><td>

```json
"group": {
      "@id": "dataid:group",
      "@type": "@id"
    }```

</td></tr></table>



### dataid:artifact

<table id="dataid:artifact" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
missing```

</td><td>

```sql
missing```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example```

</td><td>

```json
"artifact": {
      "@id": "dataid:artifact",
      "@type": "@id"
    }```

</td></tr></table>



### dataid:version

<table id="dataid:version" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
missing```

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
            sh:nodeKind sh:IRI .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%```

</td><td>

```json
"version": {
      "@id": "dataid:version",
      "@type": "@id"
    }```

</td></tr></table>



### dct:hasVersion

<table id="dct:hasVersion" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dct:hasVersion
          dct:description "Changes in version imply substantive changes in content rather than differences in format. This property is intended to be used with non-literal values. This property is an inverse property of Is Version Of."@en ;
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A related resource that is a version, edition, or adaptation of the described resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Has Version"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/relation>, dct:relation .```

</td><td>

```sql
missing```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
%VERSION%```

</td><td>

```json
"hasVersion": {
      "@id": "dct:hasVersion",
      "@type": "xsd:string"
    }```

</td></tr></table>



### dct:issued

<table id="dct:issued" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dct:issued
          dct:description "Recommended practice is to describe the date, date/time, or period of time as recommended for the property Date, of which this is a subproperty."@en ;
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "Date of formal issuance of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Date Issued"@en ;
          rdfs:range rdfs:Literal ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/date>, dct:date .```

</td><td>

```sql
<#issued-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:issued MUST occur exactly once AND have xsd:dateTime as value"@en ;
            sh:path dct:issued;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:datatype xsd:dateTime .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
%NOW%```

</td><td>

```json
"issued": {
      "@id": "dct:issued",
      "@type": "xsd:dateTime"
    }```

</td></tr></table>



### dct:license

<table id="dct:license" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dct:license
          dcam:rangeIncludes dct:LicenseDocument ;
          dct:description "Recommended practice is to identify the license document with a URI. If this is not possible or feasible, a literal value that identifies the license may be provided."@en ;
          dct:issued "2004-06-14"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A legal document giving official permission to do something with the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "License"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/rights>, dct:rights .```

</td><td>

```sql
<#license-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:license MUST occur exactly once and have URI/IRI as value"@en ;
            sh:path dct:license;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:nodeKind sh:IRI .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
http://creativecommons.org/licenses/by/4.0/```

</td><td>

```json
"license": {
      "@id": "dct:license",
      "@type": "@id"
    }```

</td></tr></table>



### dcat:distribution

<table id="dcat:distribution" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dcat:Distribution
        a rdfs:Class ;
        a owl:Class ;
        rdfs:comment "A specific representation of a dataset. A dataset might be available in multiple serializations that may differ in various ways, including natural language, media-type or format, schematic organization, temporal and spatial resolution, level of detail or profiles (which might specify any or all of the above)."@en ;
        rdfs:comment "Konkrétní reprezentace datové sady. Datová sada může být dostupná v různých serializacích, které se mohou navzájem lišit různými způsoby, mimo jiné přirozeným jazykem, media-typem či formátem, schematickou organizací, časovým a prostorovým rozlišením, úrovní detailu či profily (které mohou specifikovat některé či všechny tyto rozdíly)."@cs ;
        rdfs:comment "Rappresenta una forma disponibile e specifica del dataset. Ciascun dataset può essere disponibile in forme differenti, che possono rappresentare formati diversi o diversi punti di accesso per un dataset. Esempi di distribuzioni sono un file CSV scaricabile, una API o un RSS feed."@it ;
        rdfs:comment "Représente une forme spécifique d'un jeu de données. Caque jeu de données peut être disponible sous différentes formes, celles-ci pouvant représenter différents formats du jeu de données ou différents endpoint. Des exemples de distribution sont des fichirs CSV, des API ou des flux RSS."@fr ;
        rdfs:comment "Una representación específica de los datos. Cada conjunto de datos puede estar disponible en formas diferentes, las cuáles pueden variar en distintas formas, incluyendo el idioma, 'media-type' o formato, organización esquemática, resolución temporal y espacial, nivel de detalle o perfiles (que pueden especificar cualquiera o todas las diferencias anteriores)."@es ;
        rdfs:comment "Αναπαριστά μία συγκεκριμένη διαθέσιμη μορφή ενός συνόλου δεδομένων. Κάθε σύνολο δεδομενων μπορεί να είναι διαθέσιμο σε διαφορετικές μορφές, οι μορφές αυτές μπορεί να αναπαριστούν διαφορετικές μορφές αρχείων ή διαφορετικά σημεία διάθεσης. Παραδείγματα διανομών συμπεριλαμβάνουν ένα μεταφορτώσιμο αρχείο μορφής CSV, ένα API ή ένα RSS feed."@el ;
        rdfs:comment "شكل محدد لقائمة البيانات يمكن الوصول إليه. قائمة بيانات ما يمكن أن تكون متاحه باشكال و أنواع متعددة.  ملف يمكن تحميله أو واجهة برمجية يمكن من خلالها الوصول إلى البيانات هي أمثلة على ذلك."@ar ;
        rdfs:comment "データセットの特定の利用可能な形式を表わします。各データセットは、異なる形式で利用できることがあり、これらの形式は、データセットの異なる形式や、異なるエンドポイントを表わす可能性があります。配信の例には、ダウンロード可能なCSVファイル、API、RSSフィードが含まれます。"@ja ;
        rdfs:comment "En specifik repræsentation af et datasæt. Et datasæt kan være tilgængelig i mange serialiseringer der kan variere på forskellige vis, herunder sprog, medietype eller format, systemorganisering, tidslig- og geografisk opløsning, detaljeringsniveau eller profiler (der kan specificere en eller flere af ovenstående)."@da ;
        rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
        rdfs:label "Distribuce"@cs ;
        rdfs:label "Distribución"@es ;
        rdfs:label "Distribution"@en ;
        rdfs:label "Distribution"@fr ;
        rdfs:label "Distribuzione"@it ;
        rdfs:label "Διανομή"@el ;
        rdfs:label "التوزيع"@ar ;
        rdfs:label "配信"@ja ;
        rdfs:label "Distribution"@da ;
        skos:altLabel "Datadistribution"@da ;
        skos:altLabel "Datarepræsentation"@da ;
        skos:altLabel "Datamanifestation"@da ;
        skos:altLabel "Dataudstilling"@da ;
        skos:definition "A specific representation of a dataset. A dataset might be available in multiple serializations that may differ in various ways, including natural language, media-type or format, schematic organization, temporal and spatial resolution, level of detail or profiles (which might specify any or all of the above)."@en ;
        skos:definition "Konkrétní reprezentace datové sady. Datová sada může být dostupná v různých serializacích, které se mohou navzájem lišit různými způsoby, mimo jiné přirozeným jazykem, media-typem či formátem, schematickou organizací, časovým a prostorovým rozlišením, úrovní detailu či profily (které mohou specifikovat některé či všechny tyto rozdíly)."@cs ;
        skos:definition "Rappresenta una forma disponibile e specifica del dataset. Ciascun dataset può essere disponibile in forme differenti, che possono rappresentare formati diversi o diversi punti di accesso per un dataset. Esempi di distribuzioni sono un file CSV scaricabile, una API o un RSS feed."@it ;
        skos:definition "Représente une forme spécifique d'un jeu de données. Caque jeu de données peut être disponible sous différentes formes, celles-ci pouvant représenter différents formats du jeu de données ou différents endpoint. Des exemples de distribution sont des fichirs CSV, des API ou des flux RSS."@fr ;
        skos:definition "Una representación específica de los datos. Cada conjunto de datos puede estar disponible en formas diferentes, las cuáles pueden variar en distintas formas, incluyendo el idioma, 'media-type' o formato, organización esquemática, resolución temporal y espacial, nivel de detalle o perfiles (que pueden especificar cualquiera o todas las diferencias anteriores)."@es ;
        skos:definition "Αναπαριστά μία συγκεκριμένη διαθέσιμη μορφή ενός συνόλου δεδομένων. Κάθε σύνολο δεδομενων μπορεί να είναι διαθέσιμο σε διαφορετικές μορφές, οι μορφές αυτές μπορεί να αναπαριστούν διαφορετικές μορφές αρχείων ή διαφορετικά σημεία διάθεσης. Παραδείγματα διανομών συμπεριλαμβάνουν ένα μεταφορτώσιμο αρχείο μορφής CSV, ένα API ή ένα RSS feed."@el ;
        skos:definition "شكل محدد لقائمة البيانات يمكن الوصول إليه. قائمة بيانات ما يمكن أن تكون متاحه باشكال و أنواع متعددة.  ملف يمكن تحميله أو واجهة برمجية يمكن من خلالها الوصول إلى البيانات هي أمثلة على ذلك."@ar ;
        skos:definition "データセットの特定の利用可能な形式を表わします。各データセットは、異なる形式で利用できることがあり、これらの形式は、データセットの異なる形式や、異なるエンドポイントを表わす可能性があります。配信の例には、ダウンロード可能なCSVファイル、API、RSSフィードが含まれます。"@ja ;
        skos:definition "En specifik repræsentation af et datasæt. Et datasæt kan være tilgængelig i mange serialiseringer der kan variere på forskellige vis, herunder sprog, medietype eller format, systemorganisering, tidslig- og geografisk opløsning, detaljeringsniveau eller profiler (der kan specificere en eller flere af ovenstående)."@da ;
        skos:scopeNote "Ceci représente une disponibilité générale du jeu de données, et implique qu'il n'existe pas d'information sur la méthode d'accès réelle des données, par exple, si c'est un lien de téléchargement direct ou à travers une page Web."@fr ;
        skos:scopeNote "Esta clase representa una disponibilidad general de un conjunto de datos, e implica que no existe información acerca del método de acceso real a los datos, i.e., si es un enlace de descarga directa o a través de una página Web."@es ;
        skos:scopeNote "Questa classe rappresenta una disponibilità generale di un dataset e non implica alcuna informazione sul metodo di accesso effettivo ai dati, ad esempio se si tratta di un accesso a download diretto, API, o attraverso una pagina Web. L'utilizzo della proprietà dcat:downloadURL indica distribuzioni direttamente scaricabili."@it ;
        skos:scopeNote "This represents a general availability of a dataset it implies no information about the actual access method of the data, i.e. whether by direct download, API, or through a Web page. The use of dcat:downloadURL property indicates directly downloadable distributions."@en ;
        skos:scopeNote "Toto popisuje obecnou dostupnost datové sady. Neimplikuje žádnou informaci o skutečné metodě přístupu k datům, tj. zda jsou přímo ke stažení, skrze API či přes webovou stránku. Použití vlastnosti dcat:downloadURL indikuje přímo stažitelné distribuce."@cs ;
        skos:scopeNote "Αυτό αναπαριστά μία γενική διαθεσιμότητα ενός συνόλου δεδομένων και δεν υπονοεί τίποτα περί του πραγματικού τρόπου πρόσβασης στα δεδομένα, αν είναι άμεσα μεταφορτώσιμα, μέσω API ή μέσω μίας ιστοσελίδας. Η χρήση της ιδιότητας dcat:downloadURL δείχνει μόνο άμεσα μεταφορτώσιμες διανομές."@el ;
        skos:scopeNote "これは、データセットの一般的な利用可能性を表わし、データの実際のアクセス方式に関する情報（つまり、直接ダウンロードなのか、APIなのか、ウェブページを介したものなのか）を意味しません。dcat:downloadURLプロパティーの使用は、直接ダウンロード可能な配信を意味します。"@ja ;
        skos:scopeNote "Denne klasse repræsenterer datasættets overordnede tilgængelighed og giver ikke oplysninger om hvilken metode der kan anvendes til at få adgang til data, dvs. om adgang til datasættet realiseres ved direkte download, API eller via et websted. Anvendelsen af egenskaben dcat:downloadURL indikerer at distributionen kan downloades direkte."@da ;
      .```

</td><td>

```sql
<#distribution-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dcat:distribution MUST occur exactly once AND have URI/IRI as value"@en ;
            sh:path dcat:distribution;
            sh:minCount 1 ;
            sh:nodeKind sh:IRI .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
```

</td><td>

```json
"distribution": "dcat:distribution"```

</td></tr></table>



## Distribution

### dct:issued

<table id="dct:issued" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dct:issued
          dct:description "Recommended practice is to describe the date, date/time, or period of time as recommended for the property Date, of which this is a subproperty."@en ;
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "Date of formal issuance of the resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Date Issued"@en ;
          rdfs:range rdfs:Literal ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/date>, dct:date .```

</td><td>

```sql
<#issued-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dct:issued MUST occur exactly once AND have xsd:dateTime as value"@en ;
            sh:path dct:issued;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:datatype xsd:dateTime .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
%NOW%```

</td><td>

```json
"issued": {
      "@id": "dct:issued",
      "@type": "xsd:dateTime"
    }```

</td></tr></table>



### dataid:file

<table id="dataid:file" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
missing```

</td><td>

```sql
missing```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%/ontology--DEV_type=parsed_sorted.nt```

</td><td>

```json
"file": {
      "@id": "dataid:file",
      "@type": "@id"
    }```

</td></tr></table>



### dataid:formatExtension

<table id="dataid:formatExtension" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
missing```

</td><td>

```sql
<#formatExtension-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dataid:formatExtension MUST occur exactly once AND have xsd:string as value"@en ;
            sh:path dataid:formatExtension;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:datatype xsd:string .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
nt```

</td><td>

```json
"formatExtension": {
      "@id": "dataid:formatExtension",
      "@type": "xsd:string"
    }```

</td></tr></table>



### dataid:compression

<table id="dataid:compression" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
missing```

</td><td>

```sql
<#compression-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property dataid:compression MUST occur exactly once AND have xsd:string as value"@en ;
            sh:path dataid:compression;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:datatype xsd:string .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
none```

</td><td>

```json
"compression": {
      "@id": "dataid:compression",
      "@type": "xsd:string"
    }```

</td></tr></table>



### dcat:downloadURL

<table id="dcat:downloadURL" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dcat:downloadURL
  a rdf:Property ;
  a owl:ObjectProperty ;
  rdfs:comment "Ceci est un lien direct à un fichier téléchargeable en un format donnée. Exple fichier CSV ou RDF. Le format est décrit par les propriétés de distribution dct:format et/ou dcat:mediaType."@fr ;
  rdfs:comment "La URL de un archivo descargable en el formato dato. Por ejemplo, archivo CSV o archivo RDF. El formato se describe con las propiedades de la distribución dct:format y/o dcat:mediaType."@es ;
  rdfs:comment "Questo è un link diretto al file scaricabile in un dato formato. E.g. un file CSV o un file RDF. Il formato è descritto dal dct:format e/o dal dcat:mediaType della distribuzione."@it ;
  rdfs:comment "The URL of the downloadable file in a given format. E.g. CSV file or RDF file. The format is indicated by the distribution's dct:format and/or dcat:mediaType."@en ;
  rdfs:comment "URL souboru ke stažení v daném formátu, například CSV nebo RDF soubor. Formát je popsán vlastností distribuce dct:format a/nebo dcat:mediaType."@cs ;
  rdfs:comment "dcat:downloadURLはdcat:accessURLの特定の形式です。しかし、DCATプロファイルが非ダウンロード・ロケーションに対してのみaccessURLを用いる場合には、より強い分離を課すことを望む可能性があるため、この含意を強化しないように、DCATは、dcat:downloadURLをdcat:accessURLのサブプロパティーであると定義しません。"@ja ;
  rdfs:comment "Είναι ένας σύνδεσμος άμεσης μεταφόρτωσης ενός αρχείου σε μια δεδομένη μορφή. Π.χ. ένα αρχείο CSV ή RDF. Η μορφη αρχείου περιγράφεται από τις ιδιότητες dct:format ή/και dcat:mediaType της διανομής."@el ;
  rdfs:comment "رابط مباشر لملف يمكن تحميله. نوع الملف يتم توصيفه باستخدام الخاصية dct:format dcat:mediaType "@ar ;
  rdfs:comment "URL til fil der kan downloades i et bestemt format. Fx en CSV-fil eller en RDF-fil. Formatet for distributionen angives ved hjælp af egenskaberne dct:format og/eller dcat:mediaType."@da ;
  rdfs:domain dcat:Distribution ;
  rdfs:isDefinedBy <http://www.w3.org/TR/vocab-dcat/> ;
  rdfs:label "URL de descarga"@es ;
  rdfs:label "URL de téléchargement"@fr ;
  rdfs:label "URL di scarico"@it ;
  rdfs:label "URL souboru ke stažení"@cs ;
  rdfs:label "URL μεταφόρτωσης"@el ;
  rdfs:label "download URL"@en ;
  rdfs:label "رابط تحميل"@ar ;
  rdfs:label "ダウンロードURL"@ja ;
  rdfs:label "downloadURL"@da ;
  rdfs:range rdfs:Resource ;
  skos:definition "Ceci est un lien direct à un fichier téléchargeable en un format donnée. Exple fichier CSV ou RDF. Le format est décrit par les propriétés de distribution dct:format et/ou dcat:mediaType."@fr ;
  skos:definition "La URL de un archivo descargable en el formato dato. Por ejemplo, archivo CSV o archivo RDF. El formato se describe con las propiedades de la distribución dct:format y/o dcat:mediaType."@es ;
  skos:definition "Questo è un link diretto al file scaricabile in un dato formato. E.g. un file CSV o un file RDF. Il formato è descritto dal dct:format e/o dal dcat:mediaType della distribuzione."@it ;
  skos:definition "The URL of the downloadable file in a given format. E.g. CSV file or RDF file. The format is indicated by the distribution's dct:format and/or dcat:mediaType."@en ;
  skos:definition "URL souboru ke stažení v daném formátu, například CSV nebo RDF soubor. Formát je popsán vlastností distribuce dct:format a/nebo dcat:mediaType."@cs ;
  skos:definition "dcat:downloadURLはdcat:accessURLの特定の形式です。しかし、DCATプロファイルが非ダウンロード・ロケーションに対してのみaccessURLを用いる場合には、より強い分離を課すことを望む可能性があるため、この含意を強化しないように、DCATは、dcat:downloadURLをdcat:accessURLのサブプロパティーであると定義しません。"@ja ;
  skos:definition "Είναι ένας σύνδεσμος άμεσης μεταφόρτωσης ενός αρχείου σε μια δεδομένη μορφή. Π.χ. ένα αρχείο CSV ή RDF. Η μορφη αρχείου περιγράφεται από τις ιδιότητες dct:format ή/και dcat:mediaType της διανομής."@el ;
  skos:definition "URL til fil der kan downloades i et bestemt format. Fx en CSV-fil eller en RDF-fil. Formatet for distributionen angives ved hjælp af egenskaberne dct:format og/eller dcat:mediaType."@da ;
  skos:definition "رابط مباشر لملف يمكن تحميله. نوع الملف يتم توصيفه باستخدام الخاصية dct:format dcat:mediaType "@ar ;
  skos:editorialNote "Status: English  Definition text modified by DCAT revision team, Italian, Spanish and Czech translation updated, other translations pending."@en ;
  skos:editorialNote "rdfs:label, rdfs:comment and/or skos:scopeNote have been modified. Non-english versions must be updated."@en ;
  skos:scopeNote "El valor es una URL."@es ;
  skos:scopeNote "La valeur est une URL."@fr ;
  skos:scopeNote "dcat:downloadURL BY MĚLA být použita pro adresu, ze které je distribuce přímo přístupná, typicky skrze požadavek HTTP Get."@cs ;
  skos:scopeNote "dcat:downloadURL DOVREBBE essere utilizzato per l'indirizzo a cui questa distribuzione è disponibile direttamente, in genere attraverso una richiesta Get HTTP."@it ;
  skos:scopeNote "dcat:downloadURL SHOULD be used for the address at which this distribution is available directly, typically through a HTTP Get request."@en ;
  skos:scopeNote "Η τιμή είναι ένα URL."@el ;
  skos:scopeNote "dcat:downloadURL BØR anvendes til angivelse af den adresse hvor distributionen er tilgængelig direkte, typisk gennem et HTTP Get request."@da ;
.```

</td><td>

```sql
<#downloadurl-violation>
            a sh:PropertyShape ;
            sh:severity sh:Violation ;
            sh:message "Required property  dcat:downloadURL MUST occur exactly once and have URI/IRI as value"@en ;
            sh:path dcat:downloadURL ;
            sh:minCount 1 ;
            sh:maxCount 1 ;
            sh:nodeKind sh:IRI .```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/dbpedia.org/ontology--DEV/2021.07.09-070001/ontology--DEV_type=parsed_sorted.nt```

</td><td>

```json
"downloadURL": {
      "@id": "dcat:downloadURL",
      "@type": "@id"
    }```

</td></tr></table>



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
  skos:scopeNote "The size in bytes can be approximated when the precise size is not known. The literal value of dcat:byteSize should by typed as xsd:decimal."@en ;```

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
  sh:minCount 1 .  ```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
"byteSize": "4439722" ,```

</td><td>

```json
"byteSize": {
    "@id": "dcat:byteSize",
    "@type": "xsd:decimal"
  }```

</td></tr></table>



### dataid:sha256sum
### dct:hasVersion

<table id="dct:hasVersion" border=1px >
<tr><td> OWL </td> <td> SHACL </td></tr>
<tr><td>

```sql
dct:hasVersion
          dct:description "Changes in version imply substantive changes in content rather than differences in format. This property is intended to be used with non-literal values. This property is an inverse property of Is Version Of."@en ;
          dct:issued "2000-07-11"^^<http://www.w3.org/2001/XMLSchema#date> ;
          a rdf:Property ;
          rdfs:comment "A related resource that is a version, edition, or adaptation of the described resource."@en ;
          rdfs:isDefinedBy <http://purl.org/dc/terms/> ;
          rdfs:label "Has Version"@en ;
          rdfs:subPropertyOf <http://purl.org/dc/elements/1.1/relation>, dct:relation .```

</td><td>

```sql
missing```

</td></tr><tr><td> Example </td> <td> Context </td></tr><tr><td>

```json
%VERSION%```

</td><td>

```json
"hasVersion": {
      "@id": "dct:hasVersion",
      "@type": "xsd:string"
    }```

</td></tr></table>






