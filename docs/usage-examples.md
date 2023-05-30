# Industrial Application Examples

Databus can be seen as a **data** repository (analogous to [software repositories](https://en.wikipedia.org/wiki/Software_repository), e.g. Maven or Pip). A key difference of Databus from a typical software repository is that it does not store the actual data (i.e. files on disk) but focuses solely on capturing metadata describing your data (i.e. what kind of files and where are they).

The idea is simple. Owners of the data upload the descriptions of their data and where to find it. Users of the data can find and download what they want and check out for updates if new versions of the data were uploaded. **This enables smooth continuous integration processes for your data.**

![Databus as a repo](databus-as-repo.drawio.png)

## Automatic Deployment

The approach shown in the figure above can be used for automatic data deployment. In this scenario Databus can be used for querying the needed data, downloading it and deploying it automatically in your service. The data can be deployed, for example, as files or in a database, e.g. [Virtuoso database](https://virtuoso.openlinksw.com). 

Below are some examples of the projects using automated deployment.

### Virtuoso SPARQL Endpoint

[Virtuoso SPARQL Endpoint](https://github.com/dbpedia/virtuoso-sparql-endpoint-quickstart) creates and runs a Virtuoso Open Source instance including a SPARQL endpoint preloaded with a Databus Collection and the VOS DBpedia Plugin installed. The user specifies a collection URI and runs a docker container which downloads the data from the collection and saves it to [Virtuoso database](https://virtuoso.openlinksw.com)

### Spotlight

[DBpedia Spotlight](https://github.com/dbpedia-spotlight/dbpedia-spotlight-model) is an open-source tool that helps annotate textual documents with DBpedia entity references. It leverages natural language processing and machine learning techniques to recognize and link mentions of entities to their corresponding DBpedia resources.

### Lookup

[DBpedia Lookup](https://github.com/dbpedia/dbpedia-lookup) is a generic entity retrieval service for RDF data. It can be configured to index any RDF data and provice a retrieval service that resolves keywords to entity identifiers. Lookup uses Databus for automating downloading the data indexed.

### Open Energy Family W and Search

???

## Archivo

[DBpedia Archivo](https://github.com/dbpedia/Archivo) is an online ontology interface and augmented archive, that discovers, crawls, versions and archives ontologies on the DBpedia Databus. Each Databus Artifact represents one certain ontology and each version represents a new version of the ontology. Archivo also performs SPARQL requests to Databus for obtaining links for crawling.


