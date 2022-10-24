var { spawn } = require('child_process');
var fs = require('fs');

class LookupSearchIndexer {

  constructor(rebuildMinIntervalMilliseconds) {
    // this.rebuildAndRedeploy();
    this.iid = setInterval(this.tick.bind(this), rebuildMinIntervalMilliseconds);
    this.rebuildRequested = true;   
    this.configPath = `../search/app-config-index.yml`;

    var content = fs.readFileSync(this.configPath, ['utf8']).toString();
    var regex = new RegExp(`sparqlEndpoint:\\s(.*)`, `g`);
    content = content.replace(regex, `sparqlEndpoint: ${process.env.DATABUS_DATABASE_URL}/sparql`);
    fs.writeFileSync(this.configPath, content, ['utf8']);
  }

  
  tick() {
    if(this.rebuildRequested) {
      this.rebuildAndRedeploy();   
      this.rebuildRequested = false;   
    }
  }

  requestRebuild() {
    console.log(`Search index rebuild requested.`);
    this.rebuildRequested = true;
  }

  promisedRebuild() {
    return new Promise((resolve, reject) => {
      var indexingProcess = spawn('java', [ 
        '-jar', '../search/lookup-indexer.jar', 
        '-conf', this.configPath
      ]);

      //indexingProcess.stdout.on('data', (data) => {
      //  console.log('Index creation out: ' + data);
      //});
      indexingProcess.stderr.on('data', (data) => {
        console.log('Index creation stderr: ' + data);
      });
      indexingProcess.on('close', (code) => {
        if (code == 0) {
          resolve(code);
        } else {
          reject(code);
        }
      });
    });
  }

  promisedRedeploy() {
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

  async rebuildAndRedeploy() {

    try {
      var result = await this.promisedRebuild();
      console.log('Search Index creation finished with code ' + result);
    } catch (err) {
      console.log('Search Index creation failed: ' + err);
    }

    try {
      result = await this.promisedRedeploy();
      console.log('Search Servlet redeploy finished with code ' + result);
    } catch (err) {
      console.log('Search Servlet redeploy failed: ' + err);
    }
  }

}

module.exports = LookupSearchIndexer;
