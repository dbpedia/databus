const client = require('prom-client');
const express = require('express');

class MetricsManager {
  static register;
  static routeCounter;

  static initialize() {

    MetricsManager.register = new client.Registry();
    MetricsManager.routeCounter = new client.Counter({
        name: 'databus_downloads',
        help: 'Download requests on Databus file URLs.',
        labelNames: ['url', 'target'], 
    });
    
    // Enable the default metrics collection
    client.collectDefaultMetrics({ register: MetricsManager.register });

    // Register custom metrics
    MetricsManager.register.registerMetric(MetricsManager.routeCounter);
  }

  static registerRequest(requestInfo) {
    try {
        MetricsManager.routeCounter.inc(requestInfo);
    } catch(err) {
        console.log(`Tracking download ${requestInfo} failed: ${err}`);
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
    } catch(err) {
        console.log(`Failed to start metrics server on port ${port}: ${err}`);
    }
  }
}

module.exports = MetricsManager;