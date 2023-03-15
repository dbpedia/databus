# Model

This section gives a detailed overview on how to model metadata for the Databus:

1. [Quickstart Example](/docs/quickstart-examples.md) gives a very minimal example on how metadata for a dataset can be generated and a SPARQL queries for fetching that metadata agian from the Databus
2. The following sections, [group](/docs/group.md), [artifact](/docs/artifact.md), [version](/docs/version.md) and [distribution](/docs/distribution.md) contain technical details and constraints for the identifiers.


## Creating Dataset identifiers

As pointed out in the [use-cases section](/docs/usecases.md), the Databus can be seen as a "maven for data", so naming a dataset is quite important for further consumption. Generally the publisher has complete control over the names of a dataset/distribution, but nevertheless there are a few best practises to be considered:

1. **The username**
  * in this case its pretty obvious, but the best way here is to use your personal (nick)name or the name of your institution/company
2. **The group**
  * the group combines multiple artifacts into one indentifier, so generally it is good to create *one group for one project*. If a project is contains many very different datasets it could be divided into multiple groups.
3. **The artifact**
  * an artifact consists of multiple versions of different files, but all the files should somehow be related, so an artifact should represent *data of one certain topic*.    
5. **The version**:
  * A version consists of multiple distributions, each representing a file and tracks the evolution of one artifact. There is a [whole page](/docs/versioning.md) for versioning best practises.
7. **The distribution**
  * One distribution represents one certain file in an artifact/version and is distinguished by others through [content variants](content-variants.md). As the name suggests, in one artifact/version the files should somehow be closely related or even the same data in different flavors.
  * Examples:
    * the same data in different languages or encodings/file types
    * a file and other files generated from that file
    * a file and other files describing that file
  * Of course it is not always, but it is helpful to keep the names of content variants the same across versions of the dataset, which helps keeping SPARQL queries consistent 
