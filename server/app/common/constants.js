
const Constants = {

   KEY_AUTH : 'auth',
   KEY_FRONT : 'frontpage',
   KEY_PUBLISHER: 'publisher',
   KEY_SERVICES: 'services',
   KEY_APPS: 'apps',
   KEY_CHILDREN: 'children',
   KEY_COLLECTIONS: 'collections',
   KEY_COLLECTION: 'collection',
   KEY_GROUP: 'group',
   KEY_ARTIFACTS: 'artifacts',
   KEY_ARTIFACT_VERSIONS: 'artifactVersions',
   KEY_VERSION_DATA: 'versionData',
   KEY_ACTIONS: 'actions',
   KEY_MODS: 'mods',

   DATABUS_USER_CACHE_REFRESH : 0x01,
   DATABUS_USER_ENTRY_UPDATE : 0x02,
   DEFAULT_SPARQL_ENDPOINT_URL : 'http://localhost:8898/sparql',
   DATAID_DEFAULT_IMAGE_URL : 'https://picsum.photos/id/223/320/320',
   DEFAULT_DATABASE_URL : 'http://localhost:3002',
   DATABUS_DEFAULT_CONTEXT_URL : 'https://downloads.dbpedia.org/databus/context.json',


   
  URI_DATABUS_TRACTATE_V1: 'https://databus.dbpedia.org/system/ontology#DatabusTractateV1',
}

module.exports = Constants;
