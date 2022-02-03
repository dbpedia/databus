# Auto-Completion

When trying to publish data on the Databus, the HTTP API accepts not only fully complete DataIds as input. Some properties of the JSON-LD input are allowed to be omitted as they can be inferred from others. 

The following document supplies a list of inferrable properties that can optionally be omitted in the input.

| Property   | Value inferred from |
|------------|---------------|
| dataid:publisher | @id of dataid:Dataset |
| dataid:group | @id of dataid:Dataset |
| dataid:artifact | @id of dataid:Dataset |
| dataid:version | @id of dataid:Dataset |
| dct:issued | *current time* |
| dct:modified | *current time (always set by server)* |
| dataid:format | dataid:formatExtension |
| dataid:formatExtension | dataid:format *(either format or formatExtension need to be present)* |
| dct:hasVersion *of dataid:Part* | dct:hasVersion *of dataid:Dataset* |
| properties with prefix *http://dataid.dbpedia.org/ns/cv#* | Set to empty string. Only set if the property is used in any other dataid:Part of the dataid:Dataset |


| Type   | Inferred from |
|------------|---------------|
| dataid:Artifact | dataid:artifact *of dataid:Dataset* |
| dataid:Version | dataid:version *of dataid:Dataset* |
| rdf:Property *with rdfs:subPropertyOf dataid:contentVariant* | *all properties starting with dcv:* |