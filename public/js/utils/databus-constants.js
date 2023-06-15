

class DatabusConstants {
    static FACET_DEFAULT_SUBQUERY =
        "\n\t{ " +
        "\n\t\t?distribution <%FACET%> '%VALUE%'^^<http://www.w3.org/2001/XMLSchema#string> . " +
        "\n\t} ";

    static FACET_DEFAULT_SUBQUERY_PLACEHOLDER_FACET = "%FACET%";
    static FACET_DEFAULT_SUBQUERY_PLACEHOLDER_VALUE = "%VALUE%";
    static FACET_LATEST_VERSION_VALUE = "$latest";
    static FACET_LATEST_VERSION_LABEL = "Latest Version";

    static FACET_LASTEST_ARTIFACT_VERSION_SUBQUERY =
        "\n\t{" +
        "\n\t\t?distribution dct:hasVersion ?latestVersion " +
        "\n\t\t{" +
        "\n\t\t\tSELECT (?version as ?latestVersion) WHERE { " +
        "\n\t\t\t\t?dataset dataid:artifact <%ARTIFACT_URI%> . " +
        "\n\t\t\t\t?dataset dct:hasVersion ?version . " +
        "\n\t\t\t} ORDER BY DESC (?version) LIMIT 1 " +
        "\n\t\t} " +
        "\n\t}";

    static FACET_LASTEST_GROUP_VERSION_SUBQUERY =
        "\n\t{" +
        "\n\t\t?distribution dct:hasVersion ?latestVersion " +
        "\n\t\t{" +
        "\n\t\t\tSELECT (?version as ?latestVersion) WHERE { " +
        "\n\t\t\t\t?dataset dataid:group <%ARTIFACT_URI%> . " +
        "\n\t\t\t\t?dataset dct:hasVersion ?version . " +
        "\n\t\t\t} ORDER BY DESC (?version) LIMIT 1 " +
        "\n\t\t} " +
        "\n\t}";

    static FACET_SUBQUERY_UNION = "\n\tUNION";
    static DATABUS_SPARQL_ENDPOINT_URL = "/sparql";
}

module.exports = DatabusConstants;