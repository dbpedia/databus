---
description: >-
  Below, we list some points that we consider unique advantages of the Databus
  over other data and metadata repositories (without naming them explicitly).
---

# 🚀 Unique Selling Points

## Data and Metadata Quality Control Patterns



## Anti-Pattern: Data Quality Creep&#x20;

Data providers delay publication to achieve better data quality first before publication and sharing. However, very important, external feedback by consumers, customers and application builders (data quality = fitness for use) will only be given once the data is published and used (point of truth). Delaying publication will also delay the time feedback is given. This results in a non agile and non-productive release workflow.&#x20;

Databus implements rapid-prototyping and test-driven development patterns for data engineering:

* For Github and Git it is commonly acceptable that the first dozens or hundreds of commits do not contain working software. For data publication, the opposite is the case.
* .&#x20;
  * DBpedia's data releases took 6 months then 9, then 17, then over 2 years as we focused on quality exclusively. &#x20;

## Low-code Application Deployment

* Build collections of datasets and files via list of URIs, SPARQL or the graphical collection builder and insert them into any software or application as data dependency
* Each application normally comes with small differences in data quality requirements, i.e. some need bzip2 instead of gzip, some need other transformations. These cn be automated with just a few lines of glue code to match the application.
* See how we deploy the various web services of DBpedia in the DBpedia application deployment use case. &#x20;

## Interoperability

The DataID model is a stable vocabulary bult on DCAT (a W3C vocabulary to describe datasets), DCMI (Dublin Core Metadata Initiative vocabulary to describe resources) and Prov-O (W3C provenance vocabulary) and forms the core of the Databus. DataID and Databus patches several shortcomings of DCAT and DCMI:

* DataID/Databus contains the "right" kind of information to re-publish to other repositories automatically, including Kaggle, CKAN, Zenodo,&#x20;
* Databus distinguishes between version of a dataset and the dataset artifact, an important individuation that allows to discover updates, i.e. new versions of the same dataset (artifact).&#x20;
* Strict datatype validation with SHACL (a W3C standard created by DBpedia) guarantees that each Databus deployment uses exactly the same kind of data as the next for the \~25 core properties, no wiggle space that might result in application break down or extra coding if/else when switching Databuses.&#x20;
* Data publishers only need to provide one format, our download client handles compression (e.g. gzip to bzip2), format conversion between equivalent formats (e.g. turtle to rdf/xml) and mappings (e.g. csv to rdf).  This is very convenient for applications and software as you can download X different dataset versions as Y and load them into Z in an automated manner.         &#x20;

## Extensibility

## Standardized, de-central and scalable

* implemented using the open W3C standards Linked Data, RDF, SPARQL, OWL, SHACL, DCAT, Prov-O complemented by our own stable DCAT extension DataID.&#x20;
* Building the Databus with Linked Data and SPARQL easily allows the Databus initative to scale regarding performance and extensibility. Databus provides stable, resolvable identifiers for account, group, dataset, version, distribution, file and collections, so it easy to:
  * comprise dataset collections of identifiers from different Databuses residing at different levels in one organisation (personal, team, project, department, whole organisation) and external Databus deployments.&#x20;
  * use identifiers in other applications to provide additional information such as additional metadata, annotations and software-data dependencies
  * Federate SPARQL queries over the Databus SPARQL endpoint with other Databuses, other SPARQL endpoints using Databus identifiers and Mods (our metadata enrichment extensions)   &#x20;
* While all components of a Databus (Keycloak, Gstore, Web UI, file storage/WebDav, Mods) can be deployed on the same server for small deployments, HTTP, Linked Data and SPARQL allows you to spread them out to different servers, which is especially necessary for storage (i.e. primary data) .&#x20;

## &#x20;
