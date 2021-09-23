const shasum = require('js-sha256');
const axios = require('axios');

module.exports = function (router, protector) {

  router.get('/system/publish/file', protector.protect(), async function (req, res) {

    try {
      var url = req.query.url;
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
        res.write('' + bytesRead + '/' + contentLength + '$');
      }

      res.write(hash.hex());
      res.end();

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });
}