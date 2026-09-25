# Secretary Guide

## About this guide

This guide explains how to delegate write access to another person (a **secretary**) and how to publish or edit resources on someone else's behalf.

## What is a secretary?

A secretary is another person (their WebID, `…#this`) that you authorize to write in your namespace. You remain the owner. The secretary authenticates as themselves. The account comes from the resource URI. `x-on-behalf-of`, if sent, is your WebID.

Typical use cases:

- A team member publishes datasets under an organization account
- A CI pipeline uses its own API key but publishes into a shared account
- A curator manages resources for multiple accounts they do not own

## Part 1: Declaring secretaries

Only the account owner can edit the secretary list.

### Using the web interface

1. Log in and open your account profile (`/<your-account>`) or **User Settings**.
2. Find the **Secretaries** section.
3. Click **Add Secretary**.
4. Search for an account, or paste a WebID. A picked account is stored as that person's URI (`…#this`). An external URL is stored as entered.
5. Optionally add **Write Access** paths (relative to your account, e.g. `datasets`) to document which parts of your namespace the secretary may use. The UI shows your account base URL as a fixed prefix.
6. Save the account.

The secretary list is stored on your Person (`…#this`) as JSON-LD (`databus:secretary` → `databus:agent`).

### Using the API

Update your account via `POST /api/account/update` (authenticated as the owner):

```http
POST /api/account/update
x-api-key: <your-api-key>
Content-Type: application/json

{
  "accountName": "myorg",
  "label": "My Organization",
  "status": "Publishing open data.",
  "imageUrl": null,
  "secretaries": [
    {
      "accountName": "alice",
      "hasWriteAccessTo": [
        "https://databus.example.org/myorg/datasets"
      ]
    }
  ]
}
```

Each secretary entry has:

| Field | Description |
|-------|-------------|
| `accountName` | Secretary account name or WebID. Stored as the Person WebID (`#this`) |
| `hasWriteAccessTo` | Optional list of namespace paths, stored as absolute IRIs. Empty means the whole account |

In the web UI you enter the path relative to your account (e.g. `datasets`). On save it is stored as a full URI (`https://databus.example.org/myorg/datasets`). Via the API, send absolute IRIs directly.

## Part 2: Acting as a secretary

Authenticate as **yourself** (OIDC session or `x-api-key`). The resource URI selects the account. `x-on-behalf-of` is optional; if you send it, use the owner's Person WebID:

```http
x-on-behalf-of: https://databus.example.org/myorg#this
```

Replace `https://databus.example.org` with your Databus instance's `DATABUS_RESOURCE_BASE_URL`.

### Publish data on behalf of another account

```http
POST /api/register
x-api-key: <your-api-key>
x-on-behalf-of: https://databus.example.org/myorg#this
Content-Type: application/ld+json

{
  "@context": "https://databus.example.org/context.jsonld",
  "@graph": [
    {
      "@id": "https://databus.example.org/myorg/datasets/example",
      "@type": "Group",
      ...
    }
  ]
}
```

All resource URIs in the payload must live under the delegated account namespace (`/myorg/...`).

### Delete a collection on behalf of another account

```http
DELETE /myorg/collections/my-collection
x-api-key: <your-api-key>
x-on-behalf-of: https://databus.example.org/myorg#this
```

### curl example

```bash
curl -X POST "https://databus.example.org/api/register" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "x-on-behalf-of: https://databus.example.org/myorg#this" \
  -H "Content-Type: application/ld+json" \
  -d @publish.jsonld
```

## How authorization works

When you send `x-on-behalf-of`, the server:

1. Checks whether you already own the target account — if yes, allows the request.
2. Otherwise loads the owner's Person (`…#this`) and checks whether your WebID is listed as `databus:agent`.
3. If `x-on-behalf-of` is set, it must be that Person WebID.
4. Returns `403` if you are not listed, or the path is outside `hasWriteAccessTo`.

You never share your API key or password with the owner. The owner only adds your account name to their secretary list.

## Important notes

- **`x-on-behalf-of` is optional.** If sent, it must be the owner's Person WebID (`https://databus.dbpedia.org/dbpedia#this`), not the account URI.
- **Write Access namespaces** (`hasWriteAccessTo`) are stored as absolute IRIs. The UI accepts relative paths under your account and expands them on save. Prefix matching applies: a group IRI covers artifacts and versions under it. An empty list grants write access to the full account namespace.
- **Only owners** can add or remove secretaries via `/api/account/update`.
- Secretary access applies to write operations that check authorization (e.g. `/api/register`, collection delete). Read access is unchanged.

## Related guides

- [Publish Guide](publish-guide.md)
- [API usage](../usage/api/README.md)
- [Account model](../account.md)
