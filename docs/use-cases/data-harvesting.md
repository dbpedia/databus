# Data Crawling Scenario
Crawling RDF data from various sources is a crucial task for organizations seeking to leverage linked data. In this article, we explore how DBpedia Databus can be utilized for RDF data crawling. 

Using DBpedia Databus for RDF data crawling may employ the following procedures:
1. Publishing seed data for crawling in Databus.
2. Crawling the links from RDF data from Databus.
3. Using the Databus for saving new data you found during crawling.
4. Repeat steps 2 and 3 in a loop.

[DBpedia Archivo](https://github.com/dbpedia/Archivo) is an example of a service using Databus for data harvesting. It is an online ontology interface and augmented archive, that discovers, crawls, versions and archives ontologies on the DBpedia Databus. Each Databus Artifact represents one certain ontology and each version represents a new version of the ontology. Archivo also performs SPARQL requests to Databus for obtaining links for crawling.

Pros of Using DBpedia Databus for RDF Data Crawling:
1. Automation and Efficiency: DBpedia Databus allows for continuous data discovery and integration, ensuring up-to-date and comprehensive RDF data.
2. Data Quality Control: DBpedia Databus supports data quality control mechanisms, allowing you to validate and enhance the crawled RDF data before integration. This ensures the integrity and accuracy of the integrated data.

By adopting DBpedia Databus, organizations can streamline RDF data crawling processes, enhance data discovery, and integrate comprehensive linked data into their knowledge graphs or linked data repositories. Leveraging DBpedia Databus for RDF data crawling offers significant advantages, including automation, dataset management, and data quality control. 


