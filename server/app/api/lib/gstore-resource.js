const axios = require('axios');
const { URL, URLSearchParams } = require('url');
const Constants = require('../../common/constants');

class GstoreResource {
  static DOCUMENT_READ_ENDPOINT = '/document/read';
  static DOCUMENT_WRITE_ENDPOINT = '/document/save';
  static DOCUMENT_DELETE_ENDPOINT = '/document/delete';
  static REQ_PARAM_REPO = 'repo';
  static REQ_PARAM_PATH = 'path';
  static REQ_PARAM_PREFIX = "prefix";
  static METADATA_FILENAME = '/metadata.jsonld';
  static GSTORE_BASE_URL = process.env.DATABUS_DATABASE_URL || 'http://localhost:8080';
  static PREFIX = `${process.env.DATABUS_RESOURCE_BASE_URL}/`;

  constructor(uriString, content = null) {
    this.initialize(uriString);
    this.content = content;
  }

  initialize(uriString) {
    const uri = new URL(uriString);
    let relativePath = uri.pathname.replace(/^\/+|\/+$/g, '');
    if (!relativePath) throw new Error('URI path is empty.');

    const parts = relativePath.split('/');
    if (parts.length === 0) throw new Error('URI path does not contain any segments.');

    this.repo = parts.shift();
    if (!this.repo) throw new Error('Repo is null or empty.');

    this.path = parts.join('/') + GstoreResource.METADATA_FILENAME;
  }

  getRequestURL(operation) {
    let endpoint;
    switch (operation) {
      case 'Write': endpoint = GstoreResource.DOCUMENT_WRITE_ENDPOINT; break;
      case 'Read': endpoint = GstoreResource.DOCUMENT_READ_ENDPOINT; break;
      case 'Delete': endpoint = GstoreResource.DOCUMENT_DELETE_ENDPOINT; break;
      default: throw new Error('Invalid operation');
    }

    const url = new URL(GstoreResource.GSTORE_BASE_URL + endpoint);
    url.search = new URLSearchParams({
      [GstoreResource.REQ_PARAM_REPO]: this.repo,
      [GstoreResource.REQ_PARAM_PATH]: this.path,
      [GstoreResource.REQ_PARAM_PREFIX]: GstoreResource.PREFIX,
    }).toString();

    return url.toString();
  }

  async save() {
    if (!this.content) {
      throw new Error('No content provided for saving.');
    }

    try {
      var url = this.getRequestURL('Write');

      // console.log(JSON.stringify(this.content, null, 3));
      
      const response = await axios.post(url, this.content, {
        headers: { 'Content-Type': Constants.HTTP_CONTENT_TYPE_JSONLD }
      });
      return response.status;
    } catch (error) {
      var responseData = error.response.data;
      console.error('Error saving document:', responseData);
      throw error;
    }
  }

  async read() {
    try {
      const response = await axios.get(this.getRequestURL('Read'), { headers: { 'Accept': 'application/ld+json' } });
      this.content = response.data;
      return response.data;
    } catch (error) {
      console.error('Error reading document:', error);
      return null;
    }
  }

  async exists() {
    try {
      const response = await axios.head(this.getRequestURL('Read'));
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error('Error checking resource existence:', error);
      return false;
    }
  }

  async delete() {
    try {
      const response = await axios.delete(this.getRequestURL('Delete'));
      return response.status;
    } catch (error) {
      console.error('Error deleting resource:', error);
      return null;
    }
  }
}

module.exports = GstoreResource;
