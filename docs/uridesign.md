## URI Design

The URIs in your input have to follow a specific pattern in order to be accepted by the API. Make sure that your URIs reflect the hierarchical structure of the Databus. All URI rules are enforced by the SHACL validation using these [shapes](https://github.com/dbpedia/databus/blob/master/model/generated/shacl/dataid.shacl).

### Base URI Rule

* The Base URI is the URI of the Databus instance (e.g.`https://databus.example.org`)

### Account URI Rules *(foaf:account)*

* An account URI has exactly one path segment.
* The first path segment of *ALL* URIs has to match the namespace of the publisher (E.g. `john`)
* A user namespace (e.g. `john`) must have at least 4 characters.

*An example of valid account URI:* https://databus.example.org/john


### Group URI Rules *(dataid:Group)*

* A group URI contains exactly two path segments.
* The first path segment is the publisher name (i.e. account name), while the second path segment identifis the group.

*An example of a valid group URI:* https://databus.example.org/john/animals

### Artifact URI Rules *(dataid:Artifact)*

* An artifact URI has exactly three path segments.
* The first path segment identifiees the publisher, the second segment the group, while the third segment the published artifact.  

* An example of a valid artifact URI:* https://databus.example.org/john/animals/cats

### Version URI Rules *(dataid:Version)*

* A version URI has exactly four path segments.
* A version URI in addition to the artifact URI includes a segment identifying the version of the specific artifact.

* An example of a valid version URI:* https://databus.example.org/john/animals/cats/2021-11-11

_Note:_ While the version segment in the example above indicates a _date_, there is no restriction on the version format, it can be any artbitrary string. The versioning approach is not strict and the publisher can freely choose the way of versioning artifacts.

### Dataset URI Rules *(dataid:Dataset)*

* A dataset URI has exactly four path segments
* A dataset URI contains the URI of the publisher, group, artifact and its associated version
* The hash fragment of a dataset URI is the `Dataset` string

* An example of a valid dataset URI:* https://databus.example.org/john/animals/cats/2021-11-11#Dataset

### Distribution URI Rules *(dataid:SingleFile)*

* A distribution URI has exactly four path segments.
* A distribution URI contains the URI of its publisher, group, artifact and its associated version.
* The hash fragment of a distribution URI is a custom string which identifies the distribution (i.e. the content variant)

* An example:* https://databus.example.org/john/animals/cats/2021-11-11#lang=en

_Note:_ the content variant of the _cats_ artifact is "lang=en". In this example, there is one specific content variant: lang=en.

### File URI Rules *(dataid:file)*

* A file URI has exactly five path segments identifying a physical file.
* A file URI provides the download location of the file for the specific artifact (with a specific content variant) which belongs to a particular group published by a particular publisher.

* An example of a valid file URI:* https://databus.example.org/john/animals/cats/2021-11-11/lang=en.ttl
