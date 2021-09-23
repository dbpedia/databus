# Introduction to the Databus

Welcome to the Databus! This document will help you understand the core concepts of the Databus. It will cover all the things the Databus can and cannot do.

In a broad sense, a Databus is a database full of metadata. It holds detailed information about files on other servers such as their file size, their format and compression types and their download URL. All this information can help any application or service to use this remote data in a more sophisticated way. 

Instead of being passed a loose bundle of download URLs, your app could instead deal with well-structured metadata documents, called 'data id', to load only specific required files based on their attributes.

Since data usually changes and gets improved over time, the Databus provides tools for data creators to announce new versions of a dataset. Data consumers (applications or persons) can then always retrieve the latest version of a dataset from the same identifier.

Here is a list of the most important Databus features: 

* Data versioning
* Automated metadata publishing
* Automated data retrieval
* Rich metadata retrieval (including license information)
* Verification mechanisms using sha256sum and WebId-powered private key signatures
* Data aggregation and sharing tools

# Structural Concepts

The structure of the Databus uses 4 main concepts that will be explained in the following section. Throughout the Databus, these concepts can be identified by a specific icon and color:

%HTML_STRUCTURE%

The Databus is structured in a hierarchical manner which is reflected in the resource identifiers.

## Accounts

A Databus user is the top-level entity in the Databus hierarchy. The identifier of a user on the Databus would look like this:
```
https://databus.example.org/john
```
The URI provides two things: A profile page and a document with WebId capabilities. The profile page is an HTML page with information about the user and its activity on the Databus.

**In case you are familiar with the WebId protocol:** the document with WebId capabilities is a turtle document in the *shape* of a WebId. This document is *NOT* a WebId as it contains the public key of the Databus. Do not use it for authentication anywhere, as it would potentially give the Databus admins access to your resources. The purpose of the document is the verification of Databus metadata signatures.

## Groups

A Databus group is a logical aggregation of Databus artifacts (covered in the next section). As multiple datasets of a user might cover aspects of a common theme or topic, a Databus group provides a layer to reflect this commonality. Here's an example URI of a Databus group:
```
https://databus.example.org/john/animals/
```
The user John has multiple dataset covering different types of animals. All these datasets (or artifacts) fit well in his Databus group of 'animals'.

## Artifacts

Coming soon.

### Artifact Versions

Coming soon.

## Collections

Coming soon.

# The Databus API

All information on the databus can be changed by sending a JSON-LD document to a resource identifier via PUT request.

## Account

Coming soon.

### Changing account information

**Example API call:**
```
apiKey="28e6c598-cf90-46e6-9783-f9c2b1abfe36"
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./account.jsonld" "https://databus.example.org/john"
```

The contents of the account.jsonld have to conform to the following SHACL shape:
```
%SHACL_SHAPE_ACCOUNT%
```

Additionally, the URI of the PersonalProfileDocument needs to match the url of the request. The URI of the Person needs to match the url of the request with the suffix **#this**.

**Example data:**:
```
[
  {
    "@id": "https://databus.example.org/john#this",
    "@type": [
      "http://dbpedia.org/ontology/DBpedian",
      "http://xmlns.com/foaf/0.1/Person"
    ],
    "http://xmlns.com/foaf/0.1/account": { "@id" : "https://databus.example.org/john" },
    "http://xmlns.com/foaf/0.1/img": { "@id" : "https://via.placeholder.com/150" }, 
    "http://xmlns.com/foaf/0.1/name": "John Doe"
  },
  {
    "@id": "https://databus.example.org/john",
    "@type": "http://xmlns.com/foaf/0.1/PersonalProfileDocument",
    "http://xmlns.com/foaf/0.1/maker": { "@id" : "https://databus.example.org/john#this" },
    "http://xmlns.com/foaf/0.1/primaryTopic": { "@id" : "https://databus.example.org/john#this" }
  }
]
```

### Adding External WebIds

**Example data:**:
```
[
  {
    "@id": "https://databus.example.org/john#this",
    "@type": [
      "http://dbpedia.org/ontology/DBpedian",
      "http://xmlns.com/foaf/0.1/Person"
    ],
    "http://xmlns.com/foaf/0.1/account": { "@id" : "https://databus.example.org/john" },
    "http://xmlns.com/foaf/0.1/img": { "@id" : "https://via.placeholder.com/150" }, 
    "http://xmlns.com/foaf/0.1/name": "John Doe"
  },
  {
    "@id": "https://databus.example.org/john",
    "@type": "http://xmlns.com/foaf/0.1/PersonalProfileDocument",
    "http://xmlns.com/foaf/0.1/maker": { "@id" : "https://databus.example.org/john#this" },
    "http://xmlns.com/foaf/0.1/primaryTopic": { "@id" : "https://databus.example.org/john#this" }
  },
  {
    "@id": "https://doe.john.org/webid.ttl#this",
    "http://xmlns.com/foaf/0.1/account": { "@id" : "https://databus.example.org/john" }
  }
]
```

External WebIds will only be accepted with a valid `foaf:account` backlink to the Databus account in the WebId document.

## Group


You can add, change and remove groups. The actions are invoked by using the corresponding http request method `PUT`, `PATCH` and `DELETE`. The request uri is the path of your Databus Group. The `X-Api-Token` header needs to specify a valid API token. The `Content-Type` header needs to be set to the content type of your data. The supplied data needs to conform to the following SHACL shapes

```
%SHACL_SHAPE_GROUP%
```

The uri of the dataid:Group has to be the same as the request uri. Additionally, the uri has to be in the namespace of the issuing publisher (identified by the API token).



**Example:**
John wants to create the group `general` to later publish some of his artifacts. He issues the following `PUT` request:W

```
curl -X PUT -H "Content-Type: application/json" -H "X-Api-Key: 27b29848-69c6-4eaf" -d "@./group.jsonld" https://databus.example.org/john/general
```

The contents of the file `./group.jsonld` are the following:

```
{
  "@id": "https://databus.example.org/john/general",
  "@type": "http://dataid.dbpedia.org/ns/core#Group",
  "http://purl.org/dc/terms/title": {
    "@value": "General",
    "@language": "en"
  },
  "http://purl.org/dc/terms/abstract": {
    "@value": "General artifacts.",
    "@language": "en"
  },
  "http://purl.org/dc/terms/description": {
    "@value": "This group contains various general artifacts.",
    "@language": "en"
  }
}
```

Note that the *@id* of the supplied graph has to be the same as the request uri. Additionally, the uri has to be in John's namespace `john`.

## Data

You can add, change and remove data. 

* The actions are invoked by using the corresponding http request method `PUT` and `DELETE`. 
* The request uri is the path of your Databus Version. 
* The `X-Api-Token` header needs to specify a valid API token. 
* The `Content-Type` header needs to be set to the content type of your data. 
* The group uri specified as `dataid:group` has to be an existing Databus group.
* The supplied data needs to conform to the following SHACL shapes:
```
%SHACL_SHAPE_DATAID%
```


More coming soon.

## Artifact

Coming soon.

## Collection

Coming soon.

# Web-Interface

Coming soon.

## Account Page

Coming soon.

### Creating an Account

Coming soon.

### Managing an Account

Coming soon.

## Group Page

Coming soon.

## Artifact Page

Coming soon.

## Version Page

Coming soon.

## Collection-Editor

Coming soon.

## Publish-Wizard

Coming soon.