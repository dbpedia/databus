# Content Variants

Content variants are a tool to distinguish the databus:Part(s) of a databus:Version. Parts of a Dataset (i.e. Version) may describe files of different formats or compression types. Sometimes however, they differ in other aspects, e.g. the language or a data specific subtopic. These special distinguations can be reflected with content variants to allow a more meaningful selection of files.

In fact, features such as the faceted browsing interface or the Databus Collections rely on a proper setup of content variants.

The main rule for content variant setup is the following:
> All databus:Part(s) of a databus:Version have to be distinguishable by either *format*, *compression type* or at least one *content variant*

This ensures that each file in the databus:Version can be selected individually by querying for its unique tuple of *format*, *compression type* and *content variants*.

A content variant is a key-value pair with the key being a sub-property of `databus:contentVariant` and the value being a (preferrably short) string that can be chosen freely. Content variants could describe either a property of the file or its content.


**Examples:**

``` json
"@context" : "https://downloads.dbpedia.org/databus/context.jsonld",
...
"distribution": [
  {
    "@type": "Part",
    "@id": "https://databus.example.org/john/animals/cats/2022-02-02#cats.nt",
    "format": "nt",
    "compression": "none",
    ...
  },
  {
    "@type": "Part",
    "@id": "https://databus.example.org/john/animals/cats/2022-02-02#cats.ttl",
    "format": "ttl",
    "compression": "none",
    ...
  }
],
...
```

The above example shows two databus:Part(s) of a databus:Version. The two parts are distinguishable by format (`nt` and `ttl`). Hence, no content variant is *required*.


``` json
"@context" : "https://downloads.dbpedia.org/databus/context.jsonld",
...
"distribution": [
  {
    "@type": "Part",
    "@id": "https://databus.example.org/john/animals/cats/2022-02-02#cats_size=small.ttl",
    "format": "ttl",
    "compression": "none",
    "dcv:size": "small",
    ...
  },
  {
    "@type": "Part",
    "@id": "https://databus.example.org/john/animals/cats/2022-02-02#cats_size=big.ttl",
    "format": "ttl",
    "compression": "none",
    "dcv:size": "big",
    ...
  }
],
...
{
  "@type": "rdf:Property",
  "@id": "https://dataid.dbpedia.org/databus-cv#size",
  "rdfs:subPropertyOf": "databus:contentVariant"
}
```

The above example shows two databus:Parts of a databus:Version. Both parts have a format of `ttl` and a compression type of `none`. In order to improve the distinguishability of the two parts, an additional content variant has to be used. The publisher of the databus:Version chose the property `dcv:size` as the content variant dimension and assigned each part a different value (`small` and `big`).
