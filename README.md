---
description: >-
 DBpedia Databus is a transformative platform for agile data integration, collaboration, and automation via a structured metadata Knowledge Graph.
---

Important Links: [Gitbook Docu](https://dbpedia.gitbook.io/databus/), [Join Discord](https://discord.gg/fB8byAPP7e),  [Databus used in the DBpedia Project](https://databus.dbpedia.org/)

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
🚀 Try our [quickstart guide for downloading data](https://dbpedia.gitbook.io/databus/guides/data-download-guide) from DBpedia (no registration necessary). Currently, 380,000 files are available on ~30 servers via https://databus.dbpedia.org alone, serving ~200,000 requests per day. This Github repo lets you deploy your own bus for your own data. 

## Contact
<!-- TODO change email to databus@infai.org -->

The DBpedia Databus, maintained by the Institute for Applied Informatics (InfAI), Leipzig, is not just a tool but a catalyst for data innovation. Our team is eager to connect, collaborate, and form strategic partnerships to shape the future of data management.

If you're interested in exploring collaborations, encountering issues, or just have a question, we'd love to hear from you:

* **Email**: Reach us at [dbpedia@infai.org](mailto:dbpedia@infai.org).
* **GitHub**: Use our [GitHub page](https://github.com/dbpedia/databus/issues) for reporting issues.
* **Discord:**: https://discord.gg/fB8byAPP7e 
* **Community Forum**: Engage with us on the [Community Forum](https://forum.dbpedia.org).

Your interest and involvement will greatly contribute to the Databus community. Let's shape the future of data management together.

Get in contact via the informal dev channel on Discord or reach out to the Databus Management Team to explore partnership opportunities. Your data journey transformation begins here.

# Status 

  Currently, we are migrating databus.dbpedia.org and energy.databus.dbpedia.org to 2.1.0-rc8 then we beta test it some more. 

Development of the Databus started in 2018 as means to manage the DBpedia Knowledge Graph extraction more efficiently. In the first 5 years, we fireproofed Databus online at the public beta at databus.dbpedia.org and refined the Metadata model. Starting with the first public release version 2.1.0, the core model aka the Databus Ontology is stable.

# Getting Started
<!-- TODO link to our guide -->
ℹ️ Learn how to do a roundtrip: Prepare data, deploy a databus, upload data, query and download. Alternatively, you can also start with just the [download guide on existing Databuses](https://dbpedia.gitbook.io/databus/guides/data-download-guide). 


## Preparing Your Data
Databus does not store the data itself but only metainformation, therefore before running the server we need to publish our data on the internet and make it publicly available, normally via HTTPS. 

**This step requires a URI or several URIs resolving to the actual data files for download.** 
As an example here we can publish a single file, e.g. this `README.md`. So our URI is **(note that we are using permalink from particular commit because the files for publishing must be static, see more in our [Publishing Guide](docs/guides/publish-guide.md))**: 
```
https://raw.githubusercontent.com/dbpedia/databus/68f976e29e2db15472f1b664a6fd5807b88d1370/README.md
```

<!-- TODO change webdav link to our guide -->
ℹ️ Explanation and variants:
* Databus considers "text" as data. Data is any URI that can be accessed to retrieve bytecode. Text is normally encoded in Unicode UTF-8 bytecode.  
* Data can be kept private, either by Firewall, VPN, HTTP Basic Authentication (`https://user:pass@example.com`), local IPs ('127.0.0.1' or '192.168.x.x'), using `file://`.
* In the image above, we listed some free public storage options. Note that Databus comes with a built-in [WebDav](https://en.wikipedia.org/wiki/WebDAV) to store your data. 

## Running the Server
### Requirements

In order to run the Databus on-premise you will need `docker` and `docker-compose` 
installed on your machine.&#x20;

* `docker`: 20.10.2 or higher
* `docker-compose`: 1.25.0 or higher

### Starting the Databus Server

Clone the repository or download the `docker-compose.yml` and `.env` files. 
Both files need to exist in the same directory. Navigate to 
the directory with the files (root of the repo).

&#x20;run:
```
docker-compose up
```
The Databus should be available at `http://localhost:3000`.&#x20;

ℹ️ Further notes:
* See [here](https://dbpedia.gitbook.io/databus/running-own-server/configuration) on detailed configuration of Databus for the use in production.
* For regular deployment, we highly recommend that you also register a domain and choose a subdomain such as `databus.example.org`. 

### Publishing Your First Artifact
To publish an artifact you need to create a Databus account. 
After creating an account, log in and click on your account's 
icon and then `Publish Data`.

Fill in the form for publishing and submit. 
For simplicity, you can enter any name for group, artifact and version.
Use the URI of the file we prepared for publishing (`https://raw.githubusercontent.com/dbpedia/databus/68f976e29e2db15472f1b664a6fd5807b88d1370/README.md`) 
in the `Files` section.  

After publishing the data should be visible on  `account icon -> My Account -> Data tab`.

ℹ️ Notes:
* See more on how to organise your data [here](https://dbpedia.gitbook.io/databus/model), there you can find detailed explanations and our suggestions on structuring your datasets.
* For automated metadata uploads see the [API](https://dbpedia.gitbook.io/databus/usage/api)

### Querying Metadata
After files are published, we can perform queries. Databus offers two 
mechanisms for that: a SPARQL endpoint and Collections. 

Collections (user-created data catalogues) allow to flexibly combine files and artifacts together and share the collection links. Collections provide a tool to build, store and share SPARQL queries.    
Read more [here](https://dbpedia.gitbook.io/databus/usage/web-interface/collections).

The SPARQL endpoint at [localhost:3000/sparql](http://localhost:3000/sparql) allows to run queries directly. Use this query to retrieve all links available on a Databus. The link you uploaded in the previous step should be in the result. See more examples of the SPARQL queries in [examples](https://dbpedia.gitbook.io/databus/usage/quickstart-examples). 
```
PREFIX dcat:   <http://www.w3.org/ns/dcat#>

SELECT ?file  WHERE {
  ?distributions dcat:downloadURL ?file .
}    
```
ℹ️ SPARQL allows for the SERVICE keyword, that allows [federated querying](https://www.w3.org/TR/sparql11-federated-query/#simpleService) over several databuses. 


### Mods
Databus offers metadata extensions using Mods. 
You can read about them more in detail [here](https://dbpedia.gitbook.io/databus/usage/mods).

### API
Instead of using GUI, you can automate your publishing and data retrieving process
 using our http-API. Refer to it [here](https://dbpedia.gitbook.io/databus/usage/api).

# Meta

## Issue Management
We use milestones, that are roughly 3 months long, [see here](https://github.com/dbpedia/databus/milestones). Issues are sorted into these milestones as a rough orientation, when they will be tackled. Of course, if they are delayed or prove to be too difficult, we will push them back to the next milestone. Issues, which are clear candidates to be pushed back are labeled `stretch task`. Milestone `2.x.x` is the backlog and might be picked, if no other issues are more urgent or important. Note that we have a soft voting mechanism: adding 👍 to the issue (under the post) as a reaction helps us to prioritize. 

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
> **If you face dependency-install issues, try**:
> ```bash
> npm install --legacy-peer-deps
> ```
> **Check MongoDB version (for troubleshooting)**
> ```bash
> mongod --version
> ```
