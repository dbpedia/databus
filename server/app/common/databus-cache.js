var NodeCache = require('node-cache');

class DatabusCache {

   constructor(time) {
      this.cache = new NodeCache({ stdTTL: time, checkperiod: time });

   }

   async get (cacheKey, promiseFactory) {

      var cachedData = this.cache.get(cacheKey);
   
      if (cachedData != undefined) {
         return cachedData;
      }
   
      var data = await promiseFactory();
   
      this.cache.set(cacheKey, data);
      return data;
   }
}

module.exports = DatabusCache;

/**
 * Takes a set of data requests (key,promise) and returns a promise
 * resolving to a data object. The data object will be of the form
 * [ (key => promiseResult) ]
 * @type {Array}
 
data.getData = function (dataRequests) {
   var promises = [];
   for (var r in dataRequests) {
      promises.push(dataRequests[r].promise);
   }

   return new Promise(function (resolve, reject) {
      Promise.all(promises).then(function (results) {

         var data = {};
         for (var i in results) {
            data[dataRequests[i].key] = results[i];
         }

         resolve(data);
      });
   });
}

/*
data.getUserAuthData = function(req) {
  return new Promise(function(resolve, reject) {
    resolve(authHelper.getAuthInfoFromRequest(req));
  });
}*/

/*
data.getArtifactFacets = function(artifactUri) {
  return promiseDataCached(artifactUri + CACHE_SUFFIX_FACETS, 
    () => sparqlEndpoint.getArtifactFacets(artifactUri));
}

data.getArtifactVersionsData = function(publisher, group, artifact) {
  var artifactUri = createResourceUri([ publisher, group, artifact]);
  return promiseDataCached(artifactUri + CACHE_SUFFIX_DATA,
    () =>  sparqlEndpoint.getArtifactVersionsData(artifactUri)
  );
}

/**
 * Returns a set of service objects with services being compatible with a
 * specific group
 * @param  {[type]} publisher The id of the publisher of the group
 * @param  {[type]} group     The group id
 * @return {[type]}           [description]

data.getServicesByGroup = function(publisher, group) {
  var groupUri = createResourceUri([ publisher, group ]);
  return promiseDataCached(groupUri + CACHE_SUFFIX_SERVICES, 
    () => sparqlEndpoint.getServicesByGroup(groupUri));
}

data.getServicesByPublisher = function(publisher) {
  var publisherUri = createResourceUri([ publisher ]);
  return promiseDataCached(publisherUri + CACHE_SUFFIX_SERVICES, 
    () => sparqlEndpoint.getServicesByPublisher(publisherUri));
}

data.getAppsByPublisher = function(publisher) {
  var publisherUri = createResourceUri([ publisher ]);
  return promiseDataCached(publisherUri + CACHE_SUFFIX_APPS, 
    () => sparqlEndpoint.getAppsByPublisher(publisherUri));
}


data.getVersionData = function(publisher, group, artifact, version) {
  var versionUri = createResourceUri([ publisher, group, artifact, version ]);
  return promiseDataCached(versionUri + CACHE_SUFFIX_DATA, 
    () => sparqlEndpoint.getVersionData(versionUri));
}

data.getGroupData = function(publisher, group) {
  var groupUri = createResourceUri([ publisher, group ]);
  return promiseDataCached(groupUri + CACHE_SUFFIX_DATA, 
    () => sparqlEndpoint.getGroupData(groupUri));
}

data.getVersionActions = function(publisher, group, artifact, version) {
  var versionUri = createResourceUri([ publisher, group, artifact, version ]);
  return promiseDataCached(versionUri + CACHE_SUFFIX_EXTRA, 
    () => sparqlEndpoint.getVersionActions(versionUri));
}

data.getPublisherData = function(publisher) {
  var publisherUri = createResourceUri([ publisher ]);
  return promiseDataCached(publisherUri + CACHE_SUFFIX_DATA, 
    () => sparqlEndpoint.getPublisherData(publisherUri));
}

data.getArtifactsByGroup = function(publisher, group) {
  var groupUri = createResourceUri([ publisher, group ]);
  return promiseDataCached(groupUri + CACHE_SUFFIX_CHILDREN, 
    () => sparqlEndpoint.getArtifactsByGroup(groupUri));
}

data.getGroupFacets = function(groupUri) {
  return promiseDataCached(groupUri + CACHE_SUFFIX_FACETS, 
    () => sparqlEndpoint.getGroupFacets(groupUri));
}

data.getVersionFacets = function(versionUri) {
  return promiseDataCached(versionUri + CACHE_SUFFIX_FACETS, 
    () => sparqlEndpoint.getVersionFacets(versionUri));
}



data.getCollectionStatistics = function(collectionUri) {
  return promiseDataCached(collectionUri + CACHE_SUFFIX_COLLECTIONS, 
    () => collectionsDatabase.getCollectionStatistics(collectionUri));
}

data.getModsByVersion = function(publisher, group, artifact, version) {
  var versionUri = createResourceUri([ publisher, group, artifact, version ]);
  return promiseDataCached(versionUri + CACHE_SUFFIX_MODS, () => sparqlEndpoint.getModsByVersion(versionUri));
}

data.getGroupsAndArtifactsByPublisher = function(publisher) {
  var publisherUri = createResourceUri([ publisher ]);
  return promiseDataCached(publisherUri + CACHE_SUFFIX_CHILDREN,
    () => sparqlEndpoint.getGroupsAndArtifactsByPublisher(publisherUri));
}

data.getDownloadUrl = function(publisher, group, artifact, version, file) {
  var fileUri = createResourceUri([ publisher, group, artifact, version, file ]);
  return promiseDataCached(fileUri + CACHE_SUFFIX_EXTRA, () => sparqlEndpoint.getDownloadUrl(fileUri));
}

data.getBlogEntry = function(articleId) {
  return promiseDataCached(articleId + CACHE_SUFFIX_BLOG, () => sparqlEndpoint.blog.getEntry(articleId));
}

data.getAllBlogEntries = function() {
  return promiseDataCached(CACHE_SUFFIX_BLOG, () => sparqlEndpoint.blog.getAllEntries());
}


data.getFrontPageData = function() {

  var promises = [
    sparqlEndpoint.getActivityChartData(),
    sparqlEndpoint.getUploadRankingData(),
    sparqlEndpoint.getRecentUploadsData()
  ];

  return promiseDataCached(CACHE_FRONT_PAGE, () => new Promise(function(resolve, reject) {
    Promise.all(promises).then(function(results) {
      var data = {};
      for(var i in results) {
        data.activityChartData = results[0];
        data.uploadRankingData = results[1];
        data.recentUploadsData = results[2];
      }

      resolve(data);
    }).catch(function(err) {
      console.log(err);
      reject();
    });
  }));
};

data.loadPublisherData = function(publisher) {

  var promises = [
    sparqlEndpoint.getPublisherData(publisher),
    sparqlEndpoint.getActivityChartDataByPublisher(publisher),
    sparqlEndpoint.getRecentUploadsByPublisher(publisher),
    sparqlEndpoint.getGroupsByPublisher(publisher),
    sparqlEndpoint.getServicesByPublisher(publisher)
  ]

  return promiseDataCached(publisher + CACHE_SUFFIX, 
    () => new Promise(function(resolve, reject) {
      Promise.all(promises).then(function(results) {
       
        if(results[0] == undefined) {
          return null;
        }
    
        var data = {};
        data.publisherData = results[0];
        data.activityChartData = results[1];
        data.uploadsData = results[2];
        data.groupsData = results[3];
        data.serviceData = results[4];
  
        resolve(data);
      }).catch(function(err) {
        console.log(err);
        reject();
      });
    }));
};


/**
 * 
 * 
 *    COLLECTIONS CACHE
 * 


data.getCollection = function(publisher, collection) {
  var graphUri = sanitizeUrl(BASE_URL + escape(publisher) + '/collections');
  var collectionUri = sanitizeUrl(graphUri + '/' + escape(collection));

  if(collectionUri === 'about:blank') {
    return promiseNothing();
  }

  return promiseDataCached(collectionUri + CACHE_SUFFIX_COLLECTIONS,
    () => sparqlEndpoint.collections.getCollection(publisher, collection));
}

data.getCollectionStatistics = function(collectionUri) {

  var collectionUri = sanitizeUrl(collectionUri);

  if(collectionUri === 'about:blank') {
    return promiseNothing();
  }

  console.log("statistics cache key: " + collectionUri + CACHE_SUFFIX_COLLECTION_STATISTICS);

  return promiseDataCached(collectionUri + CACHE_SUFFIX_COLLECTION_STATISTICS,
    () => sparqlEndpoint.collections.getCollectionStatistics(collectionUri));
}

data.getCollectionShasum = function(collectionUri) {
  var collectionUri = sanitizeUrl(collectionUri);
  if(collectionUri === 'about:blank') {
    return promiseNothing();
  }
  return promiseDataCached(collectionUri + CACHE_SUFFIX_COLLECTION_SHASUM,
    () => sparqlEndpoint.collections.getCollectionShasum(collectionUri));
}

data.updateCollectionsCache = function(uri, collection) {
  console.log("Set cache entry " + uri + CACHE_SUFFIX_COLLECTIONS);
  cache.set(uri + CACHE_SUFFIX_COLLECTIONS, collection);
}

data.getCollectionQuery = function(publisher, collectionId) {

  var graphUri = sanitizeUrl(BASE_URL + escape(publisher) + '/collections');
  var collectionUri = sanitizeUrl(graphUri + '/' + escape(collectionId));

  if(collectionUri === 'about:blank') {
    return promiseNothing();
  }

  return promiseDataCached(collectionUri + CACHE_SUFFIX_QUERY, 
    () => sparqlEndpoint.collections.getCollectionQuery(publisher, collectionId));
}

data.getCollectionsByPublisher = function(publisher, onlyIssued) {
  if(onlyIssued == true) {
    return promiseDataCached(publisher + CACHE_SUFFIX_COLLECTIONS, 
      () => sparqlEndpoint.collections.getCollectionsByPublisher(publisher, onlyIssued));
  }

  return sparqlEndpoint.collections.getCollectionsByPublisher(publisher, onlyIssued);
}


module.clearCollectionsCache = function(key) {
  console.log("Cleared cache entry " + key);
  cache.del(key + CACHE_SUFFIX_COLLECTIONS);
  cache.del(key + CACHE_SUFFIX_QUERY);
  cache.del(key + CACHE_SUFFIX_COLLECTION_STATISTICS);
  cache.del(key + CACHE_SUFFIX_COLLECTION_SHASUM);
}

/*
data.loadUserData = async function(req) {
  
  userData = databusUtils.getAuthInfoFromRequest(req);
  userData.userCollections = [];

  try {
    if(userData.authenticated) {
        userData.userCollections = await data.getCollectionsByPublisher(userData.info.username); 
    }
  } catch(err) {
    console.log(err);
  }

  return userData;
}
*/
