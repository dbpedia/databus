const QUERY_DEFAULT_SELECTION = "SELECT DISTINCT ?file WHERE\n{ %COLLECTION_QUERY% \n }";

const QUERY_DEFAULT_SELECTION_PLACEHOLDER = "%COLLECTION_QUERY%";

class QueryBuilder {



  constructor(artifactBaseQuery, artifactUriPlaceholder, optionsPlaceholder) {
    this.artifactBaseQuery = artifactBaseQuery;
    this.artifactUriPlaceholder = artifactUriPlaceholder;
    this.optionsPlaceholder = optionsPlaceholder;

    this.queryPlaceholderFacet = "%FACET%";
    this.queryPlaceholderValue = "%VALUE%";
    this.defaultSubquery = "\n\t{ ?distribution <%FACET%> '%VALUE%'^^<http://www.w3.org/2001/XMLSchema#string> . }";
  }

  extractPrefixes(prefixes, query) {

    var prefixMatches = query.match(/PREFIX\s+[^\s]+\s+[^\s]+/g);

    for(var i in prefixMatches) {
      var prefixValues = prefixMatches[i].split(/\s+/g);
      prefixes[prefixValues[1]] = prefixValues[2];
    }
  }

  static hasCustomQueries(content) {
    return content.customQueries != undefined && content.customQueries.length > 0;
  }

  static hasGeneratedQuery(content) {
    return content.generatedQuery != undefined 
      && content.generatedQuery.root != undefined
      && content.generatedQuery.root.childNodes != undefined 
      && content.generatedQuery.root.childNodes.length > 0;
  }


  static hasContent(content) {
    if(QueryBuilder.hasCustomQueries(content)) {
        return true;
    }

    if(QueryBuilder.hasGeneratedQuery(content)) {
        return true;
    }

    return false;  
  }

  static assignParents(queryNode) {
    for(var i = 0; i < queryNode.childNodes.length; i++) {
      queryNode.childNodes[i].parent = queryNode;
      QueryBuilder.assignParents(queryNode.childNodes[i]);
    }
  }

  createCollectionQuery(content, wrapperQuery, wrapperQueryPlaceHolder) {

    if(wrapperQuery == undefined) {
      wrapperQuery = QUERY_DEFAULT_SELECTION;
    }

    if(wrapperQueryPlaceHolder == undefined) {
      wrapperQueryPlaceHolder = QUERY_DEFAULT_SELECTION_PLACEHOLDER;
    }

    // collect prefixes:
    var prefixes = {};

    if(!QueryBuilder.hasContent(content)) {
      return this.emptyFallback;
    }

    // find prefix lines in custom queries
    for(var i in content.customQueries) {
      
    }

    // initialize an empty result
    var isFirstSubquery = true;

    var query = "";

    if(QueryBuilder.hasGeneratedQuery(content)) {

      QueryBuilder.assignParents(content.generatedQuery.root);
      var generatedQuery = this.createFileQuery(content.generatedQuery.root)
      
      this.extractPrefixes(prefixes, generatedQuery);
      query += "\n\t{";
      query += "\n" + this.removePrefixes(generatedQuery);
      query += "\n\t}";

      isFirstSubquery = false;
    }

    // add the custom queries (without prefixes)
    for(var i in content.customQueries) {

      this.extractPrefixes(prefixes, content.customQueries[i].query);

      if(!isFirstSubquery) {
        query += "\n\tUNION";
      } else {
        isFirstSubquery = false;
      }


      query += "\n\t{\n" + this.removePrefixes(content.customQueries[i].query) + "\n\t}";
    }

    // start with a "select ?file"..
    query = wrapperQuery.replace(wrapperQueryPlaceHolder, query);
    
    // add the prefixes to the top
    for(var prefix in prefixes) {
      query = "PREFIX " + prefix + " " + prefixes[prefix] + "\n" + query;
    }

    // and done
    return query;
  }

  groupHasOverride(group) {
    for(var j in group.artifacts) {
      var artifact = group.artifacts[j];
      

    }
  }

  removePrefixes(query) {
    return query.replace(/PREFIX\s+[^\s]+\s+[^\s]+\s+/g, "").replace(/^/gm, "\t\t");
  }

  mergeSettings(parentSettings, childSettings) {
    var mergedSettings = {};

    // Set parent settings state
    for(var p in parentSettings) {
      var setting = parentSettings[p];

      if(mergedSettings[setting.facet] == undefined) {
        mergedSettings[setting.facet] = {};
      }

      mergedSettings[setting.facet][setting.value] = setting.checked;
    }

    // Override with child settings
    for(var s in childSettings) {
      var setting = childSettings[s];

      if(mergedSettings[setting.facet] == undefined) {
        mergedSettings[setting.facet] = {};
      }

      mergedSettings[setting.facet][setting.value] = setting.checked;
    }

    return mergedSettings;
  }

  // =================================
  // NEW TREE=BASED QUERY GENERATOR
  // =================================


  createQuery(groupNode, wrapperQuery, placeholder, indent) {

    this.result = '';
    this.cvCounter = 0;
    this.createNodeSubquery(groupNode, indent);

    if (this.result == "") return null;
    
    var re = new RegExp(placeholder, "g");
    return wrapperQuery.replace(re, this.result);
  }

  createFileQuery(groupNode) {

    this.cvCounter = 0;

    this.result = '';
    this.appendLine('PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>', 0);
    this.appendLine('PREFIX dct:    <http://purl.org/dc/terms/>', 0);
    this.appendLine('PREFIX dcat:   <http://www.w3.org/ns/dcat#>', 0);
    this.appendLine('PREFIX db:     <https://databus.dbpedia.org/>', 0);
    this.appendLine('PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>', 0);
    this.appendLine('PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>', 0);
    this.appendLine('SELECT DISTINCT ?file WHERE {', 0);
    this.appendLine('GRAPH ?g {', 1)
    this.appendLine('?dataset dcat:distribution ?distribution .', 2);
    this.appendLine('?distribution dataid:file ?file .', 2);
    this.createNodeSubquery(groupNode, 2);
    this.appendLine('}', 1);
    this.appendLine('}', 0);

    return this.result;
  }

  createFullQuery(node) {

    this.cvCounter = 0;
    this.result = '';
    this.appendLine('PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>', 0);
    this.appendLine('PREFIX dct:    <http://purl.org/dc/terms/>', 0);
    this.appendLine('PREFIX dcat:   <http://www.w3.org/ns/dcat#>', 0);
    this.appendLine('PREFIX db:     <https://databus.dbpedia.org/>', 0);
    this.appendLine('PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>', 0);
    this.appendLine('PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>', 0);
    this.appendLine("SELECT DISTINCT ?file ?artifact ?version (GROUP_CONCAT(DISTINCT ?var; SEPARATOR=', ') AS ?variant) ?format ?compression ?size ?preview WHERE {", 0);
    this.appendLine('GRAPH ?g {', 1)
    this.appendLine('?dataset dcat:distribution ?distribution .', 2);
    this.appendLine('?dataset dataid:artifact ?artifact .', 2);
    this.appendLine('?distribution dataid:file ?file .', 2);
    this.appendLine("?distribution dct:hasVersion ?version .", 2);
    this.appendLine("?distribution dataid:formatExtension ?format .", 2);
    this.appendLine("OPTIONAL { ?distribution ?p  ?var. ?p rdfs:subPropertyOf dataid:contentVariant . }", 2);
    this.appendLine("?distribution dataid:compression ?compression .", 2);
    this.appendLine("?distribution dcat:byteSize ?size ." , 2);
    this.appendLine("OPTIONAL { ?distribution dataid:preview ?preview . }", 2);
    this.createNodeSubquery(node, 2);
    this.appendLine('}', 1)
    this.appendLine('} GROUP BY ?artifact ?file ?version ?format ?size ?compression ?preview', 0);

    return this.result;
  }

  /**
   * Create a subquery for any query node. The subquery consist of the node facets and
   * a UNION of child node queries (this function is called revursively on the child nodes)
   * @param {*} node 
   */
  createNodeSubquery(node, indent) {
    // Initialize empty result
    
    // If a node property was set, add it as a restriction
    if(node.property != undefined) {
      this.appendLine(`?dataset ${node.property} <${node.uri}> .`, indent);
    } 

    // Create the node facets sub query 
    this.createNodeFacetsSubquery(node, indent);

    // Call recursively on the children and UNION the results
    for(var i in node.childNodes) {
      if(i > 0) this.appendLine('UNION', indent);
      this.appendLine('{', indent);
      this.createNodeSubquery(node.childNodes[i], indent + 1);
      this.appendLine('}', indent);;
    }

    return this.result;
  }

  /**
   * Create restrictions that only occur on this node and none of its children
   * Added restriction have to be enriched with their parent node settings
   * @param {*} groupNode 
   */
  createNodeFacetsSubquery(node, indent) {

    var facetUris = this.findAllNodeFacets(node);

    // Iterate over all the facet settings of the node
    for(var i in facetUris) {

      var facetUri = facetUris[i];

      // We only add facets to the node if the facet is not overriden by any child nodes
      if(!this.hasFacetOverride(node, facetUri)) {
        
        // We create the subquery while merging the facet settings from this node to the root of the query tree
        this.createFacetSubquery(node, facetUri, indent);
      }
    }
  }

  // Check whether any child node of the passed node overrides a specific facet
  hasFacetOverride(node, facetUri) {

    // If we don't have any children, there are no overrides
    if(node.childNodes.length == 0) {
      return false;
    }

    // ======= SPECIAL TREATMENT OF VERSION/LATEST =======
    // Treat as if overriden (leaf nodes already excluded)
    // ===================================================
    if(facetUri == 'http://purl.org/dc/terms/hasVersion') {
      for(var i in node.facetSettings[facetUri]) {
        if(node.facetSettings[facetUri][i].value == '$latest') {
          return true;
        }
      }
    }

    // Iterate through the child nodes
    for(var i in node.childNodes) {
      var childNode = node.childNodes[i];

      // If the child node overrides the facet then yes, we have an override
      if(childNode.facetSettings[facetUri] != undefined) {
        return true;
      }

      // If any of the child node's children has an override, we have an override
      if(this.hasFacetOverride(childNode, facetUri)) {
        return true;
      }
    }

    // Nothing found in the children? No override!
    return false;
  }

  /**
   * Generates the sub query for a specific node and facet
   * @param {*} node 
   * @param {*} facetUri 
   */
  createFacetSubquery(node, facetUri, indent) {
    var first = true;

    // If we add a facet setting, we have to include the facets of all the ancestor nodes
    var settings = this.createEnrichedSettings(node, facetUri);
    settings = settings.filter(function(s) {
      return s.checked;
    });

    if(settings.length == 1) {
      var facetSettingEntry = settings[0];
      if(!facetSettingEntry.checked) return;

      if(facetSettingEntry.value == '$latest' && facetUri == 'http://purl.org/dc/terms/hasVersion') {
        // Add the special latest version facet value restriction.
        this.appendLine('{', indent);
        this.appendLine('?distribution dct:hasVersion ?version {', indent + 1);
        this.appendLine('SELECT (?v as ?version) { ', indent + 2);
        this.appendLine(`?dataset ${node.property} <${node.uri}> . `, indent + 3);
        this.appendLine('?dataset dct:hasVersion ?v . ', indent + 3);
        this.appendLine('} ORDER BY DESC (?version) LIMIT 1 ', indent + 2);
        this.appendLine('}', indent + 1);
        this.appendLine('}', indent);
      }
      else {
        // Add the facet value restriction
        this.appendLine(`{ ?distribution <${facetUri}> '${facetSettingEntry.value}'^^<http://www.w3.org/2001/XMLSchema#string> . }`, indent);
      }
    }
    else if(settings.length > 1) {

      // More than one value for this facet

      if(facetUri == 'http://purl.org/dc/terms/hasVersion') {

         // Iterate..
        for(var i in settings) {

          var facetSettingEntry = settings[i];
          if(!facetSettingEntry.checked) continue;

          if(!first) this.appendLine("UNION", indent);

          if(facetSettingEntry.value == '$latest' && facetUri == 'http://purl.org/dc/terms/hasVersion') {
            // Add the special latest version facet value restriction.
            this.appendLine('{', indent);
            this.appendLine('?distribution dct:hasVersion ?version {', indent + 1);
            this.appendLine('SELECT (?v as ?version) { ', indent + 2);
            this.appendLine(`?dataset ${node.property} <${node.uri}> . `, indent + 3);
            this.appendLine('?dataset dct:hasVersion ?v . ', indent + 3);
            this.appendLine('} ORDER BY DESC (?version) LIMIT 1 ', indent + 2);
            this.appendLine('}', indent + 1);
            this.appendLine('}', indent);
          }
          else {
            // Add the facet value restriction
            this.appendLine(`{ ?distribution <${facetUri}> '${facetSettingEntry.value}'^^<http://www.w3.org/2001/XMLSchema#string> . }`, indent);
          }

          // If we have more than one value for this facet we need a UNION
          first = false;
        }

      } else {
        this.appendLine('{', indent);
        this.appendLine(`?distribution <${facetUri}> ?c${this.cvCounter} .`, indent + 1);
        this.appendLine(`VALUES ?c${this.cvCounter} {`, indent + 1);
        
        for(var i in settings) {
          var facetSettingEntry = settings[i];
          if(!facetSettingEntry.checked) continue;
          this.appendLine(`'${facetSettingEntry.value}'^^<http://www.w3.org/2001/XMLSchema#string>`, indent + 2);
        }
        this.appendLine(`}`, indent + 1);
        this.appendLine(`}`, indent);
        this.cvCounter++; 
      }
    }
  }

  /**
   * Create a list of all the node facets and all overriden ancestor facets that might not be explicitly
   * included in the node facet list
   * @param {*} node 
   */
  findAllNodeFacets(node) {
    var facetUris = [];

    for(var facetUri in node.facetSettings) {
      facetUris.push(facetUri);
    }

    var parentNode = node.parent;

    while(parentNode != undefined) {

      for(var facetUri in parentNode.facetSettings) {
        if(!this.hasFacetOverride(parentNode, facetUri)) {
          continue;
        }

        if(facetUris.includes(facetUri)) {
          continue;
        }

        facetUris.push(facetUri);
      }

      parentNode = parentNode.parent;
    }

    return facetUris;
  }

  /**
   * For a given facet, add up all the active settings up to the root node of the
   * query tree. Node settings override ancestor node settings.
   * @param {*} node 
   * @param {*} facetUri 
   */
  createEnrichedSettings(node, facetUri) {
    var result = [];
    for(var i in node.facetSettings[facetUri]) {
      result.push(node.facetSettings[facetUri][i]);
    }

    var parentNode = node.parent;

    while(parentNode != undefined) {

      for(var i in parentNode.facetSettings[facetUri]) {
        var parentSetting = parentNode.facetSettings[facetUri][i];
        var hasSetting = false;
        for(var j in result) {
          if(result[j].value == parentSetting.value) {
            hasSetting = true;
            break;
          }
        }
  
        if(!hasSetting) {
          result.push(parentSetting);
        }
      }

      parentNode = parentNode.parent;
    }


    return result;   
  }

  /**
   * Appens a line to the global result prepending a specified number of tab characters
   * @param {*} line 
   * @param {*} indent 
   */
  appendLine(line, indent) {
    for(var i = 0; i < indent; i++) this.result += '\t';
    this.result += line;
    this.result += '\n';
  }

  // =================================
  // THE END
  // =================================



  what() {

    if(this.groupHasOverride(group)) {
      for(var j in group.artifacts) {
        var artifact = group.artifacts[j];

        if(!isFirstSubquery) {
          query += FACET_SUBQUERY_UNION;
        } else {
          isFirstSubquery = false;
        }

        // create the artifact query and extract prefixes
        var mergedSettings = this.mergeSettings(group.settings, artifact.settings)

        var artifactQuery = this.createArtifactQuery(artifact.uri, mergedSettings);
        this.extractPrefixes(prefixes, artifactQuery);

        // add the artifact query
        query += "\n\t{\n" + this.removePrefixes(artifactQuery) + "\n\t}";
      }
    } else {
      var groupQuery = this.createGroupQuery(group.uri, group.settings);
      this.extractPrefixes(prefixes, groupQuery);
      query += "\n\t{\n" + this.removePrefixes(groupQuery) + "\n\t}";
    }
  }

  createArtifactQuery(resourceUri, settings) {

    var template = this.artifactBaseQuery.replace(this.artifactUriPlaceholder, resourceUri);

    var options = '';

    for(var f in settings) {

      var facet = settings[f];
      var facetQueries = [];

      for(var v in facet) {

        if(facet[v]) {

          if(v == FACET_LASTEST_VERSION_SUBQUERY_KEY) {
            facetQueries.push(this.latestVersionSubquery.replace(this.artifactUriPlaceholder, resourceUri));
         } else {
            facetQueries.push(this.defaultSubquery
              .replace(FACET_DEFAULT_SUBQUERY_PLACEHOLDER_FACET, f)
              .replace(FACET_DEFAULT_SUBQUERY_PLACEHOLDER_VALUE, v));
          }
        }
      }

      var subquery = '';

      for(var i in facetQueries) {
        if(i > 0) {
          subquery += FACET_SUBQUERY_UNION;
        }

        subquery += facetQueries[i];
      }

      options += subquery;
    }

    return template.replace(this.optionsPlaceholder, options);
  }
}

if(typeof module === "object" && module && module.exports)
   module.exports = QueryBuilder;
