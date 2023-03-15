const shasum = require('js-sha256');
const axios = require('axios');
const UriUtils = require('./utils/uri-utils');

var analyzer = {};

analyzer.processFile = async function(fileUri, url, webdav) {

  var path = fileUri.replace(`${process.env.DATABUS_RESOURCE_BASE_URL}/`, "");
  var artifactPath = UriUtils.navigateUp(path);
  var groupPath = UriUtils.navigateUp(artifactPath);
  var accountName = UriUtils.navigateUp(groupPath);
  
  console.log(accountName);

  var options = {};

  options.headers = {
    'Authorization' : webdav.getBasicAuthToken(accountName),
  }
  
  options.method = "MKCOL";
  options.url = `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${groupPath}`;

  try {
    await axios.request(options);
  } catch(err) {
    if(err.response.status != 405) {
      throw(err);
    }
  }

  options.url = `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${artifactPath}`;

  try {
    await axios.request(options);
  } catch(err) {
    if(err.response.status != 405) {
      throw(err);
    }
  }

}

analyzer.parseFormatAndCompression = function(result, value) {

  result.compression = "none";
  result.formatExtension = "none";
  if(value == undefined) {
    return;
  }

  var nameComponents = value.split('/');

  nameComponents = nameComponents[nameComponents.length - 1].split('.');

  if (nameComponents[nameComponents.length - 1].includes('#')) {
    nameComponents[nameComponents.length - 1] = nameComponents[nameComponents.length - 1].split('#')[0]
  }

  if (nameComponents.length > 2) {
    result.compression = nameComponents[nameComponents.length - 1];
    result.formatExtension = nameComponents[nameComponents.length - 2];
  } else if (nameComponents.length > 1) {
    result.formatExtension = nameComponents[nameComponents.length - 1];
  }
}

analyzer.getFileNameFromDisposition = function(disposition) {

  console.log(disposition);
  var entries = disposition.split(' ');

  for(var entry of entries) {
    if(entry.startsWith('filename=')) {
      return entry.split('=')[1].replace(/(^")|("$)|(;$)|(";$)/g, "");        
    }
  }

  return undefined;
}

analyzer.getFormatAndCompression = function(url, headers) {

  var result = {};

   // Prefer content disposition
   if (headers['content-disposition'] != undefined) {
    var filename = analyzer.getFileNameFromDisposition(headers['content-disposition']);
    analyzer.parseFormatAndCompression(result, filename);

    return result;
  }

  // Try to parse from url
  if (url.lastIndexOf('/') < url.lastIndexOf('.')) {
    analyzer.parseFormatAndCompression(result, url);
    return result;
  }

  return result;
}

analyzer.analyzeFile = async function (url) {

  try {

    var hash = shasum.create();

    var response = await axios.request({
      method: "GET",
      url: url,
      responseType: "stream",
    });

    var bytesRead = 0;
    
    var formatAndCompressionResult = analyzer.getFormatAndCompression(url, response.headers);

    for await (data of response.data) {

      bytesRead += data.length;
      hash = hash.update(data);

      // TODO? Stream to webDAV
      // notify('' + bytesRead + '/' + contentLength + '$');
    }

    return {
      code: 200,
      data: {
        byteSize: bytesRead,
        shasum: hash.hex(),
        formatExtension: formatAndCompressionResult.formatExtension,
        compression: formatAndCompressionResult.compression
      }
    }

  } catch (err) {

    console.log(err);

    return {
      code: 500,
      data: err
    };
  }
}

/**
 * TODO: Consider not exposing this
 * @param {} router 
 * @param {*} protector 
 */
analyzer.route = function (router, protector) {

  router.get('/app/publish-wizard/analyze-file', protector.protect(), async function (req, res) {

    var result = await analyzer.analyzeFile(req.query.url, function (msg) {
      res.write(msg);
    });

    if (result.code == 200) {
      res.write(JSON.stringify(result.data));
      res.end();
      return;
    }

    res.status(500).send(result.data);
  });
}


module.exports = analyzer;

