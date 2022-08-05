class DatabusCollectionManager {

  // Daten die wir haben:

  // Liste von Remote Collections (ungeladen) { uri: databus.org/asdf, label: asdffasd }
  // Liste von Working Copies in der Local Storage
  // Beispiel:
  // [0] : { uri: databus.org/asdf, label: asdffasd, content: { ... }, ... }
  // [1] : { uri: databus.org/asdsdff, label: asdasdfffasd }



  // On Initizialze:
  // Fuer alle remove collections -> finde lokale Kopie / erzeuge lokale Kopie

  // On Select / On Set Active
  // 1: Ist es ein Draft -> uri ist undefined
  // Ja? -> Collection direkt als Draft Anzeigen
  // Nein? -> Ist Collection schon geladen? content ist nicht undefined
  //          Ja? -> Lade async, uberschreibe remote entry
  //          Nein? -> Lade async, setze remote und local entry

  constructor($http, storageKey) {

    this.storageKeyPrefix = `${DATABUS_RESOURCE_BASE_URL}${storageKey}_${encodeURI(DATABUS_RESOURCE_BASE_URL)}`;
    window.sessionStorage.removeItem(`${this.storageKeyPrefix}_session`);

    this.sessionInfo = JSON.parse(window.sessionStorage.getItem(`${this.storageKeyPrefix}_session`));

    // window.sessionStorage.removeItem(this.storageKey);
    // window.sessionStorage.removeItem(this.storageKey + '_isInitialized');
    // window.localStorage.removeItem(this.storageKey);

    this.http = $http;
  }

  get accountName() {
    return this.sessionInfo != undefined ? this.sessionInfo.accountName : undefined;
  }

  async tryInitialize(accountName) {

    this.sessionInfo = {
      accountName: accountName
    };

    window.sessionStorage.setItem(`${this.storageKeyPrefix}_session`, JSON.stringify(this.sessionInfo));

    this.storageKey = `${this.storageKeyPrefix}__${accountName}`;
    this.remote = this.loadCollectionsFromStorage(false);
    this.local = this.loadCollectionsFromStorage(true);
    this.findActive();

    try {
      var res = await this.http.get(`/app/account/collections?account=${accountName}`);
      this.initialize(res.data);

    } catch (e) {
      console.log(`Failed to initialze collection manager.`);
      console.log(e);
    }
  }

  // Setze das remote array und update local array
  initialize(remoteCollections) {
    // We keep remote entries and local entries separately to detect diffs
    this.remote = {};

    // Load everyting from the local browser storage. All entries in the local browser
    // storage are indexed with a UUID identifier.
    // Remote collections that are pulled to the local browser storage will
    // also be given such an identifier
    // this.local = this.loadCollectionsFromLocalStorage();
    // This map will keep track of all local entries that already claim to have a remote counterpart
    let localPublished = {};

    for (let identifier in this.local) {
      if (!identifier.startsWith('___')) {
        delete this.local[identifier];
        continue;
      }

      if (identifier !== this.local[identifier].uuid) {
        delete this.local[identifier];
        continue;
      }

      let localCollection = this.local[identifier];

      if (localCollection.uri !== undefined && remoteCollections !== undefined) {
        let uri = localCollection.uri;
        // The local collection already has a URI
        if (remoteCollections[uri] === undefined) {
          // There is no remote collection with that URI - delete it! Keep the collection as a draft
          delete (this.local[identifier].uri);
          delete (this.local[identifier].issued);
          delete (this.local[identifier].created);
        } else {
          // Remember that the collection with uri already has a working copy
          localPublished[uri] = true;
          // Also remember the remote entry as an entry with a local working copy
          this.remote[identifier] = remoteCollections[uri];
          // Make sure the unchangeable values are set to the remote entry
          this.local[identifier].publisher = remoteCollections[uri].publisher;
          this.local[identifier].issued = remoteCollections[uri].issued;
          this.local[identifier].created = remoteCollections[uri].created;
          this.local[identifier].files = remoteCollections[uri].files;
        }
      }
    }

    for (let uri in remoteCollections) {
      if (localPublished[uri] === undefined) {
        // We don't have a working copy in our local storage yet, time to create an identifier!
        let identifier = DatabusCollectionUtils.uuidv4();
        remoteCollections[uri].uuid = identifier;
        // Create two entries, one in the local map, one in the remote map
        this.local[identifier] = DatabusCollectionUtils.createCleanCopy(remoteCollections[uri]);
        this.remote[identifier] = DatabusCollectionUtils.createCleanCopy(remoteCollections[uri]);
      }
    }

    for (let identifier in this.local) {
      // The local collection is now either a draft or a working copy of the remote - wrap it.
      this.local[identifier] = new DatabusCollectionWrapper(this.local[identifier]);
      // Sanitize content
      if (!(this.local[identifier].content instanceof Object)) {
        this.local[identifier].content = { groups: [], customQueries: [] };
      }
    }
    
    /*
    let activeIdentifier = this.activeCollectionIdentifier;
    // Set first collection as active

    if (this.local[activeIdentifier] !== undefined) {
      this.activeCollectionIdentifier = activeIdentifier;
    }
    */

    // Call this always in header-controller.js
    if (this.activeCollection == null) {
      // select first or create a new draft if we don't have any local drafts yet
      this.selectFirstOrCreate();
    }

    QueryNode.assignParents(this.activeCollection.content.root);

    // Save locally in case we created any local working copies
    this.saveLocally();

    if (this.initialized !== undefined) {
      this.initialized();
    }
  }

  findActive() {
    if (!this.isInitialized) throw "Databus-Collection-Manager is not initialized1.";
    if (this.activeCollection == undefined) {
      this.selectFirstOrCreate();
    }
  }

  get isInitialized() {
    return this.accountName != null;
  }

  loadCollectionsFromStorage(local = true) {
    let collections;

    if (local) {
      collections = JSON.parse(window.localStorage.getItem(this.storageKey));
    } else {
      collections = JSON.parse(window.sessionStorage.getItem(this.storageKey));
    }

    if (collections == null) {
      collections = {};
    }

    for (let identifier in collections) {
      if (identifier === undefined || identifier === "undefined") {
        delete (collections[identifier]);
      } else {
        //enable Collection Utils for all collections in local storage
        collections[identifier] = new DatabusCollectionWrapper(collections[identifier]);
      }
    }

    return collections;
  }

  /**
   * Selects the first collection in the local list or creates a new draft
   */
  selectFirstOrCreate() {

    for (let identifier in this.local) {
      this.setActive(identifier);
      break;
    }

    // Create new collection if current is null
    if (this.activeCollection == null) {
      this.createNew("Unnamed Collection", "", function (response) { });
    }
  }

  setActive(uuid) {
    if (!this.isInitialized) throw "Databus-Collection-Manager is not initialized1.";

    this.convertCollectionContentToTree(uuid);

    let collection = this.local[uuid];
    QueryNode.assignParents(collection.content.root);

    this.sessionInfo.activeCollectionIdentifier = uuid;
    window.sessionStorage.setItem(`${this.storageKeyPrefix}_session`, JSON.stringify(this.sessionInfo));

  }

  get activeCollectionIdentifier() {
    return this.sessionInfo != null ? this.sessionInfo.activeCollectionIdentifier : null;
  }

  get activeCollection() {
    if (this.activeCollectionIdentifier == null) {
      return null;
    }

    return this.local[this.activeCollectionIdentifier];
  }

  convertCollectionContentToTree(uuid) {
    let collection = this.local[uuid];

    if (collection.content.root !== undefined) {
      return;
    }

    collection.content.root = new QueryNode(null, null);

    for (var g in collection.content.groups) {
      var group = collection.content.groups[g];
      var groupNode = new QueryNode(group.uri, 'dataid:group');

      // add group facets
      for (var s in group.settings) {
        var setting = group.settings[s];

        if (setting.value === 'SYSTEM_LATEST_ARTIFACT_VERSION' || setting.value === 'SYSTEM_LATEST_GROUP_VERSION') {
          setting.value = '$latest';
        }

        groupNode.setFacet(setting.facet, setting.value, setting.checked);
      }

      collection.content.root.addChild(groupNode);


      for (var a in group.artifacts) {
        var artifact = group.artifacts[a];

        var artifactNode = new QueryNode(artifact.uri, 'dataid:artifact');

        // add artifact facets

        groupNode.addChild(artifactNode);
      }
    }

  }

  createSnapshot(source) { // convert each version="latest" to actual latest version
    if (!this.isInitialized) throw "Databus-Collection-Manager is not initialized.";

    let collection = DatabusCollectionWrapper.createNew();
    collection.content = DatabusCollectionUtils.createCleanCopy(source.content);

    let root = collection.content.root;
    for (var g in root.childNodes) {
      var graph = root.childNodes[g];

      for (var s in graph.facetSettings) {
        if (graph.facetSettings[s][0].value === '$latest') {
          this.http.get('/app/utils/facets', {
            params: { uri: artifact.uri, type: 'group' }
          }).then(function (result) {
            let versions = result.data["http://purl.org/dc/terms/hasVersion"].values;
            let latestVersion = versions.reduce(function (a, b) { return a > b ? a : b; });
            artifact.facetSettings[s][0].value = latestVersion;
          });
        }
      }

      for (var a in graph.childNodes) {
        var artifact = graph.childNodes[a];

        for (var s in artifact.facetSettings) {
          if (artifact.facetSettings[s][0].value === '$latest') {
            this.http.get('/app/utils/facets', {
              params: { uri: artifact.uri, type: 'artifact' }
            }).then(function (result) {
              let versions = result.data["http://purl.org/dc/terms/hasVersion"].values;
              let latestVersion = versions.reduce(function (a, b) { return a > b ? a : b; });
              artifact.facetSettings[s][0].value = latestVersion;
            });
          }
        }

      }

    }


    collection.label = `Snapshot of ${source.label}`;
    collection.description = source.description;
    collection.abstract = source.abstract;

    this.local[collection.uuid] = new DatabusCollectionWrapper(collection);
    this.saveLocally();
    this.setActive(collection.uuid);

    return collection;
  }

  saveLocally() {
    if (!this.isInitialized) throw "Databus-Collection-Manager is not initialized.";

    if (this.activeCollection != null) {
      this.activeCollection.hasLocalChanges = this.hasLocalChanges(this.activeCollection);
    }

    try {
      //write local collections to local storage
      window.localStorage.setItem(this.storageKey, DatabusCollectionUtils.serialize(this.local));
      //write remote collections to session storage
      window.sessionStorage.setItem(this.storageKey, DatabusCollectionUtils.serialize(this.remote));
    } catch (e) {
      console.log(e);
    }
  }

  hasLocalChanges(localCollection) {
    if (this.remote[localCollection.uuid] === undefined) {
      return true;
    }

    let remoteCollection = this.remote[localCollection.uuid];

    let serializedRemoteContent = DatabusCollectionUtils.serialize(remoteCollection.content);
    let serializedLocalContent = DatabusCollectionUtils.serialize(localCollection.content);

    return localCollection.label !== remoteCollection.label
      || localCollection.abstract !== remoteCollection.abstract
      || localCollection.description !== remoteCollection.description
      || serializedLocalContent !== serializedRemoteContent;
  }

  discardLocalChanges(remoteCollections) {

    if (!this.isInitialized) throw "Databus-Collection-Manager is not initialized.";

    let uuid = this.activeCollection.uuid;

    if (this.remote[uuid] === undefined) {
      return;
    }

    let uri = this.activeCollection.uri;

    if (uri == undefined) {
      return;
    }

    if (remoteCollections != undefined && remoteCollections[uri] != undefined) {
      this.remote[uuid] = DatabusCollectionUtils.createCleanCopy(remoteCollections[uri])
    }

    this.local[uuid].label = this.remote[uuid].label;
    this.local[uuid].abstract = this.remote[uuid].abstract;
    this.local[uuid].description = this.remote[uuid].description;
    this.local[uuid].content = DatabusCollectionUtils.createCleanCopy(this.remote[uuid].content);
    this.local[uuid].hasLocalChanges = this.hasLocalChanges(this.local[uuid]);
  }

  addElement(elementQuery) {
    this.current.addElement(elementQuery);
    this.saveLocally();

    if (this.onactiveCollectionChanged != null) {
      this.onactiveCollectionChanged(this.current);
    }
  }

  removeElement(elementGuid) {
    this.current.removeElement(elementGuid);
    this.saveLocally();

    if (this.onactiveCollectionChanged != null) {
      this.onactiveCollectionChanged(this.current);
    }
  }



  createNew(label, description, callback) {
    if (!this.isInitialized) throw "Databus-Collection-Manager is not initialized.";

    let reg = /^\w+[\w\s]*$/;

    if (label === undefined || !reg.test(label)) {
      callback(false);
      return;
    }

    let collection = DatabusCollectionWrapper.createNew(label, description, DATABUS_RESOURCE_BASE_URL);

    this.local[collection.uuid] = new DatabusCollectionWrapper(collection);
    this.setActive(collection.uuid);
    this.saveLocally();

    callback(true);
  }

  createDraft(callback) {
    if (!this.isInitialized) {
      return;
    }

    let collection = DatabusCollectionWrapper.createNew('', '');
    this.local[collection.uuid] = new DatabusCollectionWrapper(collection);
    this.setActive(collection.uuid);
    this.saveLocally()

    callback(DatabusResponse.COLLECTION_DRAFT_CREATED);
  }

  createCopy(source) {
    if (!this.isInitialized) throw "Databus-Collection-Manager is not initialized.";

    let collection = DatabusCollectionWrapper.createNew();
    collection.content = DatabusCollectionUtils.createCleanCopy(source.content);
    collection.label = `Copy of ${source.label}`;
    collection.description = source.description;
    collection.abstract = source.abstract;

    this.local[collection.uuid] = new DatabusCollectionWrapper(collection);
    this.saveLocally();
    this.setActive(collection.uuid);

    return collection;
  }



  deleteLocally(callback) {
    delete this.local[this.activeCollection.uuid];
    this.selectFirstOrCreate();
    this.saveLocally();

    callback({ code: 909 });
  }

  /**
   * Returns the collection or null
   * @param  {[type]} uri [description]
   * @return {[type]}      [description]
   */
  getCollectionByUri(uri) {
    if (uri == null)
      return null;

    for (let identifier in this.local) {
      if (uri === this.local[identifier].uri) {
        return this.local[identifier];
      }
    }
    return null;
  }

  /**
   * Returns the first collection or null
   * @return {[type]} [description]
   */
  getFirstCollection() {
    if (this.local.length === 0) {
      return null;
    }
    return this.local[0];
  }


  async changeCollection(username, collectionTag, method, issued = false) {
    try {
      if (!this.isInitialized) throw "Databus-Collection-Manager is not initialized.";

      // // Don't push this way if the collection is already pushed (use update)
      // if (!this.activeCollection.isDraft) {
      //   throw { code: DatabusResponse.COLLECTION_INVALID_ARGUMENT };
      // }

      this.saveLocally();

      // Keep the identifier of the collection we want to push
      var pushIdentifier = this.activeCollection.uuid;

      var targetUri = `/${username}/collections/${collectionTag}`;
      var publisherUri = `${DATABUS_RESOURCE_BASE_URL}/${username}#this`;

      var ignoreKeys = [
        'parent',
        '$$hashKey',
        'expanded',
        'files',
        'eventListeners',
        'hasLocalChanges',
        'published',
        'uuid',
      ];

      var contentString = encodeURIComponent(DatabusCollectionUtils.serialize(this.activeCollection.content, ignoreKeys));

      // Format collection as json-ld

      let collectionJsonLd = {
        "@context": JSONLD_CONTEXT,
        "@graph": [
          {
            "@id": DATABUS_RESOURCE_BASE_URL + targetUri,
            "@type": "dataid:Collection",
            "publisher": publisherUri,
            "title": this.activeCollection.label,
            "abstract": this.activeCollection.abstract,
            "description": this.activeCollection.description,
            "dataid:content": contentString
          }
        ]
      };

      if (this.activeCollection.issued != undefined) {
        collectionJsonLd["@graph"][0].issued = this.activeCollection.issued;
      }

      if (issued) {
        collectionJsonLd["@graph"][0].issued = new Date().toISOString();
      }

      var response = null;

      try {

        response = await this.http.put(targetUri, collectionJsonLd);

      } catch (errResponse) {
        console.log(errResponse);
        throw { code: errResponse.data.code };
      }

      // Get the remotely saved collection from the payload
      var remoteGraph = response.data.data[0];

      // If the user changed the active collection in the meantime throw an error. This
      // should be prevented by a loading dialog
      if (this.activeCollection.uuid != pushIdentifier) {
        throw { code: DatabusResponse.COLLECTION_INVALID_ARGUMENT };
      }

      //Update remote data
      this.remote[pushIdentifier] = JSON.parse(DatabusCollectionUtils.serialize(this.activeCollection));

      // Update the local data
      this.local[pushIdentifier].uri = remoteGraph['@id'];
      this.local[pushIdentifier].hasLocalChanges = this.hasLocalChanges(this.local[pushIdentifier]);
      // this.local[pushIdentifier].modified = this.activeCollection.modified;
      // this.local[pushIdentifier].issued = this.activeCollection.issued;
      // this.local[pushIdentifier].created = this.activeCollection.created;
      // this.local[pushIdentifier].files = this.activeCollection.files;
      this.saveLocally();

      return response.data;

    } catch (err) {
      throw {
        code: err.data !== undefined && err.data.code !== undefined ? err.data.code :
          DatabusResponse.COLLECTION_UPDATE_ERROR
      };
    }
  }

  /**
   * Publish the collection under the specified username and collection id
   * @param  {[type]}   username     [description]
   * @param  {[type]}   collectionTag [description]
   * @return {[type]}                [description]
   */
  async commitCollection(username, collectionTag) {
    return await this.changeCollection(username, collectionTag, "put");
  }

  async updateCollection(username, collectionTag) {
    return await this.changeCollection(username, collectionTag, "patch");
  }

  async unHideCollection(username, collectionTag) {
    try {
      if (!this.isInitialized) throw "Databus-Collection-Manager is not initialized.";

      var updateResponse = await this.changeCollection(username, collectionTag, "patch", true);
      var updatedCollection = this.getCollectionByUri(updateResponse.data[0]['@id']);

      this.remote[updatedCollection.uuid].issued = updateResponse.data[0]['http://purl.org/dc/terms/issued'][0]['@value'];
      this.local[updatedCollection.uuid].issued = updateResponse.data[0]['http://purl.org/dc/terms/issued'][0]['@value'];

      this.saveLocally();
      return { code: updateResponse.code };
    } catch (err) {
      throw {
        code: err.data !== undefined && err.data.code !== undefined ? err.data.code :
          DatabusResponse.COLLECTION_UPDATE_ERROR
      };
    }
  }

  async hideCollection(username, collectionTag) {
    try {
      if (!this.isInitialized) throw "Databus-Collection-Manager is not initialized.";

      var updateResponse = await this.changeCollection(username, collectionTag, "patch");
      var updatedCollection = this.getCollectionByUri(updateResponse.data[0]['@id']);

      delete this.remote[updatedCollection.uuid].issued;
      delete this.local[updatedCollection.uuid].issued;

      this.saveLocally();
      return { code: updateResponse.code };
    } catch (err) {
      throw {
        code: err.data !== undefined && err.data.code !== undefined ? err.data.code :
          DatabusResponse.COLLECTION_UPDATE_ERROR
      };
    }
  }

  /**
   * Fetches the remote data of the current collection and assigns the field values to the local copy
   */
  async fetchCollection(uri) {
    try {
      if (!this.isInitialized) throw "Databus-Collection-Manager is not initialized.";

      var req = {
        method: 'GET',
        url: uri,
        headers: { 'Accept': 'application/json' }
      };

      var getResponse = await this.http(req);
      var collection = getCollectionByUri(uri);

      this.local[collection.uuid].content = getResponse.data.content;
      this.local[collection.uuid].created = getResponse.data.created;
      this.local[collection.uuid].issued = getResponse.data.issued;
      this.local[collection.uuid].label = getResponse.data.label;
      this.local[collection.uuid].abstract = getResponse.data.abstract;
      this.local[collection.uuid].description = getResponse.data.description;
      this.local[collection.uuid].files = getResponse.data.files;
    } catch (errResponse) {
      console.log(errResponse);
      return errResponse.data;
    }
  }

  async deleteCollection(username, collectionTag) {
    try {
      if (!this.isInitialized) throw "Databus-Collection-Manager is not initialized.";

      // Keep the identifier of the collection we want to push
      let deleteIdentifier = this.activeCollection.uuid;

      if (this.activeCollection.isDraft) {
        delete this.local[deleteIdentifier];
        this.saveLocally();
        return { code: DatabusResponse.COLLECTION_DELETED };
      }

      let uri = this.activeCollection.uri;
      let tag = DatabusCollectionUtils.uriToName(uri);

      var targetUri = `/${username}/collections/${collectionTag}`;

      let deleteResponse = await this.http.delete(targetUri);

      delete this.remote[deleteIdentifier];
      delete this.local[deleteIdentifier];

      return deleteResponse.data;
    } catch (errResponse) {
      console.log(errResponse);
      return errResponse.data;
    }
  }

  /**
   revert(username, callback) {
 
    var self = this;
 
    var req = {
      method: 'GET',
      url: this.activeCollection.uri,
      headers: {
        'Accept': 'application/json'
      }
    };
 
    this.http(req)
      .then(function(response) {
 
      self.activeCollection.groups = response.data.groups;
      self.activeCollection.customQueries = response.data.customQueries;
      self.activeCollection.label = response.data.label;
      self.activeCollection.descrtiption = response.data.description;
      self.activeCollection.published = true;
 
      callback({ code : 908 });
    }, function(error) {
      console.log(error);
    });
 
  }*/
}


