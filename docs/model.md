# Model

This section gives a detailed overview on how to model metadata for the Databus:

1. [Quickstart Example](/docs/quickstart-examples.md) gives a very minimal example of a valid input for the metadata publishing API. Additionally, it provides SPARQL queries for fetching your metadata from a Databus SPARQL endpoint.
2. The following sections, [group](/docs/group.md), [artifact](/docs/artifact.md), [version](/docs/version.md) and [distribution](/docs/distribution.md) contain technical details of the API inputs, such as  identifier and other metadata constraints.
3. Most constraints are formalized using SHACL-shapes. The shapes can be found in the following subchapters.

## Creating Dataset identifiers

As pointed out in the [use-cases section](/docs/usecases.md), the Databus can be seen as a *maven for data*. Metadata for your Datasets is made available under a specific URI identifier, where certain path segments of that URI are shared between related Datasets (see examples below).

> **Note**
> Choosing descriptive names for your identifiers and putting thought into the partitioning  of your metadata entries can greatly impact the understandability and usefulness of your data. 

Similar to maven, URI identifiers of metadata entries are a composite of names chosen by the metadata publisher. This allows publishers to create a hierarchy of metadata entries for a clean and understandable structure.

### Identifier Hierarchy

The Databus allows users with an account to publish metadata in a certain hierarchical structure. The hierarchy has the following levels:

1. Account
2. [Group](/docs/group.md)
3. [Artifact](/docs/artifact.md)
4. [Version](/docs/version.md)
5. [Distribution](/docs/distribution.md)

Thus, the identifiers of your metadata entries on the Databus are a composite of

1. The Databus **base URI** *(e.g. https://databus.dbpedia.org)*
2. Your **account name** for that Databus *(e.g. janfo)*
3. The **group name** *(e.g. animals)*
4. The **artifact name** *(e.g. cats)*
5. The  **version name** *(e.g. 2023-03-30)*
6. The **distribution name** *(e.g. cats.ttl.bz)*

The full example identifiers would look like this:
* **Account** Identifier: 
  https://databus.dbpedia.org/janfo
* **Group**  Identifier: 
  https://databus.dbpedia.org/janfo/animals
* **Artifact** Identifier: 
  https://databus.dbpedia.org/janfo/animals/cats
* **Version** Identifier: 
  https://databus.dbpedia.org/janfo/animals/cats/2023-03-30
* **Distribution** (file) Identifier:
  https://databus.dbpedia.org/janfo/animals/cats/2023-03-30/cats.ttl.bz

### Best Practices

The metadata publisher has complete control over the names of the Databus identifiers. Though, there are a few best practices to be considered:
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
