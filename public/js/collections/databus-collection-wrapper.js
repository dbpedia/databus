
class DatabusCollectionWrapper {

  /**
   * Creates a new DatabusCollection from an already existing
   * @param {[type]} data [description]
   */
  constructor(data) {
    Object.assign(this, data);
    this.eventListeners = {};
  }

  addEventListener(name, callback) {
    if(this.eventListeners[name] == undefined) {
      this.eventListeners[name] = [];
    }

    this.eventListeners[name].push(callback);
  }

  isPublisher(username) {
    return this.uri != undefined && this.uri.startsWith('https://databus.dbpedia.org/' + username);
  }

  get isPublished() {
    return this.issued != undefined;
  }

  get displayLabelHtml() {
    var l = '';
    if(this.isDraft) {
      l += '<span style="color: #8a8cb3; margin-right:4px">DRAFT:</span>';
    }
    l += (this.label != undefined && this.label.length > 0) ? this.label : 'Untitled Collection';
    return l;
  }

  get isDraft() {
    return this.uri === undefined;
  }

  fireEvent(name) {
    if(this.eventListeners[name] == undefined) {
      return;
    }

    for(var c in this.eventListeners[name]) {
      var callback = this.eventListeners[name][c];
      callback();
    }
  }


  static createNew(label, description, source) {

    var data = {};
    data.uuid = DatabusCollectionUtils.uuidv4();
    data.label = label;
    data.description = description;
    data.content = {};
    data.content = {};
    data.content.root = new QueryNode(null, null);
    data.content.root.addChild(new QueryNode(source, null));

    return data;
  }

  /**
   * Builds a composed query from all elements
   * @return {[type]} [description]
   */
  createQuery() {

    if(this.content.root == undefined) {
      return null;
    }

    return QueryBuilder.build({
      template : QueryTemplates.DEFAULT_FILE_TEMPLATE,
      resourceBaseUrl : DATABUS_RESOURCE_BASE_URL,
      node: this.content.root
    });
  }

  /**
   * Downloads the entire collection object as json
   * @return {[type]} [description]
   */
  downloadAsJson(){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(angular.toJson(this));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", this.label + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  removeCustomQueryNode(node) {
    this.content.customQueries = this.content.customQueries.filter(function(n){
      return node.guid != n.guid;
    });
  }

  removeNodeByUri(uri) {
    QueryNode.removeChildByUri(this.content.root, uri);
  }

  removeGroupNode(groupNode) {
    this.content.groups = this.content.groups.filter(function(a){
      return groupNode.uri != a.uri;
    });
  }

  addCustomQueryNode(label, query) {
    this.content.customQueries.push({
      guid : DatabusCollectionUtils.uuidv4(),
      label : label,
      query : query,
    });
  }

  hasGroup(groupUri) {
    var group = this.findGroup(groupUri);
    return group != undefined;
  }

  hasArtifact(artifactUri) {
    var groupUri = DatabusCollectionUtils.navigateUp(artifactUri);

    var group = this.findGroup(groupUri);

    if(group == undefined) {
      return false;
    }

    var artifact = this.findArtifact(group, artifactUri);
    return artifact != undefined;
  }

  /**
   * Adds a new group node with label, uri and settings
   * @param {[type]} groupUri   [description]
   * @param {[type]} groupLabel [description]
   * @param {[type]} settings   [description]
   */
  addGroupNode(groupUri, settings) {

    var group = this.findGroup(groupUri);

    if(group == undefined) {

      var publisherUri = DatabusCollectionUtils.navigateUp(groupUri);

      var groupLabel = DatabusCollectionUtils.uriToName(groupUri);
      var publisherLabel = DatabusCollectionUtils.uriToName(publisherUri);

      group = {};
      group.uri = groupUri;
      group.artifacts = [];
      group.label = publisherLabel + " » " + groupLabel;
      group.settings = settings;
      group.expanded = true;

      this.content.groups.push(group);

      this.fireEvent("onGroupAdded");
    }

    return group;
  }

  /**
   * Adds a new artifact node with label uri and settings
   * This will fail if the appropriate group node has not been
   * added previously
   * @param {[type]} artifactUri   [description]
   * @param {[type]} artifactLabel [description]
   * @param {[type]} settings      [description]
   */
  addArtifactNode(artifactUri, artifactLabel, settings) {

    var groupUri = DatabusCollectionUtils.navigateUp(artifactUri);
    var group = this.addGroupNode(groupUri, [ 
      {
        facet: "http://purl.org/dc/terms/hasVersion",
        value: "SYSTEM_LATEST_ARTIFACT_VERSION",
        checked: true
      }]);

    var artifact = this.findArtifact(group, artifactUri);

    if(artifact == undefined) {
      artifact = {};
      artifact.uri = artifactUri;
      artifact.label = artifactLabel;
      artifact.settings = settings;

      group.artifacts.push(artifact);
      
      // TODO: merge facets
    

      this.fireEvent("onArtifactAdded");
    }
  }

  findGroup(groupUri) {
    for(var g in this.content.groups) {
      var group = this.content.groups[g];

      if(group.uri == groupUri) {
        return group;
      }
    }

    return null;
  }

  findArtifact(group, artifactUri) {
    for(var a in group.artifacts) {
      var artifact = group.artifacts[a];

      if(artifact.uri == artifactUri) {
        return artifact;
      }
    }

    return null;
  }
}
