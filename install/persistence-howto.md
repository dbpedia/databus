---
description: How to make your Databus Identifiers (more) persistent
---

# Persistence (HowTo)

## Short Version (Best Practice)

1. Databus URIs: When installing a Databus, it is highly recommended to use a subdomain and create an A/AAAA record, e.g. `mydatabus.example.com` . The main rationale behind this is that application will code against the strings of the URIs, which carry the meaning and also resolve to the data. The underlying graph database will be hardcoded against the subdomain you choose initially. If you move the Databus to a different server, all you need to do is update the A/AAAA record. Patterns using paths like `example.com/databus/` are not recommended.&#x20;
2. Data: Each dataset metadata record on the Databus contains a link (`dcat:downloadUrl`) to the actual files. This way applications that are coded against the Databus URIs can access the Databus to resolve Databus file URLs and be redirected to the download locations of the data. This already works in a way similar to DNS, purl.org, DOI, w3id.org and other redirection services. When you move the data, you simply need to update the redirects (either by reposting the records, the HTML interface, the API or by updating the redirects in the database directly). This is part of the Databus design, so that applications still can work, even if the data locations changes. All metadata edits are logged in the underlying git as part of the G(it|raph) Store.    &#x20;
