# Building Data Repositories

With the growing importance of the FAIR data principles and mass production of data, metadata repositories or registries that specialize in cataloguing data assets for specific domains are on the rise.&#x20;

The Databus was designed to capture metadata for every file you can imagine. It allows to easily realize a crawler or other harvesting tools that collect information spread in the Web or your intranet to make it findable and accessible at a central place.&#x20;

With the help of the Databus Mods subsystem, several custom metadata layers can be added, to facilitate a unified way to access and manage this metadata extension tailored to your specific use case. This enables to build even more complex systems like meta or interoperability registries that integrate or enhance heterogeneous metadata catalogues from different registries in a flexible and extensible way.&#x20;

### Meta registries

A current problem of the data repository landscape is that these repositories which are typically focused on a specific data or research domain, have very specific, fixed metadata schemas combined with huge technical heterogeneity, which easily turn them into metadata silos, hinder findability at a larger scale and complicate the overall FAIR publishing process of (research) data.

Data consumers and producers have to deal with questions like which repositories exist and which should be used to search and register data and how can they be used. Especially for workflows from interdisciplinary domains, that employ data registered across different repositories, data access is burdensome due to this technical heterogeneity. However, the number and variety of platforms and repositories is steadily increasing, mainly driven by the paradigm “If a metadata schema or feature set of platform X is not sufficient for a use case, project, or domain, typically a new, extended Platform Y which optionally integrates (parts of) platform X is developed”.&#x20;

As a consequence, redundant but also complementary (different types of community-specific) metadata about the same data assets is spread apart in different repositories and thus creates a demand for a registry of repositories (meta registry) that also allows unified access to (meta)data of a plethora of repositories. The DBpedia Databus - that is based on minimal mandatory core metadata and allows metadata to be extended easily with Databus Mods - can be leveraged to discover, access and associate (meta)data for/of data assets in a unified way to realize such a meta registry.

The basic idea is simple yet powerful. Bots or harvesting tools realize agents on the Databus that register assets discovered in the data repositories of interest. The bots take care of maintaining the minimal mandatory Databus metadata. This metadata forms a unified identifier space across different repositories and sets the foundation for processing the data and metadata in an automatic way (access location, license, versioning) and makes it tangible for further processing. The identifier space can then be used as part of the Mods subsystem to extend the metadata (see next section).

A prominent example of such a bot is [DBpedia Archivo](https://archivo.dbpedia.org). Archivo automatically crawls for ontologies in the Web of Data, but also harvests information about them from dedicated ontology repositories (e.g. Linked Open Vocabularies) and schema summaries of datasets in other repositories (e.g. VoID reports).&#x20;

### Enhancement with Mods

Databus metadata is limited to very basic technical information and free-text documentation. We argue that this metadata should remain very lightweight to scale over a huge amount of assets. To be able to associate and find more and richer metadata in a unified way, the Databus Mods (from modifications) architecture was developed.&#x20;

Mods are activities, analyzing and assessing the files or the DataID metadata from the Databus, that can provide useful statistics, enrichment or annotations (e.g. online availability/uptime of the file download location, VoID summaries of datasets, semantic concept annotations, etc.) Mods allow to customize and extend the Databus in a virtual way with metadata and add consistent metadata layers over all or a selection of Databus files.&#x20;

The mod results are associated via the PROV ontology using the persistent identifiers of the Databus. Instead of registering files with metadata in one shot, it is possible to register metadata for Databus files independent of the registrar. To obtain information about (1a) the existence of metadata extensions for Databus IDs or (1b) a selection of files based on Databus core metadata or (2) a selection combining both (or even multiple) metadata vocabularies, (federated) SPARQL queries can be used. Complex overlay systems can be built on top of the Mod architecture (e.g. a topic-oriented dataset/file search UI based on a combination of classes and properties from VoID schema summaries).&#x20;

Due to the unified way to associate additional metadata, several types of Mods from different communities can be integrated into one very specialized application with a fine-grained selection of files and metadata that are needed as input.&#x20;

In the above mentioned use case of meta registries, Mods can be used to link or mirror metadata of Repository X and Y but also to associate additional metadata (for improved interoperability) in the future.
