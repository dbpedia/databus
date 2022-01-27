class DatabusSparql {

  static DEFAULT_PREFIXES = [
    `PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>`,
    `PREFIX dct:    <http://purl.org/dc/terms/>`,
    `PREFIX dcat:   <http://www.w3.org/ns/dcat#>`,
    `PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>`,
    `PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>`
  ];

  static collectionStatistics = `
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


  static collectionFiles = `
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


  static NODE_FILE_SELECT = `SELECT DISTINCT ?file ?license ?size ?format ?compression (GROUP_CONCAT(DISTINCT ?var; SEPARATOR=', ') AS ?variant) ?preview WHERE`;

  static NODE_FILE_TEMPLATE = [
    `GRAPH ?g`,
    `{`,
    `\t?dataset dcat:distribution ?distribution .`,
    `%QUERY%`,
    `\t?distribution dataid:file ?file .`,
    `\t?distribution dataid:formatExtension ?format .`,
    `\t?distribution dataid:compression ?compression .`,
    `\t?dataset dct:license ?license .`,
    `\tOPTIONAL { ?distribution ?p ?var. ?p rdfs:subPropertyOf dataid:contentVariant . }`,
    `\tOPTIONAL { ?distribution dcat:byteSize ?size . }`,
    `\tOPTIONAL { ?distribution dataid:preview ?preview . }`,
    `}`
  ];

  static NODE_FILE_AGGREGATE = `GROUP BY ?file?license ?size ?format ?compression ?preview`;

  static DEFAULT_FILE_SELECT = `SELECT ?file WHERE`;

  static DEFAULT_FILE_TEMPLATE = [
    `GRAPH ?g`,
    `{`,
    `\t?dataset dcat:distribution ?distribution .`,
    `\t?distribution dataid:file ?file .`,
    `%QUERY%`,
    `}`,
  ];






}