# Release Notes

## 2.1.7

* Download counts are now persisted in the database (graph `__metrics/downloads.jsonld`) and survive restarts. See [Download Metrics](running-your-own-databus-server/download-metrics.md)
* Changed the labels of the `databus_downloads` Prometheus metric to `account`, `group`, `artifact`, `version`, `file` and `source`
* Downloads are split by source (`ui` for the Web UI, `api` for everything else, based on the `Referer`), `HEAD` requests are no longer counted
* Download counts are shown in the file table of the version and artifact pages
* Added `deployment/smoke-test.sh` for verifying a deployment

## 2.1.0

* Added private mode (Databus only usable for authenticated users)
* Added UI workflow for publishing groups without artifact and version
* Updated the publishing UI to reflect some changes to the data model
