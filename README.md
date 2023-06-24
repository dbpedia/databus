---
description: >-
 DBpedia Databus is a transformative platform for agile data integration, collaboration, and automation via a structured metadata Knowledge Graph.
---

Important Links: [Gitbook Docu](https://dbpedia.gitbook.io/databus/), [Join Discord](https://discord.gg/fB8byAPP7e), Contact, [Databus used in the DBpedia Project](https://databus.dbpedia.org/)

# About
## What is the DBpedia Databus?

The DBpedia Databus is a transformative platform for agile data integration, collaboration, and automation via a structured metadata Knowledge Graph. The Databus implements well-known concepts from Software Engineering such as agile rapid prototyping, build automation, test-driven development for Data Engineering and connects data via a loosely-coupled bus system and a common, but extensible metadata format through state-of-the-art semantic technologies such as ontologies, SPARQL, SHACL and Linked Data. 

🔥 *Hot Fact*: The DBpedia Databus condenses 15 years of expertise from the DBpedia Community into an accessible open-source tool.

## Supercharging Collaboration on Open Data
Communities, public organisations, researchers and data enthusiasts can deploy their own DBpedia Databus as a powerful productivity tool to foster collaboration on Open Data. Bringing into existence such participatory models with community feedback and upstream contribution are drivers for Democratized Knowledge, Accelerated Innovation and Transparent Governance. Contrary to conventional publisher-centric data “publishing” platforms, the growing Databus Network is optimised for data consumers by innovating discovery, findability and access. Data flows to where it is needed and appreciated - the people who build amazing things with it.  

💡 *Spotlight*: The Databus Network places the power in the hands of data consumers, streamlining discovery and access. Data flows to where it is valued and ignites creativity.

## A Power Tool for Data Engineers
The DBpedia Databus addresses a significant gap in tooling: the “pre and post-processing”, which wastes precious time in the magnitude of months of every data-intensive project. DBpedia’s tech stack comprises a complex extraction software producing data releases, an online database and several web services. We fully automated the pipeline and application deployment with the Databus and saved 90% of time (2 full-time engineers to 1 part-time engineer), while increasing productivity 5-fold by shortening the release cycle from 17 to 3 months with improved quality, i.e. automated data validation tests over 14 billion facts. Benefit now from our power tool, which tackles the pain points in Data Engineering: efficiency, automation, scalability and data quality. Databus provides an efficient environment for initial identification and acquisition from existing Databuses to low-level tasks such as conversion, normalization to data-quality control and debugging pipelines to loading the data into the final application. 

💪 *Strength*: The DBpedia Databus addresses industry pain points head-on – efficiency, automation, scalability, and data quality – ensuring your data projects are set for success.

## Reference Deployments
Databus is designed as a lightweight and agile solution and fits seamlessly into existing environments. 
* **Comprehensive & All-in**: In the DBpedia Project, we went all-in to manage 5000 release files per month plus triple the amount in input and intermediary files plus additional dataset contributions by the community. 
* **Semantic Layer On-Top**: Databus is a proud member of the [Open Energy Family](https://openenergy-platform.org/) and deployed as an additional semantic layer over the various existing databases to extend the underlying rigid metadata schemas and enable search, persistent IDs and provenance tracking of scientific results. 
* *Plugin*: In eccenca’s product [Corporate MEMory](https://eccenca.com/products/enterprise-knowledge-graph-platform-corporate-memory) Databus is a small plugin that handles export, versioning and archival of subgraphs, that can be exchanged with other CMEM instances via the semantic catalogue metadata in the Databus Knowledge Graph. 

## Deployment Levels
We identified these deployment levels with our partners:
1. **Open community**: Set up a data space in the Databus Network and jointly curate it with community contributions spanning across several organisations (see DBpedia and Open Energy) 
2. **Organisation**: Implement your enterprise’s data strategy and optimise efficiency, integration of external data and re-use; manage research data university-wide for scientific sustainability and FAIR. Databus hooks into single sign-on authentication like Siemens ID or DLR ID
3. **Department, group or team**: Systematise data workflows internally; transparently record scientific results from beginning to end.  
4. **Collaborative projects**: Efficiently coordinate data with partners in large projects or in multi-project environments. 
5. **Application, Product or Pipeline**: Streamline and automate data flow and data dependencies within a target application, product or pipeline. It's an essential tool for agile and data-driven decision making and shines in managing input/output for data-intensive applications such as: Search, AI, Deep Learning, Natural Language Processing (NLP), Knowledge Graph Construction and Evolution, Databases, Continuous Integration and Microservice Orchestration.  

## Get on Board the Databus
🚀 Try our quickstart guide for downloading data from DBpedia (no registration necessary). Currently, 380,000 files are available on ~30 servers via https://databus.dbpedia.org alone, serving ~200,000 requests per day. This Github repo lets you deploy your own bus for your own data. 

## Contact

The DBpedia Databus, maintained by the Institute for Applied Informatics (InfAI), Leipzig, is not just a tool but a catalyst for data innovation. Our team is eager to connect, collaborate, and form strategic partnerships to shape the future of data management.

If you're interested in exploring collaborations, encountering issues, or just have a question, we'd love to hear from you:

* **Email**: Reach us at [databus@infai.org](mailto:databus@infai.org).
* **GitHub**: Use our [GitHub page](https://github.com/dbpedia/databus/issues) for reporting issues.
* **Discord:**: https://discord.gg/fB8byAPP7e 
* **Community Forum**: Engage with us on the [Community Forum](https://forum.dbpedia.org).

Your interest and involvement will greatly contribute to the Databus community. Let's shape the future of data management together.

Get in contact via the informal dev channel on Discord or reach out to the Databus Management Team to explore partnership opportunities. Your data journey transformation begins here.

# Status 

Development of the Databus started in 2018 as means to manage the DBpedia Knowledge Graph extraction more efficiently. In the first 5 years, we fireproofed Databus online at the public beta at databus.dbpedia.org and refined the Metadata model. Starting with the first public release version 2.1.0, the core model aka the Databus Ontology is stable.

# Important Links

**Documentation:** [https://dbpedia.gitbook.io/databus/overview/readme](https://dbpedia.gitbook.io/databus/overview/readme) 

**API documentation:** [https://github.com/dbpedia/databus/blob/master/API.md](https://github.com/dbpedia/databus/blob/master/API.md)

**Working deployments:** [DBpedia Databus (Reference)](https://dev.databus.dbpedia.org/), [Energy Databus](https://energy.databus.dbpedia.org/)

**Development setup:** [https://github.com/dbpedia/databus/blob/master/devenv/README.md](https://github.com/dbpedia/databus/blob/master/devenv/README.md)

**Our Discord:** [https://discord.gg/fB8byAPP7e](https://discord.gg/fB8byAPP7e)

## Use Cases

More examples of the Databus capabilities are demonstrated in our use cases:
 * [Meta registries](docs/building-meta-registries.md)
 * [Maven for data](docs/maven-for-data-manage-data-dependencies-like-code.md)

# Getting Started
| Learn how to do a roundtrip: Deploy a databus, upload data, query and download |
| --- |

> **Note**
> This is a note

### Preparing Your Data
Databus does not store the data itself but only metainformation, therefore before running the server
we need to publish our data somewhere and make it publicly available. 

**In this step we need to obtain a URI or several URIs pointing to the actual data files for download.** 
As an example here we can publish a single file, e.g. this `README.md`. So our URI is: 
```
https://raw.githubusercontent.com/dbpedia/databus/master/README.md
```
### Running the Server
#### Requirements

In order to run the Databus on-premise you will need `docker` and `docker-compose` 
installed on your machine.&#x20;

* `docker`: 20.10.2 or higher
* `docker-compose`: 1.25.0 or higher

#### Starting the Databus Server

Clone the repository or download the `docker-compose.yml` and `.env` files. 
Both files need to exist in the same directory. Navigate to 
the directory with the files (root of the repo).

&#x20;run:
```
docker-compose up
```
The Databus should be available at `http://localhost:3000`.&#x20;

See [here](docs/running-your-own-databus-server/configuration.md) on detailed configuration of Databus for the use in production.

### Publishing Your First Artifact
To publish an artifact you need to create a Databus account. 
After creating an account, log in and click on your account's 
icon and then `Publish Data`.

Fill in the form for publishing and submit. 
For simplicity, you can enter any name for group, artifact and version.
Use the URI of the file we prepared for publishing (`https://raw.githubusercontent.com/dbpedia/databus/master/README.md`) 
in the `Files` section.  

After publishing the data should be visible on  `account icon -> My Account -> Data tab`.

See more on how to organise your data [here](docs/model.md), there 
you can find detailed explanations and our suggestions on structuring
your datasets.

### Querying Metainformation
After files are published, we can perform queries. Databus offers two 
mechanisms for that: a SPARQL endpoint and Collections. 

Collections allow to flexibly combine files and artifacts together. 
Read more [here](docs/collections.md).

SPARQL endpoint allows to run queries directly. See some examples of the SPARQL queries in [examples](docs/usage/quickstart-examples.md).
### Mods
Databus offers metadata extensions using Mods. 
You can read about them more in detail [here](docs/mods.md).
### API
Instead of using GUI, you can automate your publishing and data retrieving process
 using our http-API. Refer to it [here](docs/usage/api/README.md).

# Meta

## Contributing
Please report issues in our [github repository](https://github.com/dbpedia/databus/issues).

If you would like to submit a non-trivial patch or pull request we will need you to sign the Contributor License Agreement, we will send it to you in that case.

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
