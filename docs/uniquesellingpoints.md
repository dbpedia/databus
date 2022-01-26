---
description: >-
  Below, we list some points that we consider unique advantages of the Databus
  over other data and metadata repositories (without naming them explicitly).
---

# 🚀 Unique Selling Points

## High-degree of Automation and Re-use

Over three years, we implemented and designed the Databus to build a solid foundation for automating many tedious processes in Knowledge Engineering including upload, download, low-level conversions, quality tests, generating statistics and tracking provenance (includes private key signature for authenticity). We fireproofed it using the DBpedia Snapshot release process. The result is that we **saved 92% cost in work hours while being 10 times more productive** (increase in release frequency). In particular:

* automated downloads and retrieving updates
* core metadata is minimal, user need to provide some textual documentation, a license URL and bytesize, sha256sum of files.&#x20;
* License URLs are mapped to Dallic to make them machine-understandable (see [Roadmap](roadmap.md))
* Mappings are collected centrally to transform data and can be re-used (see [Roadmap](roadmap.md))
* Additional metadata is computed by re-usable apps called Mods, which detect compression and format (TrueType Mod), count triples and statistics (VOID Mod), online checks (OnlineCheck Mod), syntax and encoding analysis.&#x20;
* We envision a lot more smart Mods that provide a new class of applications built on Databus metadata, such as data search, classifying data with ontologies and contextualization, automatic patching/repair and automatic selection of data to train AI. &#x20;



## Collaboration on Data



## Fighting the Anti-Pattern: Data Quality Creep&#x20;

Analogous to [Feature Creep](https://en.wikipedia.org/wiki/Feature\_creep) in software development, data providers delay publication to achieve better data quality first before publication and sharing. Very important, external feedback by consumers, customers and application builders will, however, only be given once the data is published and used. Data quality = "fitness for use" and therefore the point of usage is the "point of truth", telling truthfully, whether data quality is sufficient for usage. Delaying publication will also delay the time feedback is given. This results in a non agile and non-productive release workflow.&#x20;

* For Github and Git it is commonly acceptable that the first dozens or hundreds of commits do not contain working software. For data publication, the opposite is often the case, i.e. only published if providers assume that it is sufficient.
* Without a consumer or application, data quality is not assessable. Often serious problems are only reported after publication in particular: "unable to download", "syntax errors when parsing", "typos in schema/properties", "non-conforming datatypes", etc.&#x20;
* Databus process:&#x20;
  1. under your username create an artifact and publish the data into it as soon as possible
  2. start building:
     1. &#x20;applications
     2. tests
  3. iterate in an agile manner and re-publish until the application works and the tests are green. &#x20;
* DBpedia's data releases took 6 months then 9, then 17, then over 2 years as we focused on quality exclusively. Now, we release every three month with a better bugfixing flow, immediate quality control and tests, resulting in an agile and productive system.

## Low-code Application Deployment

* Build collections of datasets and files via list of URIs, SPARQL or the graphical collection builder and insert them into any software or application as data dependency
* Each application normally comes with small differences in data quality requirements, i.e. some need bzip2 instead of gzip, some need other transformations. These cn be automated with just a few lines of glue code to match the application.
* See how we deploy the various web services of DBpedia in the DBpedia application deployment use case. &#x20;

## Interoperability

The DataID model is a stable vocabulary bult on DCAT (a W3C vocabulary to describe datasets), DCMI (Dublin Core Metadata Initiative vocabulary to describe resources) and Prov-O (W3C provenance vocabulary) and forms the core of the Databus. DataID and Databus patches several shortcomings of DCAT and DCMI:

* DataID/Databus contains the "right" kind of information to re-publish to other repositories automatically, including platforms such as Kaggle, CKAN, Zenodo as well as the automated generation of Data Management Plan (DMP) deliverables for e.g. Horizon Europe research projects (these were implemented by third-parties and not included with the Databus software).&#x20;
* Databus distinguishes between version of a dataset and the dataset artifact, an important individuation that allows to discover updates, i.e. new versions of the same dataset (artifact). Databus also distinguishes between compression (\~ dozen of [lossless compression formats](https://commons.apache.org/proper/commons-compress/)) and [IANA Media Types](https://www.iana.org/assignments/media-types/media-types.xhtml) or mimetypes (over 1400 formats) and other formats that describe the actual format of files. &#x20;
* Strict datatype validation with SHACL (a W3C standard created by DBpedia) guarantees that each Databus deployment uses exactly the same kind of data as the next for the \~25 core properties, no wiggle space that might result in application break down or extra coding if/else when switching Databuses.&#x20;
* Data publishers only need to provide one format, our download client handles compression (e.g. gzip to bzip2), format conversion between equivalent formats (e.g. turtle to rdf/xml) and mappings (e.g. csv to rdf).  This is very convenient for applications and software as you can download X different dataset versions as Y and load them into Z in an automated manner.         &#x20;



## Standardized, de-central and scalable

* implemented using the open W3C standards Linked Data, RDF, SPARQL, OWL, SHACL, DCAT, Prov-O complemented by our own stable DCAT extension DataID.&#x20;
* Building the Databus with Linked Data and SPARQL easily allows the Databus initative to scale regarding performance and extensibility. Databus provides stable, resolvable identifiers for account, group, dataset, version, distribution, file and collections, so it easy to:
  * comprise dataset collections of identifiers from different Databuses residing at different levels in one organisation (personal, team, project, department, whole organisation) and external Databus deployments.&#x20;
  * use identifiers in other applications to provide additional information such as additional metadata, annotations and software-data dependencies
  * federate SPARQL queries over the Databus SPARQL endpoint with other Databuses, other SPARQL endpoints using Databus identifiers and Mods (our metadata enrichment extensions)   &#x20;
* While all components of a Databus (Keycloak, Gstore, Web UI, file storage/WebDav, Mods) can be deployed on the same server for small deployments, HTTP, Linked Data and SPARQL allows you to spread them out to different servers, which is especially necessary for storage (i.e. primary data) .&#x20;

## &#x20;
