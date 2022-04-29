const shasum = require('js-sha256');
const axios = require('axios');

var analyzer = {};

analyzer.analyzeFile = async function (url, notify) {

  try {
    var hash = shasum.create();

    var response = await axios.request({
      method: "GET",
      url: url,
      responseType: "stream",
    });

    var bytesRead = 0;
    var contentLength = response.headers['content-length'];

    for await (data of response.data) {

      bytesRead += data.length;
      hash = hash.update(data);

      notify('' + bytesRead + '/' + contentLength + '$');
    }

    return {
      code: 200,
      data: {
        byteSize: bytesRead,
        shasum: hash.hex()
      }
    }

  } catch (err) {

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

