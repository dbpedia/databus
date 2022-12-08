var baseUrl = process.env.DATABUS_RESOURCE_BASE_URL;

const exec = require('../../execute-query');
const UriUtils = require('../../utils/uri-utils');
const DatabusUtils = require('../../../../../public/js/utils/databus-utils');

let instance = {};

instance.getPublishRankingData = async function () {
  let query = require('../sparql/get-publish-ranking-data.sparql');
  let bindings = await exec.executeSelect(query);

  let result = [];

  for (let b in bindings) {
    let binding = bindings[b];

    result.push({
      account: UriUtils.uriToName(binding.accountUri),
      accountUri: binding.accountUri,
      numUploads: binding.numUploads,
      uploadSize: DatabusUtils.formatFileSize(binding.uploadSize)
    });
  }

  return result;
};

instance.getRecentUploadsData = async function () {
  let query = require('../sparql/get-recent-uploads.sparql');
  let bindings = await exec.executeSelect(query);

  let result = [];

  for (let i in bindings) {
    let binding = bindings[i];
    binding.artifact = UriUtils.uriToName(binding.artifactUri);
    binding.group = UriUtils.uriToName(binding.groupUri);
    result.push(binding);
  }

  return result;
};

// CHART DATA //
instance.getGlobalActivityChartData = async function () {
  let query = require('../sparql/get-global-activity-chart-data.sparql');
  let bindings = await exec.executeSelect(query);

  return createActivityChartData(bindings);
}


instance.getAccountActivityChartData = async function (account) {
  let accountUri = UriUtils.createResourceUri([account]);
  if (accountUri == null) {
    return null;
  }

  let query = require('../sparql/get-account-activity-chart-data.sparql');
  let queryOptions = { ACCOUNT_URI: accountUri };
  query = exec.formatQuery(query, queryOptions);
  let bindings = await exec.executeSelect(query);

  return createActivityChartData(bindings);
}

function createActivityChartData(bindings) {

  // Post-process the query result
  let map = {};
  let result = [];
  let totalSize = 0;

  // Calculate the total upload size and create a map for date-value lookup
  for (let b in bindings) {
    let binding = bindings[b];
    let fileSize = parseInt(binding.filesize, 10);
    map[binding.ym] = fileSize;
    totalSize += fileSize;
  }

  // Create the current date (first of the month)
  let date = new Date();
  date.setDate(1);

  // Go back 12 month, substracting the monthly uploaded amount from the
  // total uploaded amount
  for (let i = 0; i < 12; i++) {

    // Create datestring for entry and map lookup (YYYY-MM)
    let dateString = date.toISOString().substring(0, 7);

    // Create the entry with datestring and scaled value (GB)
    result.push({
      date: dateString,
      value: totalSize / (1024 * 1024 * 1024)
    });

    // Update the total uploaded amount
    totalSize -= map[dateString] !== undefined ? map[dateString] : 0;

    // Go back 1 month
    date.setMonth(date.getMonth() - 1);
  }

  return result;
}
// CHART DATA //

// VERSION DATA //
instance.getVersionActions = async function (account, group, artifact, version) {

  try {
    let query = require('../sparql/get-version-actions.sparql');
    let queryOptions = { VERSION_URI: UriUtils.createResourceUri([account, group, artifact, version]) };
    query = exec.formatQuery(query, queryOptions);
    let bindings = await exec.executeSelect(query);

    return bindings.length !== 0 ? bindings : null;
  } catch(err) {

    console.log(err);
    return null;
  }
}

instance.getVersionDropdownData = async function (account, group, artifact, version) {

  let query = require('../sparql/version-dropdown-data.sparql');
  let queryOptions = { VERSION_URI: UriUtils.createResourceUri([account, group, artifact, version]) };
  query = exec.formatQuery(query, queryOptions);
  let bindings = await exec.executeSelect(query);

  if (bindings.length === 0) {
    return null;
  }

  let result = {};
  result.variants = [];
  result.formats = [];
  result.compressions = [];

  for (let b in bindings) {
    let binding = bindings[b];
    result.variants.push(binding.variant);
    result.formats.push(binding.format);
    result.compressions.push(binding.compression);
  }

  result.variants = DatabusUtils.uniqueList(result.variants);
  result.formats = DatabusUtils.uniqueList(result.formats);
  result.compressions = DatabusUtils.uniqueList(result.compressions);

  return result;
}

instance.getModsByVersion = async function (account, group, artifact, version) {

  try {
    let query = require('../sparql/get-mods-by-version.sparql');
    let queryOptions = { VERSION_URI: UriUtils.createResourceUri([account, group, artifact, version]) };
    query = exec.formatQuery(query, queryOptions);
    let bindings = await exec.executeSelect(query);

    return bindings.length !== 0 ? bindings : null;
  }catch(err){
    console.log(err);
    return null;
  }
}
// VERSION DATA //

// FACETS //
instance.getGroupFacets = async function (resourceUri) {

  let query = require('../sparql/get-group-facets.sparql');
  let queryOptions = { GROUP_URI: UriUtils.sanitizeResourceUri(resourceUri) };
  query = exec.formatQuery(query, queryOptions);
  let bindings = await exec.executeSelect(query);

  if (bindings.length === 0) {
    return null;
  }

  return formatFacets(bindings, require('../../../pages/facet-metadata.json'));
}

instance.getArtifactFacets = async function (resourceUri) {

  let query = require('../sparql/get-artifact-facets.sparql');
  let queryOptions = { ARTIFACT_URI: UriUtils.sanitizeResourceUri(resourceUri) };
  query = exec.formatQuery(query, queryOptions);

  let bindings = await exec.executeSelect(query);

  if (bindings.length === 0) {
    return null;
  }

  return formatFacets(bindings, require('../../../pages/facet-metadata.json'));
}

instance.getVersionFacets = async function (resourceUri) {

  let query = require('../sparql/get-version-facets.sparql');
  let queryOptions = { VERSION_URI: UriUtils.sanitizeResourceUri(resourceUri) };
  query = exec.formatQuery(query, queryOptions);
  let bindings = await exec.executeSelect(query);

  if (bindings.length === 0) {
    return null;
  }

  return formatFacets(bindings, require('../../../pages/facet-metadata.json'));
}

function formatFacets(facetData, facetMetadata) {

  let facets = {};

  for (let r in facetData) {
    let result = facetData[r];

    if (facets[result.property] === undefined) {

      let label = facetMetadata[result.property];

      if (label === undefined) {
        label = UriUtils.uriToName(result.property);
        label = label[0].toUpperCase() + label.slice(1);
      }

      facets[result.property] = {};
      facets[result.property].values = [];
      facets[result.property].label = label;
    }

    facets[result.property].values.push(result.value);
  }

  return facets;
}
// FACETS //

// SERVICES //
// TODO
instance.getServicesByPublisher = function (publisherUri) {
  var query = require('./queries/get-services-by-publisher.sparql');
  var queryUrl = formatQueryUrl(query, '%PUBLISHER_URI%', publisherUri);

  return promiseQueryResult(queryUrl, function (response) {
    for (var b in response.results) {
      response.results[b].id = uriToName(response.results[b].uri);
      response.results[b].publisher = uriToName(response.results[b].publisherUri);
    }

    return response.results;
  });
}

// TODO
instance.getAppsByPublisher = function (publisherUri) {
  var query = require('./queries/get-apps-by-publisher.sparql');
  var queryUrl = formatQueryUrl(query, '%PUBLISHER_URI%', publisherUri);

  return promiseQueryResult(queryUrl, function (response) {
    for (var b in response.results) {
      response.results[b].id = uriToName(response.results[b].uri);
      response.results[b].publisher = uriToName(response.results[b].publisherUri);
    }

    return response.results;
  });
}

// TODO
instance.getServicesByGroup = function (groupUri) {
  var query = require('./queries/services-by-target-group.sparql');
  var queryUrl = formatQueryUrl(query, '%GROUP_URI%', groupUri);

  var services = {};
  services.shared = [];
  services.dedicated = [];

  return promiseQueryResult(queryUrl, function (response) {

    for (var b in response.results) {
      var result = response.results[b];
      result.id = uriToName(result.uri);
      result.publisher = uriToName(result.publisherUri);

      if (result.type == "https://databus.dbpedia.org/system/voc/DedicatedService") {
        services.dedicated.push(result);
      } else if (result.type == "https://databus.dbpedia.org/system/voc/SharedService") {
        services.shared.push(result);
      }
    }

    return services;
  });
}
// SERVICES //

module.exports = instance;
