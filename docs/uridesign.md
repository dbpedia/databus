## URI Design

The URIs in your input have to follow a specific pattern in order to be accepted by the API. Make sure that your URIs reflect the hierarchical structure of the Databus. All URI rules are enforced by the SHACL validation using these [shapes](https://github.com/dbpedia/databus/blob/master/model-docu/generated/shacl/dataid.shacl).

### General Rules

* The URI has to start with the base URI of the Databus instance (example case: `https://databus.example.org`)
* The first path segment of *ALL* URIs has to match the namespace of the publishing user (example namespace: `john`)
* A user namespace (e.g. `john`) must have at least 4 characters.

### Account URI Rules *(foaf:account)*

* An account URI has exactly one path segment

*Example:* https://databus.example.org/john

### Group URI Rules *(databus:Group)*

* A group URI has exactly two path segments

*Example:* https://databus.example.org/john/animals

### Artifact URI Rules *(databus:Artifact)*

* An artifact URI has exactly three path segments.
* An artifact URI contains the URI of its associated group

*Example:* https://databus.example.org/john/animals/cats

### Version URI Rules *(databus:Version)*

* A version URI has exactly four path segments
* A version URI contains the URI of its associated artifact

*Example:* https://databus.example.org/john/animals/cats/2021-11-11

### Dataset URI Rules *(dataid:Dataset)*

* A dataset URI has exactly four path segments
* A dataset URI contains the URI of its associated version
* The hash of a dataset URI is the string `Dataset`

*Example:* https://databus.example.org/john/animals/cats/2021-11-11#Dataset

### Part URI Rules *(databus:Part)*

* A part URI has exactly four path segments
* A part URI contains the URI of its associated version
* The hash of a dataset URI is NOT the string `Dataset`

*Example:* https://databus.example.org/john/animals/cats/2021-11-11#video_library.ttl

### File URI Rules (databus:file)

* A file URI has exactly five path segments
* A file URI contains the URI of its associated version

*Example:* https://databus.example.org/john/animals/cats/2021-11-11/video_library.ttl
