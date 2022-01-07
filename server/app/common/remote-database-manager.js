var rp = require('request-promise');

const Constants = require('./constants');

var db = {};

var databaseUri = process.env.DATABUS_DATABASE_URL || Constants.DEFAULT_DATABASE_URL;

db.saveListeners = [];

db.addSaveListener = function (callback) {
  db.saveListeners.push(callback);
}

db.read = async function (repo, path) {
  let options = {
    url: `${process.env.DATABUS_DATABASE_URL}/graph/read?repo=${repo}&path=${path}`,
    headers: {
      'Accept': 'application/ld+json'
    },
    json: true
  };

  var res = await rp.get(options);
  return res;
}

db.save = async function (repo, path, content) {

  try {
    var options = {
      uri: `${databaseUri}/graph/save?repo=${repo}&path=${path}`,
      body: content,
      json: true
    };

    var res = await rp.post(options);

    for (var c in db.saveListeners) {
      var callback = db.saveListeners[c];
      callback();
    }

    return { isSuccess: true };
  } catch (err) {
    console.log(err);
    return { isSuccess: false };
  }

}

db.delete = async function (repo, path) {

  try {

    var uri = `${databaseUri}/file/delete?repo=${repo}&path=${path}`;
    console.log(uri);

    var res = await rp.post(uri);

    for (var c in db.saveListeners) {
      var callback = db.saveListeners[c];
      callback();
    }

    console.log(res);
    return { isSuccess: true };
  } catch (err) {
    console.log(err);
    return { isSuccess: false };
  }

}


module.exports = db;