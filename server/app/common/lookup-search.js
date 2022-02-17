var { spawn } = require('child_process');
var indexingArgs = ['-jar', '../search/lookup-indexer.jar', '-conf', '../search/app-config-index.yml'];

var lookup = {};

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

lookup.rebuildAndRedeploy = async function () {

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

lookup.init = function() {
  var remoteDatabaseManager = require('../common/remote-database-manager');
  remoteDatabaseManager.addSaveListener(lookup.rebuildAndRedeploy);

  lookup.rebuildAndRedeploy();
}

module.exports = lookup;
