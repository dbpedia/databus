var sanitizeUrl = require('@braintree/sanitize-url').sanitizeUrl;
var rp = require('request-promise');
const cheerio = require('cheerio');
var sparql = require("../../common/queries/sparql");
const got = require('got');

const ServerUtils = require('../../common/utils/server-utils.js');

module.exports = function (router, protector) {

  require('../../common/file-analyzer').route(router, protector);


  router.get('/app/publish-wizard/licenses', protector.protect(), async function(req, res, next) {

    var search = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`).search;

    var options = {
      method : 'GET',
      headers : {
        accept: 'application/json'
      },
    };

    try {
      var daliccRes = await got(`https://api.dalicc.net/licenselibrary/list${search}`, options);
      var dalicc = JSON.parse(daliccRes.body);
      res.status(200).send(dalicc);

    } catch(err) {
      console.log(err);
      res.status(500).send("DALICC SERVICE APPEARS TO BE DOWN!");
    }
  });

  router.get('/app/publish-wizard',  protector.protect(), async function (req, res, next) {

    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var publishers = await sparql.accounts.getPublishersByAccount(auth.info.accountName);
      var texts = require('../publish-wizard-texts.json');

      res.render('publish-wizard', {
        title: 'Publish Data',
        data: { auth: auth, publisherData: publishers, texts: texts }
      });
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });


  router.get('/app/publish-wizard/fetch-resource-page', async function (req, res, next) {

    try {
      var result = await fetchLinksRecursive(req.query.url, '', 0);
      res.status(200).send(result);

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.get('/app/publish-wizard/fetch-file', async function (req, res, next) {

    try {

      var url = req.query.url;
      var result = await fetchFile(url);
      res.status(200).send(result);

    } catch (err) {
      console.log(err);

      res.status(500).send(err);
    }
  });

  async function fetchFile(url) {

    if (url.includes('://localhost')) {
      return null;
    }

    if (url.startsWith('https://databus.dbpedia.org')) {
      return null;
    }

    // Check if definitely no file
    if (url.startsWith('http')
      && url.lastIndexOf('/') < url.lastIndexOf('.')
      && url.lastIndexOf('/') < url.indexOf('.')) {
      return null;
    }

    if (url.startsWith("https://github.com/")) {
      url = transformGithubUrl(url);
    }


    // File should be reachable, do a head request!
    var options = {};
    options.uri = url;
    options.method = 'HEAD';

    var header = await rp(options);

    var result = {
      url: url
    };

    // Prefer content disposition
    if (header['content-disposition'] != undefined) {

      // console.log(header['content-disposition']);

      var filename = getFileNameFromDisposition(header['content-disposition']);

      // console.log(filename);
      parseFormatAndCompression(result, filename);

      return result;
    }

    // Try to parse from url
    if (url.lastIndexOf('/') < url.lastIndexOf('.')) {
      parseFormatAndCompression(result, url);

      return result;
    }

    return null;
  }

  function getFileNameFromDisposition(disposition) {

    // console.log(disposition);
    var entries = disposition.split(' ');

    for(var entry of entries) {
      if(entry.startsWith('filename=')) {
        return entry.split('=')[1].replace(/(^")|("$)|(;$)|(";$)/g, "");        
      }
    }

    return undefined;
  }

  
  function transformGithubUrl(url) {

    url = url.replace("/blob/", "/");
    url = url.replace("https://github.com/", "https://raw.githubusercontent.com/")

    return url;
  }

  function parseFormatAndCompression(result, value) {

    if(value == undefined) {
      return;
    }

    console.log(value);

    var nameComponents = value.split('/');

    nameComponents = nameComponents[nameComponents.length - 1].split('.');

    if (nameComponents[nameComponents.length - 1].includes('#')) {
      nameComponents[nameComponents.length - 1] = nameComponents[nameComponents.length - 1].split('#')[0]
    }

    if (nameComponents.length > 2) {
      result.compression = nameComponents[nameComponents.length - 1];
      result.formatExtension = nameComponents[nameComponents.length - 2];
    } else if (nameComponents.length > 1) {
      result.compression = 'none';
      result.formatExtension = nameComponents[nameComponents.length - 1];
    } else {
      result.compression = 'none';
      result.formatExtension = 'none';
    }



  }

  async function fetchLinksRecursive(baseUrl, path, depth) {

    var result = [];

    try {

      // Check if the url is a file:
      var url = baseUrl + path;

      // Get the HTML and pick up HREFs
      var options = {}
      options.uri = url;
      options.method = 'GET';
      options.headers = {
        Accept: 'text/html'
      };
      options.transform = function (body) { return cheerio.load(body); };
      var $ = await rp(options);

      var hrefs = getFilteredHrefs(baseUrl + path, $);

      for (var h in hrefs) {

        var href = hrefs[h];
        result.push(href);
      }

    } catch (err) {
      console.log(err);
    }

    return result;
  }

  function getFilteredHrefs(baseUrl, $) {

    var result = [];
    links = $('a');


    $(links).each(function (i, link) {

      var link = $(link).attr('href');
      var href = new URL(link, baseUrl).href;

      result.push(href);
    });

    return result;
  }
}
