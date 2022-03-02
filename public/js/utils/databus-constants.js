const FACET_DEFAULT_SUBQUERY =
"\n\t{ " +
"\n\t\t?distribution <%FACET%> '%VALUE%'^^<http://www.w3.org/2001/XMLSchema#string> . " +
"\n\t} ";

const FACET_DEFAULT_SUBQUERY_PLACEHOLDER_FACET = "%FACET%";
const FACET_DEFAULT_SUBQUERY_PLACEHOLDER_VALUE = "%VALUE%";
const FACET_VERSION_KEY = "http://purl.org/dc/terms/hasVersion";
const FACET_LATEST_VERSION_VALUE = "$latest";
const FACET_LATEST_VERSION_LABEL = "Latest Version";

const FACET_LASTEST_ARTIFACT_VERSION_SUBQUERY =
"\n\t{" +
"\n\t\t?distribution dct:hasVersion ?latestVersion " +
"\n\t\t{" +
"\n\t\t\tSELECT (?version as ?latestVersion) WHERE { " +
"\n\t\t\t\t?dataset dataid:artifact <%ARTIFACT_URI%> . " +
"\n\t\t\t\t?dataset dct:hasVersion ?version . " +
"\n\t\t\t} ORDER BY DESC (?version) LIMIT 1 " +
"\n\t\t} " +
"\n\t}";

const FACET_LASTEST_GROUP_VERSION_SUBQUERY =   
"\n\t{" +
"\n\t\t?distribution dct:hasVersion ?latestVersion " +
"\n\t\t{" +
"\n\t\t\tSELECT (?version as ?latestVersion) WHERE { " +
"\n\t\t\t\t?dataset dataid:group <%ARTIFACT_URI%> . " +
"\n\t\t\t\t?dataset dct:hasVersion ?version . " +
"\n\t\t\t} ORDER BY DESC (?version) LIMIT 1 " +
"\n\t\t} " +
"\n\t}";

const FACET_SUBQUERY_UNION = "\n\tUNION";
const DATABUS_NAME = "Just Another Databus";
const DATABUS_RESOURCE_BASE_URL = "http://localhost:3000";
const DATABUS_DEFAULT_CONTEXT_URL = "https://downloads.dbpedia.org/databus/context.jsonld";
const DATABUS_SPARQL_ENDPOINT_URL = "/sparql";