# Databus API

## Creating an API Token

Once the Databus has been started with the correct configuration, you can use the login button on the web interface to log in to your OIDC provider account. Once you are successfully logged in, you can navigate to your account page by using the 'My Account' button on the landing page or using the dropdown in the upper right corner of the screen.

You will be asked to specify a namespace. Choose this namespace carefully, as it will be visible in all your databus URIs. The namespace can only be changed by an admin later.

Navigate to the settings tab on your account page and scroll to the 'API Keys' section. Enter a display name for your API key (this is only for better distinguishability) and click 'Create' to create the key. You can use the copy icon on the API key to copy the key value to your clipboard.

Use any API key in the `X-Api-Token` header of your API calls to authenticate yourself.

The following examples of the API usage use a non-existing example databus at `https://databus.example.org`. The user performing the requests will be John who is using the namespace `john`. John has already created an API token on his account page with a value of `27b29848-69c6-4eaf`.

## Accounts

Account data can be changed via `PUT` or `DELETE` request. It is however recommended to use the web interface for these actions.
* The request uri is the path of your account. 
* The `X-Api-Token` header needs to specify a valid API token. 
* The `Content-Type` header needs to be set to the content type of your data. 
* The supplied data needs to conform to these [SHACL shapes](./server/app/common/shacl/account-shacl.ttl)

## Groups

You can add, change and remove groups. The actions are invoked by using the corresponding http request method `PUT` and `DELETE`. The request uri is the path of your Databus Group. The `X-Api-Token` header needs to specify a valid API token. The `Content-Type` header needs to be set to the content type of your data. The supplied data needs to conform to these [SHACL shapes](./server/app/common/shacl/group-shacl.ttl)


**ADDITIONALLY:** 
* The uri of the dataid:Group has to match the request uri. 
* The uri path must start with the username of the issuing user (identified by the API token).

### Example:
John wants to create the group `general` to later publish some of his artifacts. He issues the following `PUT` request:

```
curl -X PUT -H "Content-Type: application/json" -H "X-Api-Token: 27b29848-69c6-4eaf" -d "./group.jsonld" https://databus.example.org/john/general
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

## Artifact Versions

Databus artifacts are created implicitly by creating a version of an artifact. You can add, change and remove groups. The actions are invoked by using the corresponding http request method `PUT`, `PATCH` and `DELETE`. The request uri is the path of your Databus Group. The `X-Api-Token` header needs to specify a valid API token. The `Content-Type` header needs to be set to the content type of your data. The supplied data needs to conform to the following SHACL shapes

### Creating / Modifying an Artifact Version

```http
PUT -d $data /$username/$group/$artifact/$version
```

| Header | Value |
| :--- | :--- | 
| X-Api-Token | **Required** Your Databus API Key |
| Content-Type | **Required** application/json | 


| Parameter | Description |
| :--- | :--- | 
| `$username` | Your Databus username |
| `$group` | The group identifier for your artifact version |
| `$artifact` | The artifact identifier for your artifact version |
| `$version` | The version identifier for your artifact version |
| `$data` | The DataId of the artifact version. The format specs are documented below. |

*Data Format Specification*
* The `$data` must be supplied as JSON-LD 
* The `$data` must conform to these [SHACL shapes](./server/app/common/shacl/dataid-shacl.ttl)

| Status Codes | Status | Description |
| :--- | :--- | :--- | 
| 200 | `OK` | Artifact version updated |
| 201 | `CREATED` | Artifact version created | 
| 400 | `BAD REQUEST` | Request or request data was formatted incorrectly | 
| 403 | `FORBIDDEN` | Invalid API Token or request targetting the namespace of another user | 
| 500 | `INTERNAL SERVER ERROR` | Internal server error | 

### Removing an Artifact Version

```http
DELETE /$username/$group/$artifact/$version
```

| Header | Value |
| :--- | :--- | 
| X-Api-Token | **Required** Your Databus API Key |

| Status Codes | Status | Description |
| :--- | :--- | :--- | 
| 204 | `NO CONTENT` | Artifact version deleted successfully |
| 403 | `FORBIDDEN` | Invalid API Token or request targetting the namespace of another user | 
| 500 | `INTERNAL SERVER ERROR` | Internal server error | 
