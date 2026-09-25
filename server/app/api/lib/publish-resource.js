const jsonld = require('jsonld');
const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const DatabusLogger = require('../../common/databus-logger');
const ApiError = require('../../common/utils/api-error');
const defaultContext = require('../../common/res/context.jsonld');

/**
 * Shared handler for RESTful PUT publish routes.
 * @param {object} req
 * @param {object} res
 * @param {class} WriterClass ResourceWriter subclass
 * @param {string} uri resource URI matching a graph @id in the body
 * @param {object} writerOptions optional WriterClass constructor args (e.g. fetchFileProperties)
 */
async function publishResource(req, res, WriterClass, uri, writerOptions = {}) {

  const logger = new DatabusLogger(req.query['log-level']);
  const userData = {
    sub: req.databus.sub,
    accounts: req.databus.accounts
  };

  try {
    var graph = req.body;

    if (graph[DatabusUris.JSONLD_CONTEXT] == process.env.DATABUS_DEFAULT_CONTEXT_URL) {
      graph[DatabusUris.JSONLD_CONTEXT] = defaultContext;
      logger.debug(null, `Context "${process.env.DATABUS_DEFAULT_CONTEXT_URL}" replaced with cached resolved context`, defaultContext);
    }

    const expandedGraphs = await jsonld.flatten(graph);

    if (!JsonldUtils.getGraphById(expandedGraphs, uri)) {
      logger.error(null, `No graph ${uri} found in the input.`, null);
      res.status(400).json(logger.getReport());
      return;
    }

    logger.debug(null, `Found graph ${uri} in input`, JsonldUtils.getGraphById(expandedGraphs, uri));

    const writer = writerOptions.fetchFileProperties !== undefined
      ? new WriterClass(logger, writerOptions.fetchFileProperties)
      : new WriterClass(logger);

    await writer.writeResource(req, userData, expandedGraphs, uri);
    res.status(200).json(logger.getReport());

  } catch (err) {
    if (err.name === 'ApiError') {
      logger.error(err.resource, err.message, err.body);
      res.status(err.statusCode).json(logger.getReport());
      return;
    }
    throw err;
  }
}

module.exports = publishResource;
