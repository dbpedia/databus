const axios = require('axios');
const DatabusMessage = require('../databus-message');
const Constants = require('../constants');

// Constants for URLs and headers
const prefix = encodeURIComponent(`${process.env.DATABUS_RESOURCE_BASE_URL}/`);

// Helper functions for URL building
const buildReadUrl = (repo, path) => `${process.env.DATABUS_DATABASE_URL}/document/read?repo=${repo}&path=${path}`;
const buildSaveUrl = (repo, path) => `${process.env.DATABUS_DATABASE_URL}/document/save?repo=${repo}&prefix=${prefix}&path=${path}`;
const buildDeleteUrl = (repo, path) => `${process.env.DATABUS_DATABASE_URL}/graph/delete?repo=${repo}&prefix=${prefix}&path=${path}`;

class GstoreHelper {

  static async read(repo, path) {
    const url = buildReadUrl(repo, path);

    try {
      const response = await axios.get(url, {
        headers: {
          'Accept': Constants.HTTP_CONTENT_TYPE_JSONLD
        }
      });
      return response.data;
    } catch (err) {
      return null;
    }
  }

  static async save(repo, path, content) {
    const url = buildSaveUrl(repo, path);

    try {
      await axios.post(url, content, {
        headers: {
          'Content-Type': Constants.HTTP_CONTENT_TYPE_JSON
        }
      });
      return { isSuccess: true };
    } catch (err) {
      console.log(err);
      return { isSuccess: false, message: err.message, statusCode: err.response?.status };
    }
  }

  static async delete(repo, path) {
    const url = buildDeleteUrl(repo, path);

    try {
      await axios.delete(url);
      process.send({
        id: DatabusMessage.REQUEST_SEARCH_INDEX_REBUILD
      });
      return { isSuccess: true };
    } catch (err) {
      console.log(err);
      return { isSuccess: false };
    }
  }

}

module.exports = GstoreHelper;
