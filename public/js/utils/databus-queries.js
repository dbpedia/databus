const DATABUS_QUERIES = {};

DATABUS_QUERIES.collectionStatistics = `
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX dataid-cv: <http://dataid.dbpedia.org/ns/cv#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX dcat:  <http://www.w3.org/ns/dcat#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT 
  ?dataset
  ?file
  ?license
  ?size
WHERE { 
  %COLLECTION_QUERY%
  OPTIONAL { ?dataset dct:license ?license . }
  ?dataset dcat:distribution ?distribution .
  ?distribution dataid:file ?file .
  OPTIONAL { ?distribution dcat:byteSize ?size . }
}
`;


DATABUS_QUERIES.collectionFiles = `
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX dataid-cv: <http://dataid.dbpedia.org/ns/cv#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX dcat:  <http://www.w3.org/ns/dcat#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT 
  ?versionUri
  ?dataset
  ?distribution
  ?label    
  ?comment
  (GROUP_CONCAT(DISTINCT ?file; SEPARATOR=", ") AS ?files)
  ?license
  ?size
  ?version
  ?format
  (GROUP_CONCAT(DISTINCT ?var; SEPARATOR=', ') AS ?variant)
  ?preview
WHERE { 
  %COLLECTION_QUERY%
  ?distribution dataid:file ?file .
  ?distribution dataid:formatExtension ?format .
  OPTIONAL { ?distribution ?p  ?var. ?p rdfs:subPropertyOf dataid:contentVariant . }
  OPTIONAL { ?dataset dct:license ?license . }
  OPTIONAL { ?distribution dcat:byteSize ?size . }
  OPTIONAL { ?distribution dataid:preview ?preview . }
  ?distribution dct:hasVersion ?version .
  ?dataset dcat:distribution ?distribution .
  ?dataset dataid:version ?versionUri .
  ?dataset dct:title ?label .
  ?dataset dct:abstract ?comment.
}
GROUP BY ?versionUri ?dataset ?distribution ?label ?comment ?license ?size ?version ?format ?preview`;


DATABUS_QUERIES.nodeFileList = `
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX dataid-cv: <http://dataid.dbpedia.org/ns/cv#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX dcat:  <http://www.w3.org/ns/dcat#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT 
  ?file
  ?license
  ?size
  ?format
  ?compression
  (GROUP_CONCAT(DISTINCT ?var; SEPARATOR=', ') AS ?variant)
  ?preview
WHERE { 
  ?dataset dcat:distribution ?distribution .
  %COLLECTION_QUERY%
  ?distribution dataid:file ?file .
  ?distribution dataid:formatExtension ?format .
  ?distribution dataid:compression ?compression .
  OPTIONAL { ?distribution ?p  ?var. ?p rdfs:subPropertyOf dataid:contentVariant . }
  OPTIONAL { ?dataset dct:license ?license . }
  OPTIONAL { ?distribution dcat:byteSize ?size . }
  OPTIONAL { ?distribution dataid:preview ?preview . }
}
GROUP BY ?file?license ?size ?format ?compression ?preview`;