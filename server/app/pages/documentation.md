# documentation

## Introduction to the Databus

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

## Structural Concepts

The structure of the Databus uses 4 main concepts that will be explained in the following section. Throughout the Databus, these concepts can be identified by a specific icon and color:

%HTML\_STRUCTURE%

The Databus is structured in a hierarchical manner which is reflected in the resource identifiers.

### Accounts

A Databus user is the top-level entity in the Databus hierarchy. The identifier of a user on the Databus would look like this:

```
https://databus.example.org/john
```

The URI provides two things: A profile page and a document with WebId capabilities. The profile page is an HTML page with information about the user and its activity on the Databus.

**In case you are familiar with the WebId protocol:** the document with WebId capabilities is a turtle document in the _shape_ of a WebId. This document is _NOT_ a WebId as it contains the public key of the Databus. Do not use it for authentication anywhere, as it would potentially give the Databus admins access to your resources. The purpose of the document is the verification of Databus metadata signatures.

### Groups

A Databus group is a logical aggregation of Databus artifacts (covered in the next section). As multiple datasets of a user might cover aspects of a common theme or topic, a Databus group provides a layer to reflect this commonality. Here's an example URI of a Databus group:

```
https://databus.example.org/john/animals/
```

The user John has multiple dataset covering different types of animals. All these datasets (or artifacts) fit well in his Databus group of 'animals'.

### Artifacts

Coming soon.

#### Artifact Versions

Coming soon.

### Collections

Coming soon.

## The Databus API

The API documentation can be found [here](../../../)

## Web-Interface

Coming soon.

### Account Page

Coming soon.

#### Creating an Account

Coming soon.

#### Managing an Account

Coming soon.

### Group Page

Coming soon.

### Artifact Page

Coming soon.

### Version Page

Coming soon.

### Collection-Editor

Coming soon.

### Publish-Wizard

Coming soon.
