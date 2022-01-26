# Roadmap

### dalicc.net licenses

license can be any URI at the moment, however, these URIs are not validated and in most cases they are not proper [linked data](https://www.w3.org/DesignIssues/LinkedData.html), i.e. they violate rule 3, do not resolve properly and do not provide useful information. We plan to intensify collaboration with dalicc.net and implement mappings and more stricter checks.

### Mappings

We implemted a prototypical CSV to RDF conversion with TARQL in the Databus Download Client. We  to integrate a full RML engine. At the moment, "[FunMap: Efficient Execution of Functional Mappings for Knowledge Graph Creation](https://arxiv.org/abs/2008.13482)" by DBpedia Member TIB seems the best candidate.&#x20;

### More Download As Options

The Databus Download Client supports mostly RDF formats for now, e.g. download `.ttl.bz2` as `.jsonld.gz` Download as HDT or XSLT for XML among others is planned.

