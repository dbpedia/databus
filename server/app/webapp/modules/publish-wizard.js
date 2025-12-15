const axios = require('axios');
const cheerio = require('cheerio');
const ServerUtils = require('../../common/utils/server-utils.js');

module.exports = function (router, protector) {
  require('../../common/file-analyzer').route(router, protector);

  router.get('/app/publish-wizard/licenses', protector.protect(), async function (req, res, next) {
    const search = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`).search;

    const url = `https://api.dalicc.net/licenselibrary/list${search}`;
    const agent = ServerUtils.getProxyAgent(url);

    try {

      const daliccRes = await axios.request({
        method: 'GET',
        url,
        headers: { accept: 'application/json' },
        httpAgent: agent,
        httpsAgent: agent,
        proxy: false
      });

      res.status(200).send(daliccRes.data);
    } catch (err) {
      console.log(err);
      res.status(500).send("DALICC SERVICE APPEARS TO BE DOWN!");
    }
  });

  router.get('/app/publish-wizard', protector.protect(), async function (req, res, next) {
    try {
      const auth = ServerUtils.getAuthInfoFromRequest(req);
      const texts = require('../publish-wizard-texts.json');

      res.render('publish-wizard', {
        title: 'Publish Data',
        data: { auth: auth, texts: texts }
      });
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.get('/app/publish-wizard/fetch-resource-page', async function (req, res, next) {
    try {
      const result = await fetchLinksRecursive(req.query.url, '', 0);
      res.status(200).send(result);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.get('/app/publish-wizard/fetch-file', async function (req, res, next) {
    try {
      const url = req.query.url;
      const result = await fetchFile(url);
      res.status(200).send(result);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  async function fetchFile(url) {
    if (url.includes('://localhost') || url.startsWith('https://databus.dbpedia.org')) {
      return null;
    }

    if (url.startsWith('http')
      && url.lastIndexOf('/') < url.lastIndexOf('.')
      && url.lastIndexOf('/') < url.indexOf('.')) {
      return null;
    }

    if (url.startsWith("https://github.com/")) {
      url = transformGithubUrl(url);
    }

    try {
      const response = await axios.head(url);
      const headers = response.headers;

      const result = { url: url };

      if (headers['content-disposition']) {
        const filename = getFileNameFromDisposition(headers['content-disposition']);
        parseFormatAndCompression(result, filename);
        return result;
      }

      if (url.lastIndexOf('/') < url.lastIndexOf('.')) {
        parseFormatAndCompression(result, url);
        return result;
      }

      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  function getFileNameFromDisposition(disposition) {
    const entries = disposition.split(' ');
    for (let entry of entries) {
      if (entry.startsWith('filename=')) {
        return entry.split('=')[1].replace(/(^")|("$)|(;$)|(";$)/g, "");
      }
    }
    return undefined;
  }

  function transformGithubUrl(url) {
    url = url.replace("/blob/", "/");
    url = url.replace("https://github.com/", "https://raw.githubusercontent.com/");
    return url;
  }

  function parseFormatAndCompression(result, value) {
    if (!value) return;

    let nameComponents = value.split('/');
    nameComponents = nameComponents[nameComponents.length - 1].split('.');

    if (nameComponents[nameComponents.length - 1].includes('#')) {
      nameComponents[nameComponents.length - 1] = nameComponents[nameComponents.length - 1].split('#')[0];
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
    const result = [];
    try {
      const url = baseUrl + path;
      const response = await axios.get(url, {
        headers: { Accept: 'text/html' }
      });
      const $ = cheerio.load(response.data);
      const hrefs = getFilteredHrefs(baseUrl + path, $);
      for (const href of hrefs) {
        result.push(href);
      }
    } catch (err) {
      console.log(err);
    }
    return result;
  }

  function getFilteredHrefs(baseUrl, $) {
    const result = [];
    const links = $('a');
    $(links).each(function (i, link) {
      const href = new URL($(link).attr('href'), baseUrl).href;
      result.push(href);
    });
    return result;
  }
}
