# Auto-Completion

When trying to publish data on the Databus, the HTTP API accepts not only fully complete DataIds as input. Some properties of the JSON-LD input are allowed to be omitted as they can be inferred from others. 

The following document supplies a list of inferrable properties that can optionally be omitted in the input.

| Property   | Inferred from |
|------------|---------------|
| dataid:publisher | @id of dataid:Dataset |
| dataid:group | @id of dataid:Dataset |
| dataid:artifact | @id of dataid:Dataset |
| dataid:version | @id of dataid:Dataset |
| dataid:Artifact | dataid:artifact |
| dataid:Version | dataid:version |
| dct:issued | *current time* |
| dct:modified | *current time (always set by server)* |
| dataid:format | dataid:formatExtension |
| dataid:formatExtension | dataid:format *(either format or formatExtension need to be present)* |
| dct:hasVersion *of dataid:Part* | dct:hasVersion *of dataid:Dataset* |