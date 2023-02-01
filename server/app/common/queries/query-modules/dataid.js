const baseUrl = process.env.DATABUS_RESOURCE_BASE_URL;
const DatabusUris = require('../../../../../public/js/utils/databus-uris');
const exec = require('../../execute-query');
const UriUtils = require('../../utils/uri-utils');

let instance = {};

instance.getGroupByUri = async function (groupUri) {

  // Create the query and insert the account uri
  let queryOptions = { GROUP_URI: groupUri };
  let query = exec.formatQuery(require('../sparql/get-group.sparql'), queryOptions);
  let bindings = await exec.executeSelect(query);

  return bindings.length !== 0 ? bindings[0] : null;
}

/**
 * Get information about a databus group
 */
instance.getGroup = async function (accountName, group) {

  let groupUri = UriUtils.createResourceUri([accountName, group]);
  if (groupUri == null) {
    return null; // TODO throw error?
  }

  // Create the query and insert the account uri
  let queryOptions = { GROUP_URI: groupUri };
  let query = exec.formatQuery(require('../sparql/get-group.sparql'), queryOptions);
  let bindings = await exec.executeSelect(query);
  var group = bindings.length !== 0 ? bindings[0] : null;

  return group;
}

/**
 * ASK whether a group exists
 * @param {*} accountName 
 * @param {*} groupName 
 * @returns 
 */
instance.hasGroup = async function(accountName, groupName) {
  let groupUri = UriUtils.createResourceUri([accountName, groupName]);
  return await exec.executeAsk(`ASK { <${groupUri}> a <${DatabusUris.DATAID_GROUP}> }`);
}

/**
 * Retrieves all artifacts by account name
 * @param {*} accountName 
 */
instance.getGroupsAndArtifactsByAccount = async function (accountName) {
  try {
    // Get a sanitized account uri
    let accountUri = UriUtils.createResourceUri([accountName]);
    if (accountUri == null) {
      return null; // TODO throw error?
    }

    // Create the query and insert the account uri
    let queryOptions = { ACCOUNT_URI: accountUri };
    let query = require('../sparql/get-artifacts-by-account.sparql');
    query = exec.formatQuery(query, queryOptions);
    // Execute the query to get a list of bindings
    let bindings = await exec.executeSelect(query);

    // Do some post-processing on the bindings to create a result object
    let result = {};
    for (let b in bindings) {
      let binding = bindings[b];

      if (binding.groupLabel === undefined) {
        binding.groupLabel = UriUtils.uriToLabel(binding.groupUri);
      }

      if (result[binding.groupUri] === undefined) {
        result[binding.groupUri] = {};
        result[binding.groupUri].label = binding.groupLabel;
        result[binding.groupUri].id = UriUtils.uriToName(binding.groupUri);
        result[binding.groupUri].uri = binding.groupUri;
        result[binding.groupUri].description = binding.groupDescription;
        result[binding.groupUri].artifacts = [];
      }

      binding.id = UriUtils.uriToName(binding.artifactUri);
      result[binding.groupUri].artifacts.push(binding);
    }

    // return the result object
    return result;
  } catch (err) {
    // log an error if there is one and return null;
    console.log(err);
    return null;
  }
}

/**
 * Get information about a databus artifact 
 */
 instance.getArtifact = async function (accountName, groupName, artifactName) {

  let artifactUri = UriUtils.createResourceUri([accountName, groupName, artifactName ]);
  return instance.getArtifactByUri(artifactUri);
}

/**
 * ASK whether an artifact exists
 * @param {*} accountName 
 * @param {*} groupName 
 * @param {*} artifactName 
 * @returns 
 */
instance.hasArtifact = async function(accountName, groupName, artifactName) {
  let artifactUri = UriUtils.createResourceUri([accountName, groupName, artifactName]);
  return await exec.executeAsk(`ASK { <${artifactUri}> a <${DatabusUris.DATAID_ARTIFACT}> }`);
}

/**
 * Get information about a databus artifact by artifact uri
 */
 instance.getArtifactByUri = async function (artifactUri) {

  if (artifactUri == null) {
    return null; // TODO throw error?
  }

  let queryOptions = { ARTIFACT_URI: artifactUri };

  // Query the basic artifact information and check whether the artifact exists
  let query = exec.formatQuery(require('../sparql/get-artifact.sparql'), queryOptions);
  let bindings = await exec.executeSelect(query);

  // Does not exist
  if(bindings.length == 0) {
    return null;
  }

  // Does exist, time to load additional data
  var artifact = bindings[0];

  // Collect latest version information for the artifact
  query = exec.formatQuery(require('../sparql/get-latest-version-by-artifact.sparql'), queryOptions);
  bindings = await exec.executeSelect(query);

  // No additional data, return the basic artifact info
  if(bindings.length == 0) {
    return artifact;
  }

  // Get the first (and only) binding
  var latestVersionInfo = bindings[0];

  // Copy latest version info to artifact info
  for(var key in latestVersionInfo) {
    artifact[key] = latestVersionInfo[key];
  }

  // Infer the group from the artifact uri and return artifact
  artifact.group = UriUtils.navigateUp(artifact.uri);
  return artifact;
}

/**
 * Retrieves all artifacts by account name
 * @param {*} accountName 
 */
 instance.getArtifactsByAccount = async function (accountName) {
  try {
    // Get a sanitized account uri
    let accountUri = UriUtils.createResourceUri([accountName]);
    
    if (accountUri == null) {
      return null; // TODO throw error?
    }

    // Create the query and insert the account uri
    let queryOptions = { ACCOUNT_URI: accountUri };
    let query = require('../sparql/get-artifacts-by-account.sparql');

    query = exec.formatQuery(query, queryOptions);
    // Execute the query to get a list of bindings
    let bindings = await exec.executeSelect(query);

    var result = [];

    for (let i in bindings) {
      let binding = bindings[i];
      var artifact = await instance.getArtifactByUri(binding.artifact);

      artifact.name = UriUtils.uriToName(artifact.uri);
      artifact.groupName = UriUtils.uriToName(artifact.group);
      result.push(artifact);
    }


    // return the result object
    return result;
  } catch (err) {
    // log an error if there is one and return null;
    console.log(err);
    return null;
  }
}

/**
 * Get some basic information on versions of an artifact with artifactUri
 */
instance.getVersionsByArtifact = async function (account, group, artifact) {
  // Load the query from file, replace placeholder with groupUri
  let queryOptions = { ARTIFACT_URI: UriUtils.createResourceUri([account, group, artifact]) };
  let query = exec.formatQuery(require('../sparql/get-versions-by-artifact.sparql'), queryOptions);

  let bindings = await exec.executeSelect(query);

  return bindings;
}

/**
 * Gets the list of artifacts in a group
 */
instance.getArtifactsByGroup = async function (account, group) {
  // Get a sanitized account uri
  let groupUri = UriUtils.createResourceUri([account, group]);
  if (groupUri == null) {
    return null; // TODO throw error?
  }

  // Create the query and insert the account uri
  let queryOptions = { GROUP_URI: groupUri };
  // Load the query from file, replace placeholder with groupUri
  let query = exec.formatQuery(require('../sparql/get-artifacts-by-group.sparql'), queryOptions);

  let bindings = await exec.executeSelect(query);
  
  // No bindings, return null
  if (bindings == null) {
    return null;
  }

  var result = [];

  for (let i in bindings) {
    let binding = bindings[i];
    var artifact = await instance.getArtifactByUri(binding.artifact);

    artifact.name = UriUtils.uriToName(artifact.uri);
    artifact.groupName = UriUtils.uriToName(artifact.group);
    result.push(artifact);
  }

  
  // Return the result!
  return result;
}


/**
 * Returns a promise finally yielding information about a version
 */
instance.getVersion = async function (account, group, artifact, version) {

  var versionUri = UriUtils.createResourceUri([account, group, artifact, version]);
  return await instance.getVersionByUri(versionUri);
}

instance.hasVersion = async function(accountName, groupName, artifactName, versionName) {
  let versionUri = UriUtils.createResourceUri([accountName, groupName, artifactName, versionName ]);
  return await exec.executeAsk(`ASK { <${versionUri}> a <${DatabusUris.DATAID_VERSION}> }`);
}

instance.getVersionByUri = async function (versionUri) {

  let queryOptions = { VERSION_URI: versionUri };
  let query = exec.formatQuery(require('../sparql/get-version.sparql'), queryOptions);

  // console.log(query);
  let bindings = await exec.executeSelect(query);

  if (bindings.length === 0) {
    return null;
  }

  // bindings[0].artifactName = UriUtils.uriToName(bindings[0].artifact);
  return bindings[0];
}

instance.getGroupsByAccount = async function (account) {

  let queryOptions = { ACCOUNT_URI: UriUtils.createResourceUri([account]) };
  let query = exec.formatQuery(require('../sparql/get-groups-by-account.sparql'), queryOptions);

  let bindings = await exec.executeSelect(query);
  let result = [];

  for (let b in bindings) {
    let group = bindings[b];

    //if(group.title == undefined) {
    //  group.title =  UriUtils.uriToName(group.uri);
    //}

    group.name = UriUtils.uriToName(group.uri);
    result.push(group);
  }

  return result;
}

instance.getGroupsAndArtifactsByAccount = async function (account) {

  let queryOptions = { PUBLISHER_URI: UriUtils.createResourceUri([account]) };
  let query = exec.formatQuery(require('../sparql/get-groups-and-artifacts-by-publisher.sparql'), queryOptions);

  let bindings = await exec.executeSelect(query);

  if (bindings.length === 0) {
    return null;
  }

  let result = {};

  result.artifacts = [];
  result.groups = {};
  let index = 0;

  for (let b in bindings) {
    let binding = bindings[b];

    binding.publisher = UriUtils.uriToName(binding.publisherUri);
    binding.artifact = UriUtils.uriToName(binding.artifactUri);
    binding.group = UriUtils.uriToName(binding.groupUri);

    result.artifacts.push(binding);

    if (result.groups[binding.group] === undefined) {
      result.groups[binding.group] = {};
      result.groups[binding.group].label = binding.group;
      result.groups[binding.group].uri = binding.groupUri;
      result.groups[binding.group].collapsed = true;
      result.groups[binding.group].indices = [];
    }

    result.groups[binding.group].indices.push(index);
    index++;
  }

  return result;
}

instance.getDownloadUrl = async function (account, group, artifact, version, file) {

  let queryOptions = { FILE_URI: UriUtils.createResourceUri([account, group, artifact, version, file]) };
  let query = exec.formatQuery(require('../sparql/get-download-url.sparql'), queryOptions);

  let bindings = await exec.executeSelect(query);

  if (bindings.length === 0) {
    return null;
  }

  return bindings[0];
}

module.exports = instance;
