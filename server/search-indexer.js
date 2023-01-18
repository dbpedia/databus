const { DateTime } = require('asn1js');
var { spawn } = require('child_process');
var fs = require('fs');

class LookupSearchIndexer {

  constructor(tickRate) {
    this.tickRate = tickRate;
    this.rebuildRequested = true;
    this.configPath = `../search/index-config.yml`;

    var content = fs.readFileSync(this.configPath, ['utf8']).toString();
    var regex = new RegExp(`sparqlEndpoint:\\s(.*)`, `g`);
    content = content.replace(regex, `sparqlEndpoint: ${process.env.DATABUS_DATABASE_URL}/sparql`);
    fs.writeFileSync(this.configPath, content, ['utf8']);
  }

  async start() {

    await this.buildIndex();

    this.iid = setInterval(this.tick.bind(this), this.tickRate);
    var self = this;

    this.servletProcess = spawn('java', [
      '-jar', '../search/lookup-server.jar',
      '-c', `../search/servlet-config.yml`
    ]);

    this.servletProcess.stdout.on('data', (data) => {
      self.log(`[SERVER] - ${data}`);
    });

    this.servletProcess.stderr.on('data', (data) => {
      self.log(`[SERVER ERROR] - ${data}`);
    });
  }


  tick() {
    if (this.rebuildRequested) {

      if (!this.isBuilding) {
        this.buildIndex();
      }
    }
  }

  log(msg) {
    console.log('\x1b[90m%s\x1b[0m', `[SEARCH] ${msg}`);
  }

  requestRebuild() {
    this.rebuildRequested = true;
  }

  async buildIndex() {
    this.rebuildRequested = false;
    this.isBuilding = true;
    await this.buildIndexPromise();
    this.isBuilding = false;
  }

  buildIndexPromise() {

    return new Promise((resolve, reject) => {
      var indexingProcess = spawn('java', [
        '-jar', '../search/lookup-indexer.jar',
        '-conf', this.configPath
      ]);

      indexingProcess.stdout.on('data', (data) => {
        // self.log(`[INDEXER] - ${data}`);
      });

      indexingProcess.stderr.on('data', (data) => {
        self.log(`[INDEXER ERROR] - ${data}`);
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
    var self = this;
    return new Promise((resolve, reject) => {
      var touchProcess = spawn('touch', ['/usr/local/tomcat/webapps/lookup-application.war']);
      touchProcess.on('close', (code) => {

        self.lastRebuildTime = new Date();
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
      this.log('Search Index creation finished with code ' + result);
    } catch (err) {
      this.log('Search Index creation failed: ' + err);
    }
  }

}

module.exports = LookupSearchIndexer;
