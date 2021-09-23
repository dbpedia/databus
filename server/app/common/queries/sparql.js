var sparql = {};

sparql.accounts = require('./query-modules/accounts');
sparql.collections = require('./query-modules/collections');
sparql.dataid = require('./query-modules/dataid');
sparql.pages = require('./query-modules/pages');

module.exports = sparql;