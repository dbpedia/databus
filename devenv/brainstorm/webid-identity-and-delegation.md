# WebID Identity & Delegation (Design)

Target model. Today’s secretary feature is wrong in places called out below.

## IRIs

| IRI | Role |
|-----|------|
| `…/mike` | **Account** — namespace |
| `…/mike#this` | **Person / WebID** — agent, keys, delegation |

See [janfo](https://databus.dev.dbpedia.link/janfo): `#this` has `foaf:account` → account and `cert:key`.

## Access chain

**Secretary = personal delegation, not account ACL.**

1. Mike (Person) has access to Mike’s Account (`foaf:account`).
2. Mike lists Alex (Person) as secretary on **Mike’s Person**.
3. Alex may act as Mike → therefore can use Mike’s account.

```
Alex --secretary-of--> Mike --foaf:account--> Mike's Account
```

Secretary objects are **Person WebIDs** (`…#this`), never Accounts. List lives on the Person, not the Account.

Fine-grained write access still applies: optional `hasWriteAccessTo` prefixes on the secretary entry (IRIs under Mike’s account). Empty = all of Mike’s account; otherwise only matching paths while acting as Mike.

Example on Mike’s WebID document (`GET …/mike` → Person `#this`):

```json
{
  "@context": "https://databus.example.org/context.jsonld",
  "@graph": [
    {
      "@id": "https://databus.example.org/mike",
      "@type": "Account",
      "name": "mike"
    },
    {
      "@id": "https://databus.example.org/mike#this",
      "@type": "Person",
      "name": "Mike",
      "account": { "@id": "https://databus.example.org/mike" },
      "key": [
        { /* Shared Databus instance public key — tractate / signature validation */ },
        { /* Optional user key — matches a private key on the client (WebID auth) */ }
      ],
      "secretary": [
        {
          "@type": "Secretary",
          "agent": { "@id": "https://databus.example.org/alex#this" },
          "hasWriteAccessTo": [
            { "@id": "https://databus.example.org/mike/datasets" }
          ]
        }
      ]
    }
  ]
}
```

Alex may act as Mike only under `…/mike/datasets` (and paths below it). Omit `hasWriteAccessTo` (or use `[]`) for full account access.

## Publishing

| Property | Meaning |
|----------|---------|
| `databus:account` | Namespace |
| `dct:publisher` | Actor who published (Person WebID) |

Mike self-publish: account=`…/mike`, publisher=`…/mike#this`.  
Alex as Mike: account=`…/mike`, publisher=`…/alex#this`.

Server sets `dct:publisher` from the authenticated actor in `createOrValidateSignature` (not autocomplete). Drop `getPublisherHasAccount` as the publish gate.

## Keys on `#this` (`cert:key`)

| Key | Who adds it | Purpose |
|-----|-------------|---------|
| **Databus instance public key** | Server (always) | Validate tractate / dataset signatures the instance signs for this publisher |
| **User public keys** (optional) | User | Match private keys on client machines for **WebID auth** (TLS cert or signed request) |

Both are `cert:RSAPublicKey` on the Person. Verifiers load whatever keys are listed; auth only succeeds for keys the client can prove possession of.

## Auth

Principal is always a **Person**.

- Keep: OIDC, `x-api-key`
- Add: **WebID-TLS / key possession** — client cert (SAN = WebID) or signed request; verify against a **user** `cert:key` on `#this` (not only the shared instance key)

`x-on-behalf-of` (if kept) = Person being acted as, optional intent gate. Account comes from the resource URI.

## Migrate from today

| Today | Target |
|-------|--------|
| Secretary on Account → Account | Secretary on Person → Person |
| Publisher = account `#this` | Publisher = authenticated actor |
| Auth: OIDC + API key | + WebID cert / key proof |
