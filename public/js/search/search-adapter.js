



class SearchAdapter {

    static list = [
        { 
            name: 'lookup',
            label: 'Lookup',
            factory: this.lookup
        }
        /*
        {
            name: 'virtuoso',
            label: 'Virtuoso SPARQL',
            factory: this.virtuoso
        }
        */
    ];

    constructor($http, endpoint, queryFormatter, resultFormatter) {
        this.http = $http;
        this.endpoint = endpoint;
        this.queryFormatter = queryFormatter;
        this.resultFormatter = resultFormatter;
    }

    static inferResourceTypes(docs) {
        // TODO:
    }
    

    static lookup($http, endpoint) {
        return new SearchAdapter($http, endpoint, function(query) {
            return `?query=${query}&format=json`;
        }, function(response) {
            var docs = response.data.docs;
            SearchAdapter.inferResourceTypes(docs);
            return docs;
        });
    }

    static virtuoso($http, endpoint) {
        var virtuosoAdapter = new SearchAdapter($http, endpoint, function (query) {
            var querySelector = /(?<=\?|&)query=[^(&#)]*/;

            // TODO: get the query input from the query
        }, function (results) {
            // TODO: format virtuoso search results
        });

        return virtuosoAdapter;
    }

   

    async search(query) {
        try {
            if (this.queryFormatter != null) {
                query = this.queryFormatter(query);
            }

            var results = await this.http.get(`${this.endpoint}${query}`);

            if (this.resultFormatter != null) {
                return this.resultFormatter(results);
            }

            return results;
        } catch (err) {
            console.log(err);
            return null;
        }
    }
}

module.exports = SearchAdapter;