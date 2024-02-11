const QueryNode = require("./query-node");

class QueryBuilder {

  static build(config) {
    var builder = new QueryBuilder();
    return builder.createQuery(config.node, config.template, config.resourceBaseUrl, config.root);
  }


  isValidHttpUrl(string) {
    let url;

    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
  }

  uniqueList(arr) {
    var u = {}, a = [];
    for (var i = 0, l = arr.length; i < l; ++i) {
      if (!u.hasOwnProperty(arr[i])) {
        a.push(arr[i]);
        u[arr[i]] = 1;
      }
    }
    return a;
  }

  createQuery(node, template, resourceBaseUrl, root) {

    this.result = '';
    this.baseNode = node;
    this.root = root != undefined ? root : node;
    this.cvCounter = 0;
    this.resourceBaseUrl = resourceBaseUrl;
    this.select = template.select;
    this.template = template.body;
    this.templateInsertionKey = template.placeholder != undefined ? template.placeholder : `%QUERY%`;
    this.prefixes = template.prefixes;
    this.aggregate = template.aggregate;
    this.stringSuffix = '';

    this.appendLine(this.select, 0);
    this.appendLine(`{`, 0);
    this.createNodeSubquery(node, template.indent, false);
    this.appendLine(`}`, 0);

    if (this.aggregate != undefined) {
      this.appendLine(this.aggregate, 0);
    }

    this.prependPrefixes();
    return this.result;
  }

  removeAndCollectPrefixes(query) {
    var lines = query.split('\n');
    var result = "";

    for (var line of lines) {
      if (line.toLowerCase().startsWith('prefix')) {
        this.prefixes.push(line);
      } else {
        result += line + '\n';
      }
    }

    return result.substring(0, result.length - 1);
  }

  prependPrefixes() {

    this.prefixes = this.uniqueList(this.prefixes);

    for (var line of this.prefixes) {
      this.prependLine(line, 0);
    }
  }

  appendTemplateHeader(indent) {
    for (var line of this.template) {

      if (line == this.templateInsertionKey) {
        break;
      }

      this.appendLine(line, indent);
    }
  }

  appendTemplateFooter(indent) {
    var write = false;

    for (var line of this.template) {

      if (write) {
        this.appendLine(line, indent);
      }

      if (line == this.templateInsertionKey) {
        write = true;
      }
    }
  }

  appendTemplate(node, indent) {

    this.appendTemplateHeader(indent);
    this.createNodeSubquery(node, indent + 1, true);

    if (node.property == null && node.childNodes.length == 0) {
      this.appendLine(`?distribution a dataid:Nonsense .`, indent + 1)
    }

    this.appendTemplateFooter(indent);
  }

  /**
   * Create a subquery for any query node. The subquery consist of the node facets and
   * a UNION of child node queries (this function is called revursively on the child nodes)
   * @param {*} node 
   */
  createNodeSubquery(node, indent, hasService) {
    // Initialize empty result

    if (hasService == undefined) {
      hasService = false;
    }

    // Get source...
    var sourceUri = this.findSourceUri(node);

    if (!hasService && sourceUri != null) {

      if (sourceUri != this.resourceBaseUrl) {
        this.appendLine(`SERVICE <${sourceUri}/sparql>`, indent);
        this.appendLine(`{`, indent);

        this.appendTemplate(node, indent + 1);
        this.appendLine(`}`, indent);

      } else {
        this.appendTemplate(node, indent);
      }

      return;
    }

    if (node.uri != null) {

      if (!this.isValidHttpUrl(node.uri)) {

        // Custom query node
        var query = this.removeAndCollectPrefixes(node.property);
        var lines = query.split('\n');
        for (var line of lines) {
          this.appendLine(line, indent);
        }

        return;
      }
    }

    // If a node property was set, add it as a restriction
    if (node.property != undefined) {
      this.appendLine(`?dataset ${node.property} <${node.uri}> .`, indent);
      // If no property was set, we are dealing with a source node
    } else {

    }

    // Create the node facets sub query 
    this.createNodeFacetsSubquery(node, indent);

    // Call recursively on the children and UNION the results

    var k = 0;

    for (var i in node.childNodes) {
      if (k > 0) this.appendLine('UNION', indent);

      if (node.childNodes[i].childNodes == null) {
        return;
      }

      if (node.childNodes[i].property == undefined && node.childNodes[i].childNodes.length == 0) {
        continue;
      }

      this.appendLine('{', indent);
      this.createNodeSubquery(node.childNodes[i], indent + 1, hasService);
      this.appendLine('}', indent);
      k++
    }

    return this.result;
  }

  findSourceUri(node) {
    if (node.uri == null) {
      return null;
    }

    if (!this.isValidHttpUrl(node.uri)) {
      return null;
    }

    var url = new URL(node.uri);
    return url.origin;
  }

  /**
   * Create restrictions that only occur on this node and none of its children
   * Added restriction have to be enriched with their parent node settings
   * @param {*} groupNode 
   */
  createNodeFacetsSubquery(node, indent) {

    var facetUris = this.findAllNodeFacets(node);

    // Iterate over all the facet settings of the node
    for (var i in facetUris) {

      var facetUri = facetUris[i];

      // We only add facets to the node if the facet is not overridden by any child nodes
      if (!this.hasFacetOverride(node, facetUri)) {

        // We create the subquery while merging the facet settings from this node to the root of the query tree
        this.createFacetSubquery(node, facetUri, indent);
      }
    }
  }

  // Check whether any child node of the passed node overrides a specific facet
  hasFacetOverride(node, facetUri) {

    // If we don't have any children, there are no overrides
    if (node.childNodes.length == 0) {
      return false;
    }

    // ======= SPECIAL TREATMENT OF VERSION/LATEST =======
    // Treat as if overridden (leaf nodes already excluded)
    // ===================================================
    if (facetUri == 'http://purl.org/dc/terms/hasVersion') {
      for (var i in node.facetSettings[facetUri]) {
        if (node.facetSettings[facetUri][i].value == '$latest') {
          return true;
        }
      }
    }

    // Iterate through the child nodes
    for (var i in node.childNodes) {
      var childNode = node.childNodes[i];

      // If the child node overrides the facet then yes, we have an override
      if (childNode.facetSettings[facetUri] != undefined) {
        return true;
      }

      // If any of the child node's children has an override, we have an override
      if (this.hasFacetOverride(childNode, facetUri)) {
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
    settings = settings.filter(function (s) {
      return s.checked;
    });

    if (settings.length == 1) {
      var facetSettingEntry = settings[0];
      if (!facetSettingEntry.checked) return;

      if (facetSettingEntry.value == '$latest' && facetUri == 'http://purl.org/dc/terms/hasVersion') {
        // Add the special latest version facet value restriction.
        this.appendLine('{', indent);
        this.appendLine('?distribution dct:hasVersion ?version {', indent + 1);
        this.appendLine('SELECT (?v as ?version) { ', indent + 2);
        this.appendLine('GRAPH ?g2 { ', indent + 3);
        this.appendLine(`?dataset ${node.property} <${node.uri}> . `, indent + 4);
        this.appendLine('?dataset dct:hasVersion ?v . ', indent + 4);
        this.appendLine('}', indent + 3);
        this.appendLine('} ORDER BY DESC (STR(?version)) LIMIT 1 ', indent + 2);
        this.appendLine('}', indent + 1);
        this.appendLine('}', indent);
      }
      else {
        // Add the facet value restriction
        this.appendLine(`{ ?distribution <${facetUri}> '${facetSettingEntry.value}'${this.stringSuffix} . }`, indent);
      }
    }
    else if (settings.length > 1) {

      // More than one value for this facet

      if (facetUri == 'http://purl.org/dc/terms/hasVersion') {

        // Iterate..
        for (var i in settings) {

          var facetSettingEntry = settings[i];
          if (!facetSettingEntry.checked) continue;

          if (!first) this.appendLine("UNION", indent);

          if (facetSettingEntry.value == '$latest' && facetUri == 'http://purl.org/dc/terms/hasVersion') {
            // Add the special latest version facet value restriction.
            this.appendLine('{', indent);
            this.appendLine('?distribution dct:hasVersion ?version {', indent + 1);
            this.appendLine('SELECT (?v as ?version) { ', indent + 2);
            this.appendLine('GRAPH ?g2 { ', indent + 3);
            this.appendLine(`?dataset ${node.property} <${node.uri}> . `, indent + 4);
            this.appendLine('?dataset dct:hasVersion ?v . ', indent + 4);
            this.appendLine('}', indent + 3);
            this.appendLine('} ORDER BY DESC (STR(?version)) LIMIT 1 ', indent + 2);
            this.appendLine('}', indent + 1);
            this.appendLine('}', indent);
          }
          else {
            // Add the facet value restriction
            this.appendLine(`{ ?distribution <${facetUri}> '${facetSettingEntry.value}'${this.stringSuffix} . }`, indent);
          }

          // If we have more than one value for this facet we need a UNION
          first = false;
        }

      } else {
        this.appendLine('{', indent);
        this.appendLine(`?distribution <${facetUri}> ?c${this.cvCounter} .`, indent + 1);
        this.appendLine(`VALUES ?c${this.cvCounter} {`, indent + 1);

        for (var i in settings) {
          var facetSettingEntry = settings[i];
          if (!facetSettingEntry.checked) continue;
          this.appendLine(`'${facetSettingEntry.value}'${this.stringSuffix}`, indent + 2);
        }
        this.appendLine(`}`, indent + 1);
        this.appendLine(`}`, indent);
        this.cvCounter++;
      }
    }
  }

  /**
   * Create a list of all the node facets and all overridden ancestor facets that might not be explicitly
   * included in the node facet list
   * @param {*} node 
   */
  findAllNodeFacets(node) {
    var facetUris = [];

    for (var facetUri in node.facetSettings) {
      facetUris.push(facetUri);
    }

    var parentNode = QueryNode.findParentNodeRecursive(this.root, node); // node.parent;

    while (parentNode != undefined) {

      for (var facetUri in parentNode.facetSettings) {

        // check the base node -> if current node is the base, include all parent facets
        // on the way too the root
        if (node != this.baseNode && !this.hasFacetOverride(parentNode, facetUri)) {
          continue;
        }


        if (facetUris.includes(facetUri)) {
          continue;
        }

        facetUris.push(facetUri);
      }

      parentNode = QueryNode.findParentNodeRecursive(this.root, parentNode); // parentNode.parent;
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
    for (var i in node.facetSettings[facetUri]) {
      result.push(node.facetSettings[facetUri][i]);
    }

    var parentNode = QueryNode.findParentNodeRecursive(this.root, node); // node.parent;

    while (parentNode != undefined) {

      for (var i in parentNode.facetSettings[facetUri]) {
        var parentSetting = parentNode.facetSettings[facetUri][i];
        var hasSetting = false;
        for (var j in result) {
          if (result[j].value == parentSetting.value) {
            hasSetting = true;
            break;
          }
        }

        if (!hasSetting) {
          result.push(parentSetting);
        }
      }

      parentNode = QueryNode.findParentNodeRecursive(this.root, parentNode); //parentNode.parent;
    }


    return result;
  }

  /**
   * Appends a line to the global result prepending a specified number of tab characters
   * @param {*} line 
   * @param {*} indent 
   */
  appendLine(line, indent) {
    for (var i = 0; i < indent; i++) this.result += '\t';
    this.result += line;
    this.result += '\n';
  }

  /**
   * Appends a line to the global result prepending a specified number of tab characters
   * @param {*} line 
   * @param {*} indent 
   */
  prependLine(line, indent) {
    var text = '';
    for (var i = 0; i < indent; i++) text += '\t';
    text += line;
    this.result = text + '\n' + this.result;
  }
}

module.exports = QueryBuilder;
