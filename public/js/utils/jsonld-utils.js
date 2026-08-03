const DatabusUris = require("./databus-uris");


class JsonldUtils {

  static refTo(uri) {
    var result = {};
    result[DatabusUris.JSONLD_ID] = uri;
    return result;
  }

  static getTypedGraph(graphs, graphType) {

    for (var g in graphs) {
      var graph = graphs[g];

      if (graph[DatabusUris.JSONLD_TYPE] != undefined && graph[DatabusUris.JSONLD_TYPE].includes(graphType)) {
        return graph;
      }
    }

    return null;
  }

  static setLiteral(graph, property, type, value) {
    graph[property] = [];

    var entry = {};
    if (type != null) {
      entry[DatabusUris.JSONLD_TYPE] = type;
    }
    entry[DatabusUris.JSONLD_VALUE] = value;

    graph[property].push(entry);
  }

  static setLink(graph, property, uri) {
    graph[property] = [];

    var entry = {};
    entry[DatabusUris.JSONLD_ID] = uri;

    graph[property].push(entry);
  }

  static getGraphById = function (graphs, id) {
    return graphs.find(g => g[DatabusUris.JSONLD_ID] === id);
  };

  static getRefArrayProperty = function (graph, propertyUri) {
    const val = graph[propertyUri];
    if (!val) return [];
    return val.map(v => v[DatabusUris.JSONLD_ID]);
  };

  static getProperty(graph, property) {
    if (graph[property] == undefined) {
      return null;
    }

    if (graph[property].length == 1) {
      var value = graph[property][0];

      if (value[DatabusUris.JSONLD_VALUE] != null) {
        return value[DatabusUris.JSONLD_VALUE];
      }

      if (value[DatabusUris.JSONLD_ID] != null) {
        return value[DatabusUris.JSONLD_ID];
      }

      return null;
    } else {
      var result = [];

      for (var value of graph[property]) {

        if (value[DatabusUris.JSONLD_VALUE] != null) {
          result.push(value[DatabusUris.JSONLD_VALUE]);
        }

        if (value[DatabusUris.JSONLD_ID] != null) {
          result.push(value[DatabusUris.JSONLD_ID]);
        }
      }

      if (result.length > 0) {
        return result;
      }
    }

    return null;
  }

  static getFirstProperty(graph, property) {
    if (graph[property] == undefined) {
      return null;
    }

    const values = graph[property];

    if (values.length === 0) {
      return null;
    }

    if (values.length === 1) {
      const value = values[0];

      if (value[DatabusUris.JSONLD_VALUE] != null) {
        return value[DatabusUris.JSONLD_VALUE];
      }

      if (value[DatabusUris.JSONLD_ID] != null) {
        return value[DatabusUris.JSONLD_ID];
      }

      return null;
    }

    for (const value of values) {
      if (value[DatabusUris.JSONLD_VALUE] != null) {
        return value[DatabusUris.JSONLD_VALUE];
      }

      if (value[DatabusUris.JSONLD_ID] != null) {
        return value[DatabusUris.JSONLD_ID];
      }
    }

    return null;
  }


  static getGraphById(graphs, id) {
    for (var g in graphs) {
      var graph = graphs[g];

      if (graph[DatabusUris.JSONLD_ID] != undefined && graph[DatabusUris.JSONLD_ID] == id) {
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

  static getFirstObjectUri(graph, property) {
    // Get the object    
    const obj = graph[property];

    // Not found -> null
    if (!obj) {
      return null;
    }

    // If it is an array...
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && typeof item === 'object' && DatabusUris.JSONLD_ID in item) {
          return item[DatabusUris.JSONLD_ID];
        }
      }
    } else if (typeof obj === 'object' && DatabusUris.JSONLD_ID in obj) {
      return obj[DatabusUris.JSONLD_ID];
    }

    return null;
  }
}



if (typeof module === "object" && module && module.exports)
  module.exports = JsonldUtils;