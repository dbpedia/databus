VERSION=$(date +%F)
NOW=$(date --utc +%FT%TZ)

echo "Databus URI: " $1
echo "Account name: " $2
echo "Version: " $VERSION
echo "Issued: " $NOW

read -r -d '' DATAID_DATA << _EOT_
{
  "@context" : "https://downloads.dbpedia.org/databus/context.jsonld",
  "@graph" : [
    {
      "@id": "%DATABUS_URI%/%ACCOUNT%/examples",
      "@type": "databus:Group",
      "title": "Example Group",
      "abstract": "This is an example group for API testing.",
      "description": "This is an example group for API testing.",
    },
    {
      "@id": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%#Dataset",
      "@type": "dataid:Dataset",
      "title": "DBpedia Ontology Example",
      "abstract": "This is an example for API testing.",
      "description": "This is an example for API testing.",
      "publisher": "%DATABUS_URI%/%ACCOUNT%#this",
      "group": "%DATABUS_URI%/%ACCOUNT%/examples",
      "artifact": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example",
      "version": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%",
      "hasVersion": "%VERSION%",
      "issued": "%NOW%",
      "license": "http://creativecommons.org/licenses/by/4.0/",
      "distribution": [
        {
          "@id": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%#ontology--DEV_type=parsed_sorted.nt",
          "@type": "dataid:SingleFile",
          "issued": "%NOW%",
          "file": "%DATABUS_URI%/%ACCOUNT%/examples/dbpedia-ontology-example/%VERSION%/ontology--DEV_type=parsed_sorted.nt",
          "format": "nt",
          "compression": "none",
          "downloadURL": "https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/dbpedia.org/ontology--DEV/2021.07.09-070001/ontology--DEV_type=parsed_sorted.nt",
          "byteSize": "4439722",
          "sha256sum": "b3aa40e4a832e69ebb97680421fbeff968305931dafdb069a8317ac120af0380",
          "hasVersion": "%VERSION%"
        }
      ]
    }
  ]
}
_EOT_

DATAID_DATA=${DATAID_DATA//%DATABUS_URI%/$1}
DATAID_DATA=${DATAID_DATA//%ACCOUNT%/$2}
DATAID_DATA=${DATAID_DATA//%VERSION%/$VERSION}
DATAID_DATA=${DATAID_DATA//%NOW%/$NOW}

echo "$DATAID_DATA" > ./example-metadata.jsonld
echo "Generated example metadata."
echo "-- ./example-metadata.jsonld"
