var rp = require('request-promise');
const Constants = require('./constants');
var sparql = {};

var sparqlEndpoint = (process.env.DATABUS_DATABASE_URL || Constants.DEFAULT_DATABASE_URL) + '/sparql';


/**
 * Uses the request-promise package to send a select query against the sparql endpoint
 * and return a set of bindings or null
 * @param  {[type]} query [description]
 * @return {[type]}       [description]
 */
sparql.executeSelect = async function (query) {

   try {

      // Do a POST request with the passed query
      var options = {
         method: 'POST',
         uri: sparqlEndpoint + '?timeout=10000',
         body: "query=" + encodeURIComponent(query),
         json: true,
         headers: {
            "Content-type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
         },
      };

      // Await the response
      var response = await rp(options);

      bindings = response.results.bindings;

      // Prune the returned bindings
      for (var i in bindings) {
         bindings[i] = reduceBinding(bindings[i]);
      }

      return bindings;

   } catch (err) {
      console.log(err);
      return null;
   }
}

sparql.executeConstruct = async function (query, format) {
   try {

      // Do a POST request with the passed query
      var options = {
         method: 'POST',
         uri: `${sparqlEndpoint}?timeout=10000`,
         body: `query=${encodeURIComponent(query)}`,
         json: true,
         headers: {
            "Content-type": "application/x-www-form-urlencoded",
            "Accept": format
         },
      };

      // Await the response
      var response = await rp(options);
      return response;

   } catch (err) {
      console.log(err);
      return null;
   }
}


/**
 * Uses the request-promise package to send a select query against the sparql endpoint
 * and return a set of bindings or null
 * @param  {[type]} query [description]
 * @return {[type]}       [description]
 */
sparql.executeAsk = async function (query) {

   try {

      // Do a POST request with the passed query
      var options = {
         method: 'POST',
         uri: sparqlEndpoint + '?timeout=10000',
         body: "query=" + encodeURIComponent(query),
         json: true,
         headers: {
            "Content-type": "application/x-www-form-urlencoded"
         },
      };

      // Await the response
      var response = await rp(options);
      return response.boolean;

   } catch (err) {
      console.log(err);
      return null;
   }
}

/**
 * reduce the binding entry objects to their value
 * @param  {[type]} binding [description]
 * @return {[type]}         [description]
 */
function reduceBinding(binding) {
   for (var key in binding) {
      binding[key] = binding[key].value;
   }

   return binding;
}


/**
 * Execute an UPDATE query with auth string
 * Throws an exception!
 
sparql.executeUpdate = async function(query, username, password) {
    var digestRequest = require('request-digest')(username, password);
    await digestRequest.requestAsync({
        host: 'http://localhost',
        path: '/sparql-auth',
        port: config.sparqlEndpointPort,
        method: 'POST',
        json: true,
        body: "query=" + encodeURIComponent(query),
        headers: {
            "Content-type" : "application/x-www-form-urlencoded"
        }
      });
  }*/

/**
 * placeHolderMappings is a map string => string. This function replaces all
 * occurrences of %key% in query with value.
 */
sparql.formatQuery = function (query, placeholderMappings) {

   if (placeholderMappings == undefined) {
      return query;
   }

   for (var placeholder in placeholderMappings) {
      var re = new RegExp('%' + placeholder + '%', "g");
      query = query.replace(re, placeholderMappings[placeholder]);
   }

   return query;
}


module.exports = sparql
