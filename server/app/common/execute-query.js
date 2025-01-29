const axios = require('axios');
const Constants = require('./constants');

var sparql = {};

const sparqlEndpoint = (process.env.DATABUS_DATABASE_URL || Constants.DEFAULT_DATABASE_URL) + '/sparql';

/**
 * Executes a SELECT query against the SPARQL endpoint and returns a set of bindings or null
 * @param  {string} query - The SPARQL query to execute
 * @return {Array|null} - The bindings or null if an error occurs
 */
sparql.executeSelect = async function (query) {
  try {
    // Prepare the POST request data
    const data = `query=${encodeURIComponent(query)}`;

    const response = await axios.post(sparqlEndpoint + '?timeout=10000', data, {
      headers: {
        'Content-type': Constants.HTTP_CONTENT_TYPE_FORM,
        'Accept': Constants.HTTP_CONTENT_TYPE_JSON
      }
    });

    let bindings = response.data.results.bindings;

    // Prune the returned bindings
    for (let i in bindings) {
      bindings[i] = reduceBinding(bindings[i]);
    }

    return bindings;
  } catch (err) {
    console.log(err);
    return null;
  }
};

/**
 * Executes a CONSTRUCT query against the SPARQL endpoint and returns the result or null
 * @param  {string} query - The SPARQL query to execute
 * @param  {string} format - The desired response format
 * @return {Object|null} - The response data or null if an error occurs
 */
sparql.executeConstruct = async function (query, format) {
  try {
    // Prepare the POST request data
    const data = `query=${encodeURIComponent(query)}`;

    const response = await axios.post(`${sparqlEndpoint}?timeout=10000`, data, {
      headers: {
        'Content-type': Constants.HTTP_CONTENT_TYPE_FORM,
        'Accept': format
      }
    });

    return response.data;
  } catch (err) {
    console.log(err);
    return null;
  }
};

/**
 * Executes an ASK query against the SPARQL endpoint and returns the boolean result or null
 * @param  {string} query - The SPARQL query to execute
 * @return {boolean|null} - The boolean result or null if an error occurs
 */
sparql.executeAsk = async function (query) {
  try {
    // Prepare the POST request data
    const data = `query=${encodeURIComponent(query)}`;

    const response = await axios.post(sparqlEndpoint + '?timeout=10000', data, {
      headers: {
        'Content-type': Constants.HTTP_CONTENT_TYPE_FORM
      }
    });

    return response.data.boolean;
  } catch (err) {
    console.log(err);
    return null;
  }
};

/**
 * Reduces the binding entry objects to their value
 * @param  {Object} binding - The binding object to reduce
 * @return {Object} - The reduced binding object
 */
function reduceBinding(binding) {
  for (let key in binding) {
    binding[key] = binding[key].value;
  }

  return binding;
}

/**
 * Replaces all occurrences of %key% in the query with the corresponding value from placeholderMappings
 * @param  {string} query - The query to format
 * @param  {Object} placeholderMappings - A map of placeholders and their replacement values
 * @return {string} - The formatted query
 */
sparql.formatQuery = function (query, placeholderMappings) {
  if (placeholderMappings === undefined) {
    return query;
  }

  for (let placeholder in placeholderMappings) {
    const re = new RegExp('%' + placeholder + '%', 'g');
    query = query.replace(re, placeholderMappings[placeholder]);
  }

  return query;
};

module.exports = sparql;