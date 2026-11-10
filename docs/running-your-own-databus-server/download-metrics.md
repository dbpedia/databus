# Download Metrics

The Databus counts downloads of its files. The counts are stored in the triple store and can be queried with SPARQL. They are also exposed as a [Prometheus](https://prometheus.io) metrics endpoint for monitoring.

## Counting rules

All files registered on the Databus are hosted on external servers. The Databus file URI, e.g.

```
https://databus.example.org/john/animals/cats/2024-01-01/cats.ttl
```

answers with a redirect (HTTP 307) to the actual `downloadURL` of the file. A download is counted when:

* a `GET` request is made on a Databus file URI, **and**
* the file exists, i.e. the request is answered with the redirect.

Every counted download is assigned a **source**:

* `ui`: the request has a `Referer` header pointing to the Databus itself
* `api`: all other requests (scripts, CLI tools, links from other websites)


## Configuration

Downloads are always counted and stored in the database. The Prometheus endpoint is optional: it is only started if `METRICS_PORT` is set.

| Variable | Default | Description |
|---|---|---|
| `METRICS_PORT` | *(unset)* | Port of the Prometheus metrics server. The endpoint is `http://<host>:<port>/metrics`. If unset, no metrics server is started (counting still happens) |
| `METRICS_FLUSH_INTERVAL` | `30` | Seconds between writes of the counts to the database |

The counts are written to the database only if they changed since the last write. They are written without git history (GStore `commit=false`), so frequent writes do not fill the git repository. GStore versions without this option ignore it and create a commit on every write; increase the interval in that case. On a regular shutdown (`docker stop`) the counts are written right away.

## Querying the counts (SPARQL)

The counts are stored in a single graph, `<DATABUS_RESOURCE_BASE_URL>/__metrics/downloads.jsonld`, with three properties per file:

| Property | Value |
|---|---|
| `databus:downloadCount` | all-time total |
| `databus:uiDownloadCount` | downloads with source `ui` |
| `databus:apiDownloadCount` | downloads with source `api` |

They can be queried through the public SPARQL endpoint of the Databus (`/sparql`). Since the file URIs follow the Databus hierarchy and are linked to the version metadata, counts can be aggregated at any level (version, artifact, group, account).

**Download count and source of a file:**

```sparql
PREFIX databus: <https://dataid.dbpedia.org/databus#>

SELECT ?downloads ?uiDownloads ?apiDownloads WHERE {
  <https://databus.example.org/john/animals/cats/2024-01-01/cats.ttl>
      databus:downloadCount ?downloads ;
      databus:uiDownloadCount ?uiDownloads ;
      databus:apiDownloadCount ?apiDownloads .
}
```

**Aggregated download count of an entire group:**

```sparql
PREFIX databus: <https://dataid.dbpedia.org/databus#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>

SELECT (SUM(?total) AS ?downloads) (SUM(?ui) AS ?uiDownloads) (SUM(?api) AS ?apiDownloads) WHERE {
  ?version databus:group <https://databus.example.org/john/animals> ;
      dcat:distribution ?distribution .
  ?distribution databus:file ?file .
  ?file databus:downloadCount ?total ;
      databus:uiDownloadCount ?ui ;
      databus:apiDownloadCount ?api .
}
```

Replace `databus:group` with `databus:artifact` or `databus:account` to aggregate at those levels, or use the version URI as subject (`<version URI> dcat:distribution ?distribution`).

**Most downloaded artifacts:**

```sparql
PREFIX databus: <https://dataid.dbpedia.org/databus#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>

SELECT ?artifact (SUM(?count) AS ?downloads) WHERE {
  ?version databus:artifact ?artifact ;
      dcat:distribution ?distribution .
  ?distribution databus:file ?file .
  ?file databus:downloadCount ?count .
}
GROUP BY ?artifact
ORDER BY DESC(?downloads)
LIMIT 10
```

Files that were never downloaded have no counts. Use `OPTIONAL` if they should show up with 0.

## Prometheus endpoint

The metrics server exposes a counter with the all-time downloads of each file and source:

```
databus_downloads{account="john",group="animals",artifact="cats",version="2024-01-01",file="https://databus.example.org/john/animals/cats/2024-01-01/cats.ttl",source="ui"} 42
databus_downloads{account="john",group="animals",artifact="cats",version="2024-01-01",file="https://databus.example.org/john/animals/cats/2024-01-01/cats.ttl",source="api"} 17
```

The endpoint also exposes the default Node.js process metrics (memory, CPU, event loop).

> **Security:** The metrics endpoint can be accessed without authentication. If unsure, do not expose the port to the public internet. Let Prometheus scrape it e.g. over the internal Docker network, or bind the port to `127.0.0.1` (as the provided `deployment/docker-compose.yml` does).

### Example queries (PromQL)

Downloads per hour, all files:

```
sum(increase(databus_downloads[1h]))
```

Web UI vs. programmatic downloads of the last day:

```
sum by (source) (increase(databus_downloads[1d]))
```

Top 5 artifacts of the last day:

```
topk(5, sum by (account, group, artifact) (increase(databus_downloads[1d])))
```

All-time totals per group (restored from the database on startup):

```
sum by (account, group) (databus_downloads)
```

A crash loses up to one flush interval of counts. Prometheus then sees the counter drop and treats it as a reset, so `increase()` over that time range overestimates.

## Deploying Prometheus and Grafana

Prometheus is only needed for monitoring. The counts in the database work without it.

Add Prometheus (and, optionally, Grafana) to the `docker-compose.yml` next to the Databus service:

```yaml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ${DATA_PATH}/data/prometheus:/prometheus
    ports:
      - 127.0.0.1:9090:9090
    restart: unless-stopped
  grafana:
    image: grafana/grafana
    volumes:
      - ${DATA_PATH}/data/grafana:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_USERS_ALLOW_SIGN_UP: "false"
    ports:
      - 127.0.0.1:3006:3000
    restart: unless-stopped
```

Create a `prometheus.yml` next to the compose file. It scrapes the Databus container over the internal network:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'databus'
    static_configs:
      - targets: ['databus:3001']
```

The Prometheus data directory must be writable by the container user (`nobody`, uid 65534), e.g. `sudo chown -R 65534:65534 ${DATA_PATH}/data/prometheus`.

In Grafana, add Prometheus as a data source with the URL `http://prometheus:9090`.

## Limitations

* Requests that do not go through the Databus file URI can not be counted: direct access of the `downloadURL`, and collection or SPARQL query results that are downloaded from the `downloadURL`s.
* `HEAD` requests (e.g. link checkers) and requests on unknown files (404) are not counted. 
* The source is best-effort: clients can send or strip the `Referer` header freely, and browsers may omit it depending on their privacy settings.
* Counts are written to the database every `METRICS_FLUSH_INTERVAL` seconds, so SPARQL results lag behind by up to that interval. On a server crash, up to one interval of counts can be lost.
