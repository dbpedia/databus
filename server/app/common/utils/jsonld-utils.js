const DatabusUris = require("../../../../public/js/utils/databus-uris");

class JsonldUtils {

  static getTypedGraph(graphs, graphType) {
    for (var g in graphs) {
      var graph = graphs[g];

      if (graph['@type'] != undefined && graph['@type'].includes(graphType)) {
        return graph;
      }
    }

    return null;
  }

  static getGraphById(graphs, id) {
    for (var g in graphs) {
      var graph = graphs[g];

      if (graph['@id'] != undefined && graph['@id'] == id) {
        return graph;
      }
    }

    return null;


  }

  static getTypedGraphs(graphs, graphType) {
    var result = [];

    for (var g in graphs) {
      var graph = graphs[g];

      if (graph[DatabusUris.JSONLD_TYPE] != undefined && 
        graph[DatabusUris.JSONLD_TYPE].includes(graphType)) {
        result.push(graph);
      }
    }

    return result;
  }

  static getSubPropertyGraphs(graphs, propertyUri) {

    var result = [];

    for (var graph of graphs) {
      if (graph[DatabusUris.RDFS_SUB_PROPERTY_OF] == undefined) {
        continue;
      }

      for (var property of graph[DatabusUris.RDFS_SUB_PROPERTY_OF]) {
        if (property[DatabusUris.JSONLD_ID] == propertyUri) {
          result.push(graph);
        }
      }
    }

    return result;
  }


  static getFirstObject(graph, key) {
    var obj = graph[key];

    if (obj == undefined || obj.length < 1) {
      return null;
    }

    return obj[0];
  }

  static getFirstObjectUri(graph, key) {
    var obj = graph[key];

    if (obj == undefined || obj.length < 1) {
      return null;
    }

    return obj[0]['@id'];
  }
}

module.exports = JsonldUtils;