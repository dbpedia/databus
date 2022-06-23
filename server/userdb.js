var fs = require('fs');
const DatabusUtils = require('../public/js/utils/databus-utils');

class DatabusUserDatabase {

  constructor(path, onChange) {
    this.path = path;
    this.onChange = onChange;
    this.userTable = {};

    this.loadFromFile();
  }

  requestRefresh() {
    this.onChange(this.userTable);
  }

  // Write action called from worker messages
  updateUser(data) {

    this.userTable[data.sub] = data;
    this.saveToFile();

    // Call on-change to broadcast to workers in www script
    this.onChange(this.userTable);
  }

  // Serialize to CSV
  saveToFile() {
    var csvString = "";
    for (var u in this.userTable) {
      var user = this.userTable[u];

      if(user.keys == undefined) {
        user.keys = [];
      }


      let buff = new Buffer.from(JSON.stringify(user.keys));
      let keyString = buff.toString('base64');

      if (user.username != undefined) {
        csvString += `${user.name},${user.sub},${user.username},${keyString}\n`;
      }
    }

    fs.writeFileSync(this.path, csvString, "utf8");
  }

  // Deserialize from CSV
  loadFromFile() {

    if (!fs.existsSync(this.path)) {

      var folderPath = DatabusUtils.navigateUp(this.path);

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }

      console.log(`Creating user file at ${this.path}.`);
      fs.writeFileSync(this.path, "", "utf8");
    }

    console.log(`Parsing user table from ${this.path}`);
    this.createUserHashtable(fs.readFileSync(this.path, "utf8"));
  }

  // Create the Hashtable from CSV
  createUserHashtable(csv) {

    var lines = csv.split("\n");
    this.userTable = {};

    for (var i = 0; i < lines.length; i++) {

      try {

        if (lines[i].length == 0) {
          continue;
        }

        var currentline = lines[i].split(",");

        let buff = new Buffer.from(currentline[3], 'base64');
        let keysString = buff.toString('ascii');


        var obj = {
          name: currentline[0],
          sub: currentline[1],
          username: currentline[2],
          keys: JSON.parse(keysString)
        };

        this.userTable[obj.sub] = obj;

      } catch (err) {
        console.log(`Unable to parse user:\n${err}`);
      }
    }
  }
}

module.exports = DatabusUserDatabase;