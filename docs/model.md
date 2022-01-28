# Model

Databus runs on an RDF model made from DCAT, DCT and DataId properties. Additional SHACL constraints are imposed to guarantee clean metadata. The default format we are propagating is JSON-LD, however, other RDF serializations are also supported.

General properties:
* minimal: only ~20 properties needed
* strict: fully specified with SHACL
* stable identifiers for re-use in other application
* JSON-LD that looks like JSON, see examples
