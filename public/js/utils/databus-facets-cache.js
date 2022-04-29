
class DatabusFacetsCache {

  constructor($http) {
    this._facets = {};
    this._http = $http;
    this._regex = new RegExp('%RESOURCE_URI%', "g");

    this.pathLengthToQueryMap = {
      2: DatabusFacetsCache.GET_GROUP_FACETS,
      3: DatabusFacetsCache.GET_ARTIFACT_FACETS
    }

    this._facetMetadata = { 
      "http://purl.org/dc/terms/hasVersion" : "Version",
      "http://dataid.dbpedia.org/ns/core#formatExtension" : "Format",
      "http://dataid.dbpedia.org/ns/cv#lang" : "Language",
      "http://dataid.dbpedia.org/ns/cv#domain" : "Domain",
      "http://dataid.dbpedia.org/ns/cv#tag" : "Tag",
      "http://dataid.dbpedia.org/ns/core#compression" : "Compression"
    };
  }

  async get(resource) {

    if (this._facets[resource] != undefined) {
      return {
        uri : resource,
        facets: this._facets[resource]
      };
    }

    var url = new URL(resource);
    var origin = url.origin;
    var pathLength = DatabusUtils.getResourcePathLength(resource);

    var query = this.pathLengthToQueryMap[pathLength];


    if (query == undefined) {
      return null;
    }

    query = query.replace(this._regex, resource);

    var req = {
      method: 'POST',
      url: `${origin}/sparql?query=`,
      data: `format=json&query=${encodeURIComponent(query)}`,
      headers: {
        "Content-type": "application/x-www-form-urlencoded"
      },
    }

    var response = await this._http(req);

    var result = {};

    for (var binding of response.data.results.bindings) {

      var property = binding.property.value;

      if (result[property] == undefined) {
        result[property] = {};

        var label = this._facetMetadata[property] != undefined ? this._facetMetadata[property] : 
          DatabusUtils.uriToName(property);

        result[binding.property.value].label = label;
        result[binding.property.value].values = []
      }

      result[binding.property.value].values.push(binding.value.value);
    }

    this._facets[resource] = result;
    
    return {
      uri : resource,
      facets: this._facets[resource]
    };
  }


  static GET_GROUP_FACETS = `
  PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
  PREFIX dataid-cv: <http://dataid.dbpedia.org/ns/cv#>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX dcat:  <http://www.w3.org/ns/dcat#>
  PREFIX rdfs:  <http://www.w3.org/2000/01/rdf-schema#>
  
  SELECT DISTINCT ?property ?value WHERE {
    {
      GRAPH ?g {
        ?dataset dataid:group <%RESOURCE_URI%> .
        ?dataset dcat:distribution ?distribution . 
        ?distribution dct:hasVersion ?value .
        BIND(dct:hasVersion AS ?property)
      }
    }
    UNION
    {
      GRAPH ?g {
        ?dataset dataid:group <%RESOURCE_URI%> .
        ?dataset dcat:distribution ?distribution . 
        ?distribution dataid:formatExtension ?value .
        BIND(dataid:formatExtension AS ?property)
      }
    }
    UNION
    {
      GRAPH ?g {
        ?dataset dataid:group <%RESOURCE_URI%> .
        ?dataset dcat:distribution ?distribution . 
        ?distribution dataid:compression ?value .
        BIND(dataid:compression AS ?property)
      }
    }
    UNION
    {
      GRAPH ?g {
        ?dataset dataid:group <%RESOURCE_URI%> .
        ?dataset dcat:distribution ?distribution . 
        ?distribution ?property ?value .
        ?property rdfs:subPropertyOf dataid:contentVariant .
      }
    }
  }
  `;

  static GET_ARTIFACT_FACETS = `
  PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
  PREFIX dataid-cv: <http://dataid.dbpedia.org/ns/cv#>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX dcat:  <http://www.w3.org/ns/dcat#>
  PREFIX rdfs:  <http://www.w3.org/2000/01/rdf-schema#>
  
  SELECT DISTINCT ?property ?value WHERE {
    {
      GRAPH ?g {
        ?dataset dataid:artifact <%RESOURCE_URI%> .
        ?dataset dcat:distribution ?distribution . 
        ?distribution dct:hasVersion ?value .
        BIND(dct:hasVersion AS ?property)
      }
    }
    UNION
    {
      GRAPH ?g {
        ?dataset dataid:artifact <%RESOURCE_URI%> .
        ?dataset dcat:distribution ?distribution . 
        ?distribution dataid:formatExtension ?value .
        BIND(dataid:formatExtension AS ?property)
      }
    }
    UNION
    {
      GRAPH ?g {
        ?dataset dataid:artifact <%RESOURCE_URI%> .
        ?dataset dcat:distribution ?distribution . 
        ?distribution dataid:compression ?value .
        BIND(dataid:compression AS ?property)
      }
    }
    UNION
    {
      GRAPH ?g {
        ?dataset dataid:artifact <%RESOURCE_URI%> .
        ?dataset dcat:distribution ?distribution . 
        ?distribution ?property ?value .
        ?property rdfs:subPropertyOf dataid:contentVariant .
      }
    }
  }`;



}

