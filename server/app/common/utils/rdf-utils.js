const streamifyString = require('streamify-string');
const rdfParser = require("rdf-parse").default;


class RdfUtils {


    static parseTurtle(text) {
        return new Promise(function (resolve, reject) {

            var quads = [];

            var textStream = streamifyString(text);
            
            rdfParser.parse(textStream, { contentType: 'text/turtle' })
                .on('data', (quad) => quads.push(quad))
                .on('error', (error) => reject(error))
                .on('end', () => resolve(quads));
        });
    }
}

module.exports = RdfUtils;