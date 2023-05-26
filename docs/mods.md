# Customization, Mods, Metadata Quality

TODO Marvin:
Databus can be customized, by changing shacl, the webid and posting additional data. Please give some best practices, when to use this customization mechanism and when to use mods. I think, that if people have metadata that can not be generated from the file and is available to uploading agent, then that could be included, e.g. if they have own identifiers. Or they could limit licenses to CC or few open licenses only. Then also how do mods increase metadata quality (consistency is one aspect here, see e.g. the comments in byteSize)

## Databus Mods

While the [Databus Model](./model.md) is quite minimal and supports only necessary access metadata (e.g. download URL, shasum etc.) and basic documentation (title, description), Databus Mods provides a way of automatically enhancing files on the Databus with (meta)data using Linked Data technologies.
In a nutshell, Databus Mods provide a service plus library for producing, persisting and linking files related to Databus Files (or actually running arbitrary code) when those are published. The metadata (or if necessary the data itself) from such a mod is published in an own SPARQL endpoint, making the fusion of Databus files with their additional (meta)data very easy, for example by using SPARQL's federated queries.

### Existing Examples

There are currently some basic examples for Databus Mods, applicable to various file types, showcasing for what Databus Mods can be used:

1. Mimetype Mod: On the publishing of any file, this mod finds the correspnding mimetype and saves it 
2. VOID Mod: Collects [VOID](https://www.w3.org/TR/void/) metadata for RDF files and saves them in an SPARQL endpoint.
3. Filemetrics Mod: Collects some addidional metrics not captured by the minimal model for any file, e.g. checking if it is sorted, the uncompressed size and some more 

### Use Cases

TODO
