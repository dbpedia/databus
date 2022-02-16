var http = require('http');
var { spawn } = require('child_process');
var remoteDatabaseManager = require('../common/remote-database-manager');
var indexingArgs = ['-jar', '../search/lookup-indexer.jar', '-conf', '../search/app-config-index.yml'];
var cors = require('cors');

module.exports = function (router, protector) {

  var rebuild = function () {
    rebuildAndRedeploy();
  }

  remoteDatabaseManager.addSaveListener(rebuild);

  var promisedRebuild = function () {
    return new Promise((resolve, reject) => {
      var indexingProcess = spawn('java', indexingArgs);
      //indexingProcess.stderr.on('data', (data) => {
      //  console.log('Index creation stderr: ' + data);
      //});
      indexingProcess.on('close', (code) => {
        if (code == 0) {
          resolve(code);
        } else {
          reject(code);
        }
      });
    });
  }

  var promisedRedeploy = function () {
    return new Promise((resolve, reject) => {
      var touchProcess = spawn('touch', ['/usr/local/tomcat/webapps/lookup-application.war']);
      touchProcess.on('close', (code) => {
        if (code == 0) {
          resolve(code);
        } else {
          reject(code);
        }
      });
    });
  }

  var rebuildAndRedeploy = async function () {

    try {
      var result = await promisedRebuild();
      console.log('Search Index creation finished with code ' + result);
    } catch (err) {
      console.log('Search Index creation failed: ' + err);
    }

    try {
      result = await promisedRedeploy();
      console.log('Search Servlet redeploy finished with code ' + result);
    } catch (err) {
      console.log('Search Servlet redeploy failed: ' + err);
    }
  }

  rebuildAndRedeploy();

  /*
  router.get('/system/search-force-rebuild', async function (req, res, next) {

    await rebuildAndRedeploy();
    res.status(200).send('Done');
  });
*/

  router.get('/api/search', cors(), function (req, res, next) {

    var query = req.query.query;
    var typeName = req.query.typeName;
    var minRelevance = req.query.minRelevance;
    var format = req.query.format;
    // var groupUri = req.query.groupUri;
    var part = req.query.part;
    var publisherUri = req.query.publisherUri;

    var queryString = '';
    var first = true;

    for(var param in req.query) {
      queryString += `${first ? '?' : '&'}${param}=${req.query[param]}`;
      first = false;
    }

    var search = `http://localhost:8080/lookup-application/api/search${queryString}`;

/*
    if (typeName != undefined) {
      search += "&typeName=" + typeName;
    }

    if (minRelevance != undefined) {
      search += "&minRelevance=" + minRelevance;
    }

    if (format != undefined) {
      search += "&format=" + format;
    }

    if (part != undefined) {
      search += "&part=" + part;
    }

    // if (groupUriWeight != undefined) {
    //  search += "&groupUriWeight=" + groupUriWeight;
    // }

    if (publisherUri != undefined) {
      search += "&publisherUri=" + publisherUri;
    }*/

    http.get(search, function (response) {
      response.setEncoding('utf8');

      var resBody = '';

      response.on('data', function (chunk) {
        resBody += chunk
      });

      response.on('end', function () {

        try {
          var resBodyJson = JSON.parse(resBody);
          resBodyJson.query = req.query.query;
          res.status(200).send(resBodyJson);
        } catch (err) {
          res.status(404).send('Search Unavailable.');
        }
      });
    }).on("error", function (err) {
      res.status(404).send('Search Unavailable.');
    });
  });

  return router;
}
