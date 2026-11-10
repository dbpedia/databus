const client = require('prom-client');
const express = require('express');
const Constants = require('../../common/constants.js');
const GstoreHelper = require('../../common/utils/gstore-helper.js');
const UriUtils = require('../../common/utils/uri-utils.js');

const LABELS = ['account', 'group', 'artifact', 'version', 'file', 'source'];
const SOURCES = ['ui', 'api'];
const TOTAL_PROPERTY = 'databus:downloadCount';
const SOURCE_PROPERTY = { ui: 'databus:uiDownloadCount', api: 'databus:apiDownloadCount' };

function readCount(entry, property) {
  const count = parseInt(entry[property]?.['@value'] ?? entry[property], 10);
  return count > 0 ? count : 0;
}

class MetricsManager {
  static register;
  static routeCounter;
  static dirty = false;

  static async initialize() {

    MetricsManager.register = new client.Registry();
    MetricsManager.routeCounter = new client.Counter({
      name: 'databus_downloads',
      help: 'Download requests on Databus file URLs (all-time total).',
      labelNames: LABELS,
    });

    // Enable the default metrics collection
    client.collectDefaultMetrics({ register: MetricsManager.register });

    // Register custom metrics
    MetricsManager.register.registerMetric(MetricsManager.routeCounter);

    await MetricsManager.load();

    const interval = parseInt(process.env.METRICS_FLUSH_INTERVAL || '30', 10);
    setInterval(MetricsManager.flush, interval * 1000).unref();
  }

  static toLabels(params) {
    return {
      account: params.account,
      group: params.group,
      artifact: params.artifact,
      version: params.version,
      file: UriUtils.createResourceUri([params.account, params.group, params.artifact,
        params.version, params.file]),
      source: SOURCES.includes(params.source) ? params.source : 'api'
    };
  }

  static registerRequest(params) {
    try {
      MetricsManager.routeCounter.inc(MetricsManager.toLabels(params));
      MetricsManager.dirty = true;
    } catch (err) {
      console.log(`Tracking download ${JSON.stringify(params)} failed: ${err}`);
    }
  }

  /**
   * Restores the persisted all-time counts from the gstore
   */
  static async load() {
    const doc = await GstoreHelper.read(Constants.DATABUS_METRICS_REPO, Constants.DATABUS_FILE_DOWNLOADS);

    if (doc == null || doc['@graph'] == null) {
      return;
    }

    const base = `${process.env.DATABUS_RESOURCE_BASE_URL}/`;

    for (const entry of doc['@graph']) {
      const id = entry['@id'];

      if (!id?.startsWith(base)) {
        continue;
      }

      const [account, group, artifact, version, file] = id.substring(base.length).split('/');
      const counts = { ui: readCount(entry, SOURCE_PROPERTY.ui), api: readCount(entry, SOURCE_PROPERTY.api) };

      // Entries without source split (older format) are restored as 'api'
      if (counts.ui + counts.api == 0) {
        counts.api = readCount(entry, TOTAL_PROPERTY);
      }

      for (const source of SOURCES) {
        if (counts[source] > 0) {
          MetricsManager.routeCounter.inc(
            MetricsManager.toLabels({ account, group, artifact, version, file, source }), counts[source]);
        }
      }
    }

    console.log(`Restored download counts for ${doc['@graph'].length} files.`);
  }

  /**
   * Writes the all-time counts to the gstore (only if something changed)
   */
  static async flush() {
    if (!MetricsManager.dirty) {
      return;
    }

    MetricsManager.dirty = false;
    const metric = await MetricsManager.routeCounter.get();

    // One node per file with the total and the count per source
    const files = {};
    for (const v of metric.values) {
      const node = files[v.labels.file] ??= {
        '@id': v.labels.file, [TOTAL_PROPERTY]: 0, [SOURCE_PROPERTY.ui]: 0, [SOURCE_PROPERTY.api]: 0
      };
      node[SOURCE_PROPERTY[v.labels.source]] += v.value;
      node[TOTAL_PROPERTY] += v.value;
    }

    const doc = {
      '@context': { databus: 'https://dataid.dbpedia.org/databus#' },
      '@graph': Object.values(files)
    };

    const result = await GstoreHelper.save(Constants.DATABUS_METRICS_REPO, Constants.DATABUS_FILE_DOWNLOADS, doc, false);

    if (!result.isSuccess) {
      MetricsManager.dirty = true;
      console.log(`Failed to persist download counts: ${result.message}`);
    }
  }

  static async getMetrics() {
    return MetricsManager.register.metrics();
  }

  static startServer(port) {

    try {
      const app = express();
      app.set('port', port);
      app.get('/metrics', async (req, res) => {
        res.set('Content-Type', MetricsManager.register.contentType);
        res.end(await MetricsManager.getMetrics());
      });

      app.listen(port, () => {
        console.log(`Metrics server is running on port ${port}`);
      });
    } catch (err) {
      console.log(`Failed to start metrics server on port ${port}: ${err}`);
    }
  }
}

module.exports = MetricsManager;
