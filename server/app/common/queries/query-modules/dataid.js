const baseUrl = process.env.DATABUS_RESOURCE_BASE_URL;
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

  if (artifactUri == null) {
    return null; // TODO throw error?
  }

  // Create the query and insert the account uri
  let queryOptions = { ARTIFACT_URI: artifactUri };
  let query = exec.formatQuery(require('../sparql/get-artifact.sparql'), queryOptions);
  let bindings = await exec.executeSelect(query);

  return bindings.length !== 0 ? bindings[0] : null;
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

    // Do some post-processing on the bindings to create a result object
    for (let b in bindings) {
      let binding = bindings[b];
      binding.name = UriUtils.uriToName(binding.uri);
      binding.groupName = UriUtils.uriToName(binding.group);
    }

    // return the result object
    return bindings;
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

  return bindings.length !== 0 ? bindings : null;
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

  // Do some post-processing on the bindings
  for (let i in bindings) {
    bindings[i].group = group;
    bindings[i].account = account;
    bindings[i].artifact = UriUtils.uriToName(bindings[i].artifactUri);
  }

  console.log(bindings);
  // Return the result!
  return bindings;
}


/**
 * Returns a promise finally yielding information about a version
 */
instance.getVersion = async function (account, group, artifact, version) {

  let queryOptions = { VERSION_URI: UriUtils.createResourceUri([account, group, artifact, version]) };
  let query = exec.formatQuery(require('../sparql/get-version-data.sparql'), queryOptions);

  // console.log(query);
  let bindings = await exec.executeSelect(query);

  if (bindings.length === 0) {
    return null;
  }

  bindings[0].artifact = UriUtils.uriToName(bindings[0].artifactUri);
  return bindings[0];
}

instance.getGroupsByAccount = async function (account) {

  let queryOptions = { PUBLISHER_URI: UriUtils.createResourceUri([account]) };
  let query = exec.formatQuery(require('../sparql/get-groups-by-account.sparql'), queryOptions);

  let bindings = await exec.executeSelect(query);
  let result = [];

  for (let b in bindings) {
    let group = bindings[b];

    if(group.title == undefined) {
      group.title =  UriUtils.uriToName(group.uri);
    }

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

  console.log(query);
  let bindings = await exec.executeSelect(query);

  if (bindings.length === 0) {
    return null;
  }

  return bindings[0];
}

module.exports = instance;
