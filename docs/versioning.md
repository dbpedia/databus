# Versioning

The Version ID must adhere to URI, maven and filename standards, so the characters `\/:"<>|?*` are forbidden. Furthermore it needs to be at least three characters long.

Apart from this rule the VersionIDs can contain any alphanumeric character (regardless of the case) and any of these seperator chars: `-._`. 

### Sortable Timestamps

Although the definition of the version ID is quite free and left to the user, there is a good practise: Setting the version in the form of `YYYY.MM.DD-hhmmss`, `YYYY.MM.DD-hh.mm.ss` or `YYYY.MM.DDThhmmss` ([ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) conform) has multiple advantages:
	
* Sorting the version strings (alphanumerically) results in sorting from oldest to latest, which can be used in multiple ways in SPARQL. For example setting `ORDER BY ?version` at the end of the query is an easy way of sorting versions of data chronologically. Furthermore you can use a filter like `FILTER(str(?version) >"2020.01.01")` to find all versions deployed in 2020 and later. 
* You can set it according to your deploy schedule, e.g. if you deploy monthly you can just use `YYYY.MM`. 
	You can also switch the versioning (e.g. to `YYYY.MM.DD`) and the sorting still stays intact.
* 	This query provides an example how this can be used on the Databus to find DBpedia long abstracts later then 2021 and then order them chronologically:
```
PREFIX databus: <http://dataid.dbpedia.org/databus#>
PREFIX dct:    <http://purl.org/dc/terms/>
PREFIX dcat:   <http://www.w3.org/ns/dcat#>
PREFIX db:     <https://databus.dbpedia.org/>
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?file ?version WHERE {
	GRAPH ?g {
		?dataset dcat:distribution ?distribution .
		?distribution databus:file ?file .
		?dataset databus:artifact <https://databus.dbpedia.org/dbpedia/text/long-abstracts> .
    	?dataset dct:hasVersion ?version .
    	FILTER(str(?version) > "2021.01.01")
	}
} ORDER BY ?version
```

### General Notes about Versioning

* Generally on the Databus the User has the complete control over its data. So it is possible to resubmit versions with the same version again, for example in the case of link rot or migrated data. 
Usually in this case the `dataid:version` and `dct:hasVersion` stays the same but `dct:issued` should change (it defaults to *now* if not explicitly set) to make it transparent that this dataset has been modified.
* If you plan on further tinkering a specific version of a Dataset (e.g. the first one) it can be helpful to document that by appending `-snapshot` or `-dev` to the version ID to document this and make it clear for the users. 
This also helps in searching such Datasets with SPARQL.



## Timestamping
* if dct:issue is given on post, this will be used
* if not, then Databus inserts %now%
* dct:modified is always set by Databus
