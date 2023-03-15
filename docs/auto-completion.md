# Auto-Completion

When trying to publish data on the Databus, the HTTP API accepts not only fully complete JSON-LD DataIds as input. Some properties of the JSON-LD input are allowed to be omitted as they can be inferred from others. 

The following document supplies a list of inferrable properties that can optionally be omitted in the input.

| Property   | Value inferred from |
|------------|---------------|
| dataid:publisher | @id of dataid:Version |
| dataid:group | @id of dataid:Version |
| dataid:artifact | @id of dataid:Version |
| dct:issued | *current time* |
| dct:modified | *current time (always set by server)* |
| dataid:formatExtension | content-disposition header *or* string of the dcat:downloadURL |
| dataid:compression | content-disposition header *or* string of the dcat:downloadURL |
| dataid:shasum | sha256sum of the file specified with dcat:downloadURL |
| dataid:byteSize | size of the file specified with dcat:downloadURL |
| dct:hasVersion | @id of dataid:Version |
| dct:hasVersion *of dataid:Part* | dct:hasVersion *of dataid:Dataset* |
| properties with prefix *http://dataid.dbpedia.org/ns/cv#* | Set to empty string. Only set if the property is used in any other dataid:Part of the dataid:Dataset |


| Type   | Inferred from |
|------------|---------------|
| dataid:Artifact | dataid:artifact *of dataid:Version* |
| dataid:Version | dataid:version *of dataid:Version* |
| rdf:Property *with rdfs:subPropertyOf dataid:contentVariant* | *all properties starting with dcv:* |
