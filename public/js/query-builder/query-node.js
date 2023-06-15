/**
 * A query node is a node in a query tree. A query tree can be built for any hierarchical selection
 * on the databus, such as publishers, groups, artifacts and collections.
 * Each node may declare a range of restrictions. Restrictions can then be overriden again by
 * any child node in the hierarchy.
 * 
 * EXAMPLE: Group node says: Select everything in English. One specific artifact child node of the
 * group node then states: I don't want to select English, I will select German. 
 * 
 * A query tree can then be translated into a SPARQL query that tries to use as few statements as possible
 * to fetch the desired data
 */
class QueryNode {

  /**
   * Creates a new QueryNode with a resource URI and a property. The property will be added to the
   * query as a forced and non-overrideable restriction
   * @param {*} uri 
   * @param {*} property 
   */
  constructor(uri, property) {
    this.uri = uri;
    this.property = property;
    this.childNodes = [];
    this.facetSettings = {};
  }

  // Set or unset a facet of the query node
  setFacet(key, value, checked) {

    var list = this.facetSettings[key];

    if(list == undefined) {
      this.facetSettings[key] = [];
      list = this.facetSettings[key];
    }

    if(!this.isOverride(key, value, checked)) {
      
      for(var i = 0; i < list.length; i++) {
        if(list[i].value == value) {
          list.splice(i, 1);
        }
      }

      if(list.length == 0) {
        delete this.facetSettings[key];
      }
      
      return;
    }

    for(var i in list) {
      if(list[i].value == value) {
        list[i].checked = checked;
        return;
      }
    }
   
    list.push({ value : value, checked : checked });
  }

  

  /**
   * Check whether a certain facet setting is an override in the hierarchy
   * @param {*} key 
   * @param {*} value 
   * @param {*} checked 
   */
  isOverride(key, value, checked) {

    if(checked == undefined) {
      var setting = QueryNode.findFacetSetting(this, key, value);
      checked = setting != null ? setting.checked : false;
    }

    var parentSetting = QueryNode.findInheritedSetting(this.parent, key, value);

    if(parentSetting == undefined) {
      return checked;
    }

    return parentSetting.checked != checked;
  }

  /**
   * Add a child node to this node
   * @param {*} node 
   */
  addChild(node) {
    this.childNodes.push(node);
    // node.parent = this;
  }

  static removeChildByUri(node, uri) {
    for(var i = 0; i < node.childNodes.length; i++) {
      if(node.childNodes[i].uri == uri) {
        node.childNodes.splice(i, 1);
        return;
      }

      QueryNode.removeChildByUri(node.childNodes[i], uri);
    }
  }

  static findChildByUri(node, uri) {
    for(let i = 0; i < node.childNodes.length; i++) {
      if(node.childNodes[i].uri === uri) {
        node.childNodes[i] = QueryNode.createFrom(node.childNodes[i]);
        return node.childNodes[i];
      }

      let result = QueryNode.findChildByUri(node.childNodes[i], uri);

      if(result != null) {
        return result;
      }
    }

    return null;  
  }

  hasFacetSetting(key, value) {
    for(var i in this.facetSettings[key]) {

      var setting = this.facetSettings[key][i];

      if(setting.value == value) {
        return true;
      }
    }

    return false;
  }

   /**
   * Create a settings object with all the facet settings active for this node (inluding inherited settings)
   * @param {*} node 
   */
  createFullFacetSettings() {
    
    var fullSettings = {};

    for(var facetUri in this.facetSettings) {
      fullSettings[facetUri] = JSON.parse(JSON.stringify(this.facetSettings[facetUri]));
    }

    var parentNode = this.parent;

    while(parentNode != undefined) {

      for(var facetUri in parentNode.facetSettings) {

        if(fullSettings[facetUri] == undefined) {
          fullSettings[facetUri] = [];
        }
        
        for(var i in parentNode.facetSettings[facetUri]) {

          var parentSetting = parentNode.facetSettings[facetUri][i];

          if(!this.hasFacetSetting(facetUri, parentSetting.value)) {
            fullSettings[facetUri].push(JSON.parse(JSON.stringify(parentSetting)));
          }
        }
      }

      parentNode = parentNode.parent;
    }

    return fullSettings;
  }

  static serialize(queryNode) {
    // QueryNode.clearParents(queryNode);
    var result = JSON.stringify(queryNode);
    // QueryNode.assignParents(queryNode);
    return result;
  }


  static addChild(node, child) {
    node.childNodes.push(child);
    // child.parent = node;
  }

  static mergeAddChild(root, child) {
    var existingNode = QueryNode.findChildByUri(root, child.uri);

    if(existingNode == null) {
      QueryNode.addChild(root, child); 
      return true;
    }

    if(child.childNodes.length == 0) {
      return false;
    }

    for(var i in child.childNodes) {
      QueryNode.mergeAddChild(existingNode, child.childNodes[i]);
    }
  }

  /*
  static clearParents(queryNode) {
    queryNode.parent = null;
    for(var i = 0; i < queryNode.childNodes.length; i++) {
      QueryNode.clearParents(queryNode.childNodes[i]);
    }
  }

  static assignParents(queryNode) {
    for(var i = 0; i < queryNode.childNodes.length; i++) {
      queryNode.childNodes[i].parent = queryNode;
      QueryNode.assignParents(queryNode.childNodes[i]);
    }
  }
*/

  static expandAll(queryNode) {
    queryNode.expanded = true;
    for(var i = 0; i < queryNode.childNodes.length; i++) {
      QueryNode.expandAll(queryNode.childNodes[i]);
    }
  }

  static findParentNodeRecursive(parent, node) {

    if(node.uri == null) {
      return null;
    }
    
    if(parent.childNodes == null || parent.childNodes.length == 0) {
      return null;
    }

    for(var child of parent.childNodes) {
      if(child.uri == node.uri) {
        return parent;
      }
    }     
    
    for(var child of parent.childNodes) {
      var recParent = QueryNode.findParentNodeRecursive(child, node);

      if(recParent != null) {
        return recParent;
      }
    }

    return null;
  }

  /**
   * Copy constructor to use the QueryNode class inside of angular components
   * @param {*} obj 
   */
  static createFrom(obj) {
    var tmpNode = new QueryNode(obj.uri, obj.property);
    tmpNode.childNodes = obj.childNodes;
    tmpNode.facetSettings = obj.facetSettings;
    // tmpNode.parent = obj.parent;
    tmpNode.files = obj.files;
    return tmpNode;
  }

  static createSubTree(obj) {
    var node = QueryNode.createFrom(obj);
    node.facetSettings = node.createFullFacetSettings();
    // node.parent = null;
    return node;
  }

  /**
   * Search a specific node for a certain facet setting
   * @param {*} node 
   * @param {*} key 
   * @param {*} value 
   */
  static findFacetSetting(node, key, value) {
    if(node == undefined || node.facetSettings == undefined) {
      return undefined;
    }

    var settingsList = node.facetSettings[key];

    if(settingsList == undefined) {
      return undefined;
    }

    for(var i in settingsList) {
      var setting = settingsList[i];

      if(setting.value == value) {
        return setting;
      }
    }

    return undefined;
  }

  static findInheritedSetting(node, key, value) {
    
    if(node == null) {
      return undefined;
    }

    var setting = QueryNode.findFacetSetting(node, key, value);

    if(setting == undefined) {
      return QueryNode.findInheritedSetting(node.parent, key, value);
    }

    return setting;
  }
}

module.exports = QueryNode;
