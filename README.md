---
description: >-
  DBpedia Databus is an open platform for sharing structured data, 
  including RDF (Resource Description Framework) datasets and 
  ontologies. It is built on top of the Linked Data principles and 
  FAIR (Findable, Accessible, Interoperable, and Reusable).
---

# Databus

DBpedia Databus is an open platform for sharing structured data, 
including RDF (Resource Description Framework) datasets and 
ontologies. It is in essence a repository of metainformation describing your data. 
Databus is built on top of the Linked Data principles and
FAIR (Findable, Accessible, Interoperable, and Reusable).

The key features of DBpedia Databus are:
* Versioning: Databus can be used as a repository, 
like [Maven](https://maven.apache.org) in Java 
or [Pip](https://pypi.org/project/pip/) in Python, for your data artifacts.
* Querying: SPARQL endpoint and Databus Collections provide a rich API 
for querying the metadata you publish.
* Decentralized infrastructure: Databus is built on a decentralized 
infrastructure. This ensures that the data is always available, even if some 
servers go down.
* Provenance tracking: Databus tracks the provenance of data, 
which means that users can see where the data came from and who has 
modified it over time.
* Collaborative environment: Databus encourages collaboration 
among users by allowing them to share data and work 
together on projects.
* Data quality assessment: Databus provides tools for assessing 
the quality of data, such as validation and testing. This helps to ensure 
that the data is accurate, complete, and consistent.
* Data transformation: Databus provides tools for transforming data
into different formats, which makes it easy to use the data in
 different applications and contexts.

The DBpedia Databus is a valuable resource for anyone who 
works with structured data, including researchers, data scientists, 
and developers. It provides a central hub for sharing and discovering 
data, making it easier to leverage the full potential of Linked Data.

## Status

This repo develops Databus version >= 2.0, which is a major upgrade of version 
1.3-beta (currently running at https://databus.dbpedia.org) If you install it and 
find problems, please report in the [issue tracker](https://github.com/dbpedia/databus/issues) 
to help us test this new version.

**Examples:** [https://energy.databus.dbpedia.org/](https://energy.databus.dbpedia.org/), [https://dev.databus.dbpedia.org/](https://dev.databus.dbpedia.org/)

**API documentation:** https://github.com/dbpedia/databus/blob/master/API.md

**Development setup:** https://github.com/dbpedia/databus/blob/master/devenv/README.md

## Getting Started

### Preparing Your Data
Databus does not store the data itself but only metainformation, so before running the server
we need to publish our data somewhere and make it publicly available. 

**In this step we need to obtain a URI or several URIs pointing to the actual data files for download.**

As an example here we can publish this Readme.md file. So our URI is: 
```
https://raw.githubusercontent.com/dbpedia/databus/master/README.md
```
### Running the Server
#### Requirements

In order to run the Databus on-premise you will need `docker` and `docker-compose` installed on your machine.&#x20;

* `docker`: 20.10.2 or higher
* `docker-compose`: 1.25.0 or higher

Additionally you need an OIDC provider.

#### Starting the Databus Server

Clone the repository or download the `docker-compose.yml` and `.env` file to 
your machine. Both files need to exist in the same directory. Navigate to 
the directory containing the files (or the root directory of the 
cloned repository). It is possible to run the Databus on localhost in one 
shot with the default configuration to have a quick look. However, for 
proper setups it is required to start from a fresh/wiped state and 
perform [mandatory configuration settings](docs/configuration.md#mandatory-configuration) first.&#x20;

&#x20;run:

```
docker-compose up
```

Or, to start the containers in the background i.e. detached, run:

```
docker-compose up -d
```

The Databus should be available at `http://localhost:3000`.&#x20;

See [here](docs/configuration.md) on how to properly configure Databus for the use in production.

### Publishing Your First Artifact
To publish an artifact you need to create a Databus account. 
After you log in, click on your account's icon and then `Publish Data`.

Fill in the form for publishing and submit.

-> here links on docs with detailed description of how to publish (api etc)

### Querying Metainformation
After we have some files published, we can query for them.
-> collections
-> after publishing we can query the data
### Mods
-> describe mods?

## Use Cases
Here are a few use cases for Databus:
 * [Meta registries](docs/building-meta-registries.md)
 * [Maven for data](docs/maven-for-data-manage-data-dependencies-like-code.md)
## More Features
### Guidelines on Structuring Your Data for Publishing
 -> Publish the data in some publicly available space
 -> here minimal example of the dataid to publish 
 -> then the description of how to structure the data, data id and its fields
 -> here links the docs with detailed guidelines on how to structure the data
### Instructions on Running the Databus Server
 -> configs etc
### API
 -> examples 
### More on Querying
-> examples of useful queries
### Collections and Mods
-> describe what is it and how to use
 
## License

The source code of this repo is published under 
the [Apache License Version 2.0](https://github.com/AKSW/jena-sparql-api/blob/master/LICENSE)

Databus is configured so that the default license of all 
metadata is CC-0, which is relevant for all data of the Model, 
i.e. who published which data, when and under which license.

The individual datasets are referenced via links (dcat:downloadURL) 
and can have any license.

## Acknowledgements

This work was partially supported by grants from 
the German Federal Ministry for Economic Affairs 
and Climate Action (BMWK) to the projects 
LOD-GEOSS (03EI1005E) and  PLASS (01MD19003D)

