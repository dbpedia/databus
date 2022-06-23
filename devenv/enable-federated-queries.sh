docker exec -it devenv_virtuoso isql -U dba -P everyoneknows
grant SPARQL_LOAD_SERVICE_DATA to "SPARQL";
grant SPARQL_SPONGE to "SPARQL";
grant SPARQL_SELECT_FED to "SPARQL";
exit;